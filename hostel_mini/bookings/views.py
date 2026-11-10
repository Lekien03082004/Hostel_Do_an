from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from rooms.models import Room
from .models import BookingSource, Booking, BookingDetail, Service, BookingService
from .serializers import (
    BookingSourceSerializer,
    ServiceSerializer,
    BookingDetailSerializer,
    BookingSerializer,
    BookingCreateSerializer,
    BookingServiceSerializer,
)


class BookingSourceViewSet(viewsets.ModelViewSet):
    queryset = BookingSource.objects.all().order_by("name")
    serializer_class = BookingSourceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["source_type", "is_active"]
    search_fields = ["name"]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.select_related("branch").all().order_by("category", "name")
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["branch", "category", "is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["price", "name", "category", "created_at"]

    @action(detail=False, methods=["post"], url_path="upload", permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def upload(self, request):
        file_obj = request.FILES.get("file") or request.FILES.get("image")
        if not file_obj:
            return Response({"error": "Vui lòng chọn tệp ảnh tải lên."}, status=status.HTTP_400_BAD_REQUEST)

        import os
        import uuid
        from django.conf import settings
        from django.core.files.storage import default_storage

        ext = os.path.splitext(file_obj.name)[1]
        unique_filename = f"{uuid.uuid4().hex[:12]}{ext}"
        rel_path = os.path.join("services", unique_filename)
        saved_path = default_storage.save(rel_path, file_obj)
        image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path.replace("\\", "/"))
        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)


class BookingDetailViewSet(viewsets.ModelViewSet):
    queryset = (
        BookingDetail.objects.select_related("booking", "room__room_type")
        .prefetch_related("services_used__service")
        .all()
        .order_by("-created_at")
    )
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["booking", "room", "status", "rate_type"]


