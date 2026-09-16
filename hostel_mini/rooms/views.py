from datetime import datetime
from django.db.models import Q
from django.utils.dateparse import parse_datetime, parse_date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import RoomType, RoomImage, Room, Season, RoomPrice
from .serializers import (
    RoomTypeSerializer,
    RoomImageSerializer,
    RoomSerializer,
    SeasonSerializer,
    RoomPriceSerializer,
)


class RoomTypeViewSet(viewsets.ModelViewSet):
    queryset = RoomType.objects.prefetch_related("images").all().order_by("name")
    serializer_class = RoomTypeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    search_fields = ["name", "bed_type"]
    ordering_fields = ["name", "max_occupancy", "area_sqm"]


class RoomImageViewSet(viewsets.ModelViewSet):
    queryset = RoomImage.objects.select_related("room_type", "branch").all().order_by("sort_order")
    serializer_class = RoomImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["room_type", "branch", "is_primary"]


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related("branch", "room_type").all().order_by("branch__code", "room_number")
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["branch", "room_type", "status", "floor", "is_active"]
    search_fields = ["room_number", "branch__name", "branch__code"]
    ordering_fields = ["room_number", "floor", "status"]

    @action(detail=False, methods=["get"], url_path="available")
    def available(self, request):
        """
        Tra cứu danh sách phòng còn trống:
        ?branch=<id>&check_in=2026-08-01T14:00:00&check_out=2026-08-03T12:00:00&room_type=<id>
        """
        branch_id = request.query_params.get("branch")
        check_in_str = request.query_params.get("check_in")
        check_out_str = request.query_params.get("check_out")
        room_type_id = request.query_params.get("room_type")

        if not branch_id or not check_in_str or not check_out_str:
            return Response(
                {"error": "Vui lòng truyền đủ tham số: branch, check_in, check_out"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        def _parse_dt(val):
            if not val:
                return None
            cleaned = val.strip().replace(" ", "+")
            try:
                return datetime.fromisoformat(cleaned)
            except ValueError:
                return parse_datetime(cleaned) or parse_date(cleaned)

        check_in = _parse_dt(check_in_str)
        check_out = _parse_dt(check_out_str)

        if not check_in or not check_out:
            return Response(
                {"error": "Định dạng ngày check_in hoặc check_out không hợp lệ (hỗ trợ ISO format)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if check_out <= check_in:
            return Response(
                {"error": "check_out phải lớn hơn check_in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Import trễ để tránh circular import
        from bookings.models import BookingDetail

        # Tìm các phòng đã bị trùng lịch
        overlapping_booking_rooms = BookingDetail.objects.filter(
            Q(check_in_planned__lt=check_out) & Q(check_out_planned__gt=check_in)
        ).exclude(
            Q(status="cancelled") | Q(booking__status="cancelled")
        ).values_list("room_id", flat=True)

        qs = (
            Room.objects.select_related("branch", "room_type")
            .filter(branch_id=branch_id, is_active=True)
            .exclude(id__in=overlapping_booking_rooms)
            .exclude(status__in=[Room.Status.MAINTENANCE, Room.Status.BLOCKED])
        )

        if room_type_id:
            qs = qs.filter(room_type_id=room_type_id)

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
