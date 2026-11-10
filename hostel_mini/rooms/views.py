from datetime import datetime
from django.db.models import Q
from django.utils.dateparse import parse_datetime, parse_date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import RoomType, RoomImage, Room, Season, RoomPrice
from .serializers import (
    RoomTypeSerializer,
    RoomImageSerializer,
    RoomSerializer,
    SeasonSerializer,
    RoomPriceSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 8
    page_size_query_param = "page_size"
    max_page_size = 100

    def paginate_queryset(self, queryset, request, view=None):
        if request.query_params.get("no_page") == "true" or request.query_params.get("page_size") == "all":
            return None
        try:
            return super().paginate_queryset(queryset, request, view)
        except Exception:
            paginator = self.django_paginator_class(queryset, self.get_page_size(request))
            self.page = paginator.page(1)
            self.request = request
            return list(self.page)

    def get_paginated_response(self, data):
        return Response({
            "count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "current_page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
            "results": data,
        })


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.prefetch_related("images").all().order_by("name")
    serializer_class = RoomTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    search_fields = ["name", "bed_type"]
    ordering_fields = ["name", "max_occupancy", "area_sqm"]

    def get_queryset(self):
        qs = RoomType.objects.prefetch_related("images").all().order_by("name")
        guests = self.request.query_params.get("guests") or self.request.query_params.get("min_occupancy")
        if guests and guests != "all":
            try:
                count = int(guests)
                qs = qs.filter(max_occupancy__gte=count)
            except ValueError:
                pass
        return qs


class RoomImageViewSet(viewsets.ModelViewSet):
    queryset = RoomImage.objects.select_related("room_type", "branch").all().order_by("sort_order")
    serializer_class = RoomImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["room_type", "branch", "is_primary"]

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
        rel_path = os.path.join("rooms", unique_filename)
        saved_path = default_storage.save(rel_path, file_obj)
        image_url = request.build_absolute_uri(settings.MEDIA_URL + saved_path.replace("\\", "/"))
        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)



class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related("branch", "room_type").all().order_by("branch__code", "room_number")
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    pagination_class = StandardResultsSetPagination
    filterset_fields = ["branch", "room_type", "status", "floor", "is_active"]
    search_fields = ["room_number", "branch__name", "branch__code"]
    ordering_fields = ["room_number", "floor", "status"]

    def get_queryset(self):
        qs = Room.objects.select_related("branch", "room_type").all().order_by("branch__code", "room_number")
        guests = self.request.query_params.get("guests") or self.request.query_params.get("min_occupancy")
        if guests and guests != "all":
            try:
                count = int(guests)
                qs = qs.filter(room_type__max_occupancy__gte=count)
            except ValueError:
                pass
        return qs

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """
        Tra cứu danh sách phòng còn trống:
        ?branch=<id>&check_in=2026-08-01T14:00:00&check_out=2026-08-03T12:00:00&room_type=<id>&guests=<int>
        """
        from django.utils import timezone

        branch_id = request.query_params.get("branch")
        check_in_str = request.query_params.get("check_in")
        check_out_str = request.query_params.get("check_out")
        room_type_id = request.query_params.get("room_type")
        guests = request.query_params.get("guests") or request.query_params.get("min_occupancy")

        if not check_in_str or not check_out_str:
            return Response(
                {"error": "Vui lòng truyền đủ tham số: check_in, check_out"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def _parse_dt(val, default_hour=14):
            if not val:
                return None
            cleaned = val.strip().replace(" ", "+")
            # Hỗ trợ định dạng ngày ngắn YYYY-MM-DD
            if len(cleaned) == 10 and cleaned.count("-") == 2:
                try:
                    d = parse_date(cleaned)
                    if d:
                        dt_comb = datetime.combine(d, datetime.min.time().replace(hour=default_hour))
                        return timezone.make_aware(dt_comb) if timezone.is_naive(dt_comb) else dt_comb
                except Exception:
                    pass
            try:
                dt = datetime.fromisoformat(cleaned)
            except ValueError:
                dt = parse_datetime(cleaned)
            if dt and timezone.is_naive(dt):
                dt = timezone.make_aware(dt)
            return dt

        check_in = _parse_dt(check_in_str, default_hour=14)
        check_out = _parse_dt(check_out_str, default_hour=12)

        if not check_in or not check_out:
            return Response(
                {"error": "Định dạng ngày check_in hoặc check_out không hợp lệ (hỗ trợ YYYY-MM-DD hoặc ISO format)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if check_out <= check_in:
            return Response(
                {"error": "check_out phải lớn hơn check_in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Import trễ để tránh circular import
        from bookings.models import BookingDetail

        # Tìm các phòng đã bị trùng lịch trong khoảng [check_in, check_out]
        overlapping_booking_rooms = BookingDetail.objects.filter(
            Q(check_in_planned__lt=check_out) & Q(check_out_planned__gt=check_in)
        ).exclude(
            Q(status="cancelled") | Q(booking__status="cancelled")
        ).values_list("room_id", flat=True)

        qs = (
            Room.objects.select_related("branch", "room_type")
            .filter(is_active=True)
            .exclude(id__in=overlapping_booking_rooms)
            .exclude(status__in=[Room.Status.MAINTENANCE, Room.Status.BLOCKED])
            .order_by("branch__code", "room_number")
        )

        if branch_id and branch_id != "all":
            qs = qs.filter(branch_id=branch_id)

        if room_type_id and room_type_id != "all":
            qs = qs.filter(room_type_id=room_type_id)

        if guests and guests != "all":
            try:
                count = int(guests)
                qs = qs.filter(room_type__max_occupancy__gte=count)
            except ValueError:
                pass

        # Hỗ trợ phân trang nếu client yêu cầu rõ tham số page
        if "page" in request.query_params:
            page = self.paginate_queryset(qs)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all().order_by("-start_date")
    serializer_class = SeasonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ["name"]
    ordering_fields = ["start_date", "end_date", "priority"]


class RoomPriceViewSet(viewsets.ModelViewSet):
    queryset = RoomPrice.objects.select_related("branch", "room_type", "season").all().order_by("branch", "room_type")
    serializer_class = RoomPriceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["branch", "room_type", "season", "rate_type", "is_active"]
    ordering_fields = ["price", "created_at"]
