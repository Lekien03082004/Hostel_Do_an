from decimal import Decimal
import uuid
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from branches.models import Branch
from customers.models import Customer
from customers.serializers import CustomerSerializer
from rooms.models import Room, RoomPrice
from .models import BookingSource, Booking, BookingDetail, Service, BookingService


class BookingSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingSource
        fields = ["id", "name", "source_type", "commission_rate", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class ServiceSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Service
        fields = ["id", "branch", "branch_name", "name", "unit", "price", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class BookingServiceSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    service_unit = serializers.CharField(source="service.unit", read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = BookingService
        fields = ["id", "booking_detail", "service", "service_name", "service_unit", "quantity", "unit_price", "total_price", "used_at"]
        read_only_fields = ["id", "used_at"]

    def get_total_price(self, obj):
        return obj.quantity * obj.unit_price


class BookingDetailSerializer(serializers.ModelSerializer):
    room_number = serializers.CharField(source="room.room_number", read_only=True)
    room_type_name = serializers.CharField(source="room.room_type.name", read_only=True)
    services_used = BookingServiceSerializer(many=True, read_only=True)

    class Meta:
        model = BookingDetail
        fields = [
            "id",
            "booking",
            "room",
            "room_number",
            "room_type_name",
            "rate_type",
            "check_in_planned",
            "check_out_planned",
            "check_in_actual",
            "check_out_actual",
            "unit_price",
            "adults",
            "children",
            "status",
            "services_used",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BookingSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_code = serializers.CharField(source="branch.code", read_only=True)
    customer = CustomerSerializer(read_only=True)
    booking_source_name = serializers.CharField(source="booking_source.name", read_only=True)
    created_by_name = serializers.CharField(source="created_by_employee.full_name", read_only=True)
    details = BookingDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id",
            "booking_code",
            "branch",
            "branch_code",
            "branch_name",
            "customer",
            "booking_source",
            "booking_source_name",
            "created_by_employee",
            "created_by_name",
            "status",
            "booked_at",
            "note",
            "details",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "booking_code", "booked_at", "created_at", "updated_at"]


class BookingDetailCreateInputSerializer(serializers.Serializer):
    room = serializers.PrimaryKeyRelatedField(queryset=Room.objects.filter(is_active=True))
    rate_type = serializers.ChoiceField(choices=BookingDetail.RateType.choices, default=BookingDetail.RateType.DAILY)
    check_in_planned = serializers.DateTimeField()
    check_out_planned = serializers.DateTimeField()
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    adults = serializers.IntegerField(default=1, min_value=1)
    children = serializers.IntegerField(default=0, min_value=0)

    def validate(self, data):
        if data["check_out_planned"] <= data["check_in_planned"]:
            raise serializers.ValidationError({"check_out_planned": "check_out phải lớn hơn check_in."})
        return data


class BookingCreateSerializer(serializers.Serializer):
    branch = serializers.PrimaryKeyRelatedField(queryset=Branch.objects.filter(is_active=True))
    booking_source = serializers.PrimaryKeyRelatedField(queryset=BookingSource.objects.filter(is_active=True))
    customer_id = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all(), required=False, allow_null=True)
    customer_data = CustomerSerializer(required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True, default="")
    details = BookingDetailCreateInputSerializer(many=True)

    def validate(self, data):
        if not data.get("customer_id") and not data.get("customer_data"):
            raise serializers.ValidationError("Cần cung cấp customer_id (khách có sẵn) hoặc customer_data (khách mới).")
        if not data.get("details"):
            raise serializers.ValidationError({"details": "Đơn đặt phòng cần ít nhất 1 chi tiết phòng."})
        return data

    def create(self, validated_data):
        branch = validated_data["branch"]
        booking_source = validated_data["booking_source"]
        customer = validated_data.get("customer_id")
        customer_data = validated_data.get("customer_data")
        note = validated_data.get("note", "")
        details_data = validated_data["details"]

        request = self.context.get("request")
        employee = None
        if request and hasattr(request.user, "employee_profile"):
            employee = request.user.employee_profile

        with transaction.atomic():
            if not customer and customer_data:
                customer = Customer.objects.create(**customer_data)

            # Sinh mã đặt phòng duy nhất: BK + YYYYMMDD + 4 ký tự ngẫu nhiên
            today_str = timezone.now().strftime("%Y%m%d")
            code_suffix = uuid.uuid4().hex[:4].upper()
            booking_code = f"BK{today_str}{code_suffix}"

            booking = Booking.objects.create(
                booking_code=booking_code,
                branch=branch,
                customer=customer,
                booking_source=booking_source,
                created_by_employee=employee,
                status=Booking.Status.CONFIRMED,
                note=note,
            )

            total_room_cost = Decimal("0")
            for detail_item in details_data:
                room = detail_item["room"]
                rate_type = detail_item["rate_type"]
                check_in = detail_item["check_in_planned"]
                check_out = detail_item["check_out_planned"]
                unit_price = detail_item.get("unit_price")

                if unit_price is None:
                    # Tra cứu giá mặc định từ RoomPrice nếu không truyền đơn giá
                    active_price = RoomPrice.objects.filter(
                        branch=branch,
                        room_type=room.room_type,
                        rate_type=rate_type,
                        is_active=True,
                    ).order_by("-season__priority", "-created_at").first()
                    unit_price = active_price.price if active_price else Decimal("0")

                BookingDetail.objects.create(
                    booking=booking,
                    room=room,
                    rate_type=rate_type,
                    check_in_planned=check_in,
                    check_out_planned=check_out,
                    unit_price=unit_price,
                    adults=detail_item.get("adults", 1),
                    children=detail_item.get("children", 0),
                    status=BookingDetail.Status.BOOKED,
                )

                # Tính tổng tiền phòng dựa theo số ngày / giờ ước tính
                duration = check_out - check_in
                if rate_type == BookingDetail.RateType.DAILY:
                    days = max(1, duration.days)
                    total_room_cost += unit_price * Decimal(days)
                elif rate_type == BookingDetail.RateType.HOURLY:
                    hours = max(1, int(duration.total_seconds() // 3600))
                    total_room_cost += unit_price * Decimal(hours)
                else:
                    total_room_cost += unit_price

            # Tự động tạo hóa đơn sơ bộ trong billing
            from billing.models import Invoice
            invoice_code = f"INV{today_str}{code_suffix}"
            Invoice.objects.create(
                invoice_code=invoice_code,
                booking=booking,
                subtotal_rooms=total_room_cost,
                subtotal_services=Decimal("0"),
                discount_amount=Decimal("0"),
                tax_amount=Decimal("0"),
                total_amount=total_room_cost,
                paid_amount=Decimal("0"),
                status=Invoice.Status.UNPAID,
            )

            return booking

    def to_representation(self, instance):
        return BookingSerializer(instance, context=self.context).data
