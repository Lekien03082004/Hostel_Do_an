from django.db import models

from branches.models import Branch
from customers.models import Customer
from rooms.models import Room
from staff.models import Employee


class BookingSource(models.Model):
    class SourceType(models.TextChoices):
        DIRECT = "direct", "Trực tiếp"
        OTA = "ota", "OTA"
        PHONE = "phone", "Điện thoại"
        WALK_IN = "walk_in", "Khách vãng lai"
        OTHER = "other", "Khác"

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, help_text="VD: Trực tiếp, Booking.com, Agoda, Traveloka")
    source_type = models.CharField(max_length=10, choices=SourceType.choices, default=SourceType.DIRECT)
    commission_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, help_text="Phần trăm hoa hồng OTA, VD: 15.00"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "booking_sources"
        verbose_name = "Nguồn đặt phòng"
        verbose_name_plural = "Nguồn đặt phòng"

    def __str__(self):
        return self.name


class Booking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Chờ xác nhận"
        CONFIRMED = "confirmed", "Đã xác nhận"
        CHECKED_IN = "checked_in", "Đã check-in"
        CHECKED_OUT = "checked_out", "Đã check-out"
        CANCELLED = "cancelled", "Đã hủy"
        NO_SHOW = "no_show", "Không đến"

    id = models.BigAutoField(primary_key=True)
    booking_code = models.CharField(max_length=30, unique=True, help_text="VD: BK20260823001")
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="bookings")
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="bookings")
    booking_source = models.ForeignKey(BookingSource, on_delete=models.PROTECT, related_name="bookings")
    created_by_employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, related_name="created_bookings", null=True, blank=True,
        help_text="Nhân viên tạo đơn (NULL nếu khách tự đặt online)",
    )
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    booked_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(null=True, blank=True)

    # Khách hàng tự gửi yêu cầu Check-in & Check-out
    checkin_requested = models.BooleanField(default=False, help_text="Khách đã gửi yêu cầu nhận phòng")
    checkin_request_time = models.DateTimeField(null=True, blank=True, help_text="Thời điểm gửi yêu cầu check-in")
    checkin_note = models.CharField(max_length=255, null=True, blank=True, help_text="Ghi chú nhận phòng từ khách")
    checkout_requested = models.BooleanField(default=False, help_text="Khách đã gửi yêu cầu trả phòng")
    checkout_request_time = models.DateTimeField(null=True, blank=True, help_text="Thời điểm gửi yêu cầu check-out")
    checkout_note = models.CharField(max_length=255, null=True, blank=True, help_text="Ghi chú trả phòng từ khách")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        indexes = [
            models.Index(fields=["status"], name="idx_bookings_status"),
            models.Index(fields=["branch", "status"], name="idx_bookings_branch"),
        ]
        verbose_name = "Đơn đặt phòng"
        verbose_name_plural = "Đơn đặt phòng"

    def __str__(self):
        return self.booking_code


class BookingDetail(models.Model):

    class RateType(models.TextChoices):
        HOURLY = "hourly", "Theo giờ"
        DAILY = "daily", "Theo ngày"
        MONTHLY = "monthly", "Theo tháng"

    class Status(models.TextChoices):
        BOOKED = "booked", "Đã đặt"
        CHECKED_IN = "checked_in", "Đã check-in"
        CHECKED_OUT = "checked_out", "Đã check-out"
        CANCELLED = "cancelled", "Đã hủy"

    id = models.BigAutoField(primary_key=True)
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="details")
    room = models.ForeignKey(Room, on_delete=models.PROTECT, related_name="booking_details")
    rate_type = models.CharField(max_length=10, choices=RateType.choices, default=RateType.DAILY)
    check_in_planned = models.DateTimeField()
    check_out_planned = models.DateTimeField()
    check_in_actual = models.DateTimeField(null=True, blank=True)
    check_out_actual = models.DateTimeField(null=True, blank=True)
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2,
        help_text="Snapshot giá tại thời điểm đặt (không tham chiếu động vào room_prices)",
    )
    adults = models.PositiveSmallIntegerField(default=1)
    children = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.BOOKED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "booking_details"
        constraints = [
            models.CheckConstraint(
                condition=models.Q(check_out_planned__gt=models.F("check_in_planned")),
                name="chk_details_dates",
            ),
        ]
        indexes = [
            models.Index(fields=["room", "check_in_planned", "check_out_planned"], name="idx_details_room_dates"),
            models.Index(fields=["booking"], name="idx_details_booking"),
        ]
        verbose_name = "Chi tiết đặt phòng"
        verbose_name_plural = "Chi tiết đặt phòng"

    def __str__(self):
        return f"{self.booking.booking_code} - {self.room.room_number}"


class Service(models.Model):
    class Category(models.TextChoices):
        FOOD_BEVERAGE = "food_beverage", "Ẩm thực & Đồ uống"
        LAUNDRY = "laundry", "Giặt là & Giặt sấy"
        SPA_WELLNESS = "spa_wellness", "Spa & Chăm sóc sức khỏe"
        TRANSPORT = "transport", "Xe đưa đón & Di chuyển"
        ROOM_AMENITIES = "room_amenities", "Tiện ích & Buồng phòng"
        OTHER = "other", "Dịch vụ khác"

    id = models.BigAutoField(primary_key=True)
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="services", null=True, blank=True,
        help_text="NULL = dịch vụ áp dụng chung toàn chuỗi",
    )
    category = models.CharField(
        max_length=30,
        choices=Category.choices,
        default=Category.FOOD_BEVERAGE,
        help_text="Phân loại danh mục dịch vụ",
    )
    name = models.CharField(max_length=100, help_text="VD: Ăn sáng, Giặt ủi, Đưa đón sân bay")
    unit = models.CharField(max_length=30, default="lần", help_text="VD: lần, suất, kg, tiếng, chuyến")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(null=True, blank=True, help_text="Mô tả chi tiết món ăn / quy trình dịch vụ")
    image_url = models.URLField(
        max_length=500, null=True, blank=True,
        help_text="Đường dẫn ảnh minh họa dịch vụ",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "services"
        verbose_name = "Dịch vụ"
        verbose_name_plural = "Dịch vụ"

    def __str__(self):
        return self.name


class BookingService(models.Model):
    id = models.BigAutoField(primary_key=True)
    booking_detail = models.ForeignKey(BookingDetail, on_delete=models.CASCADE, related_name="services_used")
    service = models.ForeignKey(Service, on_delete=models.PROTECT, related_name="booking_services")
    quantity = models.PositiveSmallIntegerField(default=1)
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, help_text="Snapshot giá dịch vụ tại thời điểm sử dụng"
    )
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "booking_services"
        verbose_name = "Dịch vụ đã sử dụng"
        verbose_name_plural = "Dịch vụ đã sử dụng"

    def __str__(self):
        return f"{self.booking_detail} - {self.service.name} x{self.quantity}"