class BookingViewSet(viewsets.ModelViewSet):
    queryset = (
        Booking.objects.select_related("branch", "customer", "booking_source", "created_by_employee")
        .prefetch_related(
            "details__room__room_type",
            "details__services_used__service",
        )
        .all()
        .order_by("-booked_at")
    )
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["branch", "status", "booking_source", "customer", "checkin_requested", "checkout_requested"]
    search_fields = ["booking_code", "customer__full_name", "customer__phone", "invoices__invoice_code"]
    ordering_fields = ["booked_at", "status", "created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

    @action(detail=False, methods=["get"], url_path="lookup", permission_classes=[permissions.AllowAny])
    def lookup(self, request):
        """Khách hàng tự tra cứu đơn đặt phòng qua mã đơn (BK...), mã hóa đơn (INV...), hoặc số điện thoại."""
        code = request.query_params.get("code", "").strip()
        phone = request.query_params.get("phone", "").strip()
        q = request.query_params.get("q", "").strip() or request.query_params.get("search", "").strip()

        if not code and not phone and not q:
            return Response(
                {"error": "Vui lòng cung cấp mã đơn đặt phòng, mã hóa đơn hoặc số điện thoại để tra cứu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.get_queryset()

        search_term = q or (code if code == phone else None)
        if search_term:
            qs = qs.filter(
                Q(booking_code__iexact=search_term)
                | Q(invoices__invoice_code__iexact=search_term)
                | Q(customer__phone__icontains=search_term)
            ).distinct()
        else:
            q_filter = Q()
            if code:
                q_filter |= Q(booking_code__iexact=code) | Q(invoices__invoice_code__iexact=code)
            if phone:
                q_filter |= Q(customer__phone__icontains=phone)
            qs = qs.filter(q_filter).distinct()

        serializer = BookingSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="my_bookings", permission_classes=[permissions.IsAuthenticated])
    def my_bookings(self, request):
        """Khách hàng đã đăng nhập xem tất cả các đơn đặt phòng của mình."""
        user = request.user
        q_filter = Q()
        if user.email:
            q_filter |= Q(customer__email__iexact=user.email)
        if user.username:
            q_filter |= Q(customer__phone__iexact=user.username)
        if user.first_name:
            q_filter |= Q(customer__full_name__icontains=user.first_name)

        try:
            emp = user.employee_profile
            if emp.phone:
                q_filter |= Q(customer__phone__iexact=emp.phone)
            if emp.email:
                q_filter |= Q(customer__email__iexact=emp.email)
            if emp.full_name:
                q_filter |= Q(customer__full_name__icontains=emp.full_name)
        except Exception:
            pass

        if not q_filter:
            q_filter = Q(customer__full_name__icontains=user.username)

        qs = self.get_queryset().filter(q_filter).distinct().order_by("-created_at")
        serializer = BookingSerializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="request_checkin", permission_classes=[permissions.AllowAny])
    def request_checkin(self, request, pk=None):
        """Khách hàng gửi yêu cầu nhận phòng trực tuyến."""
        booking = self.get_object()
        if booking.status in [Booking.Status.CHECKED_IN, Booking.Status.CHECKED_OUT, Booking.Status.CANCELLED]:
            return Response(
                {"error": f"Không thể gửi yêu cầu check-in cho đơn đặt phòng ở trạng thái '{booking.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get("note", "").strip() or request.data.get("checkin_note", "").strip()
        booking.checkin_requested = True
        booking.checkin_request_time = timezone.now()
        if note:
            booking.checkin_note = note
        booking.save(update_fields=["checkin_requested", "checkin_request_time", "checkin_note", "updated_at"])

        return Response({
            "message": "Gửi yêu cầu nhận phòng thành công. Lễ tân đã nhận được thông báo và sẽ chuẩn bị phòng cho bạn.",
            "booking": BookingSerializer(booking).data
        })

    @action(detail=True, methods=["post"], url_path="request_checkout", permission_classes=[permissions.AllowAny])
    def request_checkout(self, request, pk=None):
        """Khách hàng gửi yêu cầu trả phòng trực tuyến."""
        booking = self.get_object()
        if booking.status != Booking.Status.CHECKED_IN:
            return Response(
                {"error": f"Chỉ có thể gửi yêu cầu trả phòng khi phòng đang ở trạng thái 'Đang ở' (hiện tại: '{booking.get_status_display()}')."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        note = request.data.get("note", "").strip() or request.data.get("checkout_note", "").strip()
        booking.checkout_requested = True
        booking.checkout_request_time = timezone.now()
        if note:
            booking.checkout_note = note
        booking.save(update_fields=["checkout_requested", "checkout_request_time", "checkout_note", "updated_at"])

        return Response({
            "message": "Gửi yêu cầu trả phòng thành công. Lễ tân sẽ kiểm tra phòng và liên hệ với bạn ngay.",
            "booking": BookingSerializer(booking).data
        })

    @action(detail=True, methods=["post"], url_path="check_in")
    def check_in(self, request, pk=None):
        booking = self.get_object()
        if booking.status not in [Booking.Status.PENDING, Booking.Status.CONFIRMED]:
            return Response(
                {"error": f"Không thể check-in đơn đặt phòng ở trạng thái '{booking.get_status_display()}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        with transaction.atomic():
            booking.status = Booking.Status.CHECKED_IN
            booking.checkin_requested = False
            booking.save(update_fields=["status", "checkin_requested", "updated_at"])

            booking.details.filter(status=BookingDetail.Status.BOOKED).update(
                status=BookingDetail.Status.CHECKED_IN,
                check_in_actual=now,
                updated_at=now,
            )

            room_ids = booking.details.values_list("room_id", flat=True)
            Room.objects.filter(id__in=room_ids).update(status=Room.Status.OCCUPIED)

        return Response({"message": "Check-in thành công.", "status": booking.status, "booking": BookingSerializer(booking).data})

    @action(detail=True, methods=["post"], url_path="check_out")
    def check_out(self, request, pk=None):
        booking = self.get_object()
        if booking.status != Booking.Status.CHECKED_IN:
            return Response(
                {"error": f"Không thể check-out đơn đặt phòng chưa check-in (hiện tại: '{booking.get_status_display()}')."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        with transaction.atomic():
            booking.status = Booking.Status.CHECKED_OUT
            booking.checkout_requested = False
            booking.save(update_fields=["status", "checkout_requested", "updated_at"])

            booking.details.filter(status=BookingDetail.Status.CHECKED_IN).update(
                status=BookingDetail.Status.CHECKED_OUT,
                check_out_actual=now,
                updated_at=now,
            )

            room_ids = booking.details.values_list("room_id", flat=True)
            Room.objects.filter(id__in=room_ids).update(status=Room.Status.CLEANING)

        return Response({"message": "Check-out thành công.", "status": booking.status, "booking": BookingSerializer(booking).data})

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if booking.status in [Booking.Status.CHECKED_OUT, Booking.Status.CANCELLED]:
            return Response(
                {"error": f"Đơn đặt phòng đã ở trạng thái '{booking.get_status_display()}', không thể hủy."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()
        with transaction.atomic():
            booking.status = Booking.Status.CANCELLED
            booking.save(update_fields=["status", "updated_at"])

            booking.details.update(
                status=BookingDetail.Status.CANCELLED,
                updated_at=now,
            )

            room_ids = booking.details.values_list("room_id", flat=True)
            Room.objects.filter(id__in=room_ids).update(status=Room.Status.AVAILABLE)

        return Response({"message": "Hủy đơn đặt phòng thành công.", "status": booking.status})

    @action(detail=True, methods=["post"], url_path="add_service", permission_classes=[permissions.AllowAny])
    def add_service(self, request, pk=None):
        booking = self.get_object()
        detail_id = request.data.get("detail_id")
        service_id = request.data.get("service_id")
        quantity = int(request.data.get("quantity", 1))

        if not detail_id or not service_id:
            return Response({"error": "Vui lòng cung cấp detail_id và service_id."}, status=status.HTTP_400_BAD_REQUEST)

        detail = booking.details.filter(id=detail_id).first()
        if not detail:
            return Response({"error": "Không tìm thấy chi tiết phòng tương ứng trong đơn này."}, status=status.HTTP_404_NOT_FOUND)

        try:
            service = Service.objects.get(id=service_id, is_active=True)
        except Service.DoesNotExist:
            return Response({"error": "Dịch vụ không tồn tại hoặc đã ngừng hoạt động."}, status=status.HTTP_404_NOT_FOUND)

        unit_price = Decimal(str(request.data.get("unit_price", service.price)))

        with transaction.atomic():
            booking_service = BookingService.objects.create(
                booking_detail=detail,
                service=service,
                quantity=quantity,
                unit_price=unit_price,
            )

            # Cập nhật hóa đơn
            invoice = booking.invoices.first()
            if not invoice:
                from billing.models import Invoice
                import uuid
                today_str = timezone.now().strftime("%Y%m%d")
                invoice = Invoice.objects.create(
                    invoice_code=f"INV{today_str}{uuid.uuid4().hex[:4].upper()}",
                    booking=booking,
                    subtotal_rooms=Decimal("0"),
                    subtotal_services=Decimal("0"),
                    discount_amount=Decimal("0"),
                    tax_amount=Decimal("0"),
                    total_amount=Decimal("0"),
                    paid_amount=Decimal("0"),
                    status=Invoice.Status.UNPAID,
                )

            service_cost = unit_price * Decimal(quantity)
            invoice.subtotal_services += service_cost
            invoice.total_amount = (
                invoice.subtotal_rooms + invoice.subtotal_services - invoice.discount_amount + invoice.tax_amount
            )
            invoice.save(update_fields=["subtotal_services", "total_amount", "updated_at"])

        return Response(BookingServiceSerializer(booking_service).data, status=status.HTTP_201_CREATED)
