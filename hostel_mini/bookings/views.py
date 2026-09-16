from decimal import Decimal
from django.db import transaction
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
    queryset = Service.objects.select_related("branch").all().order_by("name")
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["branch", "is_active"]
    search_fields = ["name"]
    ordering_fields = ["price", "name"]


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
    filterset_fields = ["branch", "status", "booking_source", "customer"]
    search_fields = ["booking_code", "customer__full_name", "customer__phone"]
    ordering_fields = ["booked_at", "status", "created_at"]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return BookingSerializer

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
            booking.save(update_fields=["status", "updated_at"])

            booking.details.filter(status=BookingDetail.Status.BOOKED).update(
                status=BookingDetail.Status.CHECKED_IN,
                check_in_actual=now,
                updated_at=now,
            )

            room_ids = booking.details.values_list("room_id", flat=True)
            Room.objects.filter(id__in=room_ids).update(status=Room.Status.OCCUPIED)

        return Response({"message": "Check-in thành công.", "status": booking.status})

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
            booking.save(update_fields=["status", "updated_at"])

            booking.details.filter(status=BookingDetail.Status.CHECKED_IN).update(
                status=BookingDetail.Status.CHECKED_OUT,
                check_out_actual=now,
                updated_at=now,
            )

            room_ids = booking.details.values_list("room_id", flat=True)
            Room.objects.filter(id__in=room_ids).update(status=Room.Status.CLEANING)

        return Response({"message": "Check-out thành công.", "status": booking.status})

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

    @action(detail=True, methods=["post"], url_path="add_service")
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

            # Cập nhật hóa đơn nếu có
            invoice = booking.invoices.first()
            if invoice:
                service_cost = unit_price * Decimal(quantity)
                invoice.subtotal_services += service_cost
                invoice.total_amount = (
                    invoice.subtotal_rooms + invoice.subtotal_services - invoice.discount_amount + invoice.tax_amount
                )
                invoice.save(update_fields=["subtotal_services", "total_amount", "updated_at"])

        return Response(BookingServiceSerializer(booking_service).data, status=status.HTTP_201_CREATED)
