"""
App: rooms
Copy nội dung này vào rooms/models.py
Yêu cầu: app "branches" phải nằm trong INSTALLED_APPS trước "rooms"
"""
from django.db import models

from branches.models import Branch


class RoomType(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, help_text="VD: Standard, Deluxe, Suite")
    description = models.TextField(null=True, blank=True)
    max_occupancy = models.PositiveSmallIntegerField(default=2)
    bed_type = models.CharField(max_length=50, null=True, blank=True)
    area_sqm = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "room_types"
        verbose_name = "Loại phòng"
        verbose_name_plural = "Loại phòng"

    def __str__(self):
        return self.name


class RoomImage(models.Model):
    id = models.BigAutoField(primary_key=True)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name="images")
    branch = models.ForeignKey(
        Branch, on_delete=models.CASCADE, related_name="room_images", null=True, blank=True,
        help_text="NULL = ảnh minh họa chung; điền cụ thể nếu ảnh chụp riêng tại 1 chi nhánh",
    )
    image_url = models.URLField(max_length=500, help_text="Đường dẫn ảnh trên storage/CDN, không lưu binary")
    is_primary = models.BooleanField(default=False, help_text="Ảnh đại diện/thumbnail chính")
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "room_images"
        ordering = ["sort_order"]
        indexes = [
            models.Index(fields=["room_type", "sort_order"], name="idx_roomimages_type"),
        ]
        verbose_name = "Ảnh loại phòng"
        verbose_name_plural = "Ảnh loại phòng"

    def __str__(self):
        return f"Ảnh {self.room_type.name} #{self.id}"


class Room(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Trống"
        OCCUPIED = "occupied", "Đang có khách"
        CLEANING = "cleaning", "Đang dọn dẹp"
        MAINTENANCE = "maintenance", "Bảo trì"
        BLOCKED = "blocked", "Khóa phòng"

    id = models.BigAutoField(primary_key=True)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="rooms")
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name="rooms")
    room_number = models.CharField(max_length=20, help_text="VD: 101, 305")
    floor = models.PositiveSmallIntegerField(null=True, blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.AVAILABLE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rooms"
        constraints = [
            models.UniqueConstraint(fields=["branch", "room_number"], name="uq_rooms_branch_number"),
        ]
        indexes = [
            models.Index(fields=["status"], name="idx_rooms_status"),
            models.Index(fields=["branch", "room_type"], name="idx_rooms_branch_type"),
        ]
        verbose_name = "Phòng"
        verbose_name_plural = "Phòng"

    def __str__(self):
        return f"{self.branch.code} - Phòng {self.room_number}"


class Season(models.Model):

    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=100, help_text="VD: Cao điểm Tết 2027, Thấp điểm hè")
    start_date = models.DateField()
    end_date = models.DateField()
    priority = models.PositiveSmallIntegerField(
        default=0, help_text="Ưu tiên khi trùng khoảng ngày, số lớn hơn = ưu tiên hơn"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "seasons"
        constraints = [
            models.CheckConstraint(condition=models.Q(end_date__gte=models.F("start_date")), name="chk_seasons_dates"),
        ]
        indexes = [
            models.Index(fields=["start_date", "end_date"], name="idx_seasons_dates"),
        ]
        verbose_name = "Mùa giá"
        verbose_name_plural = "Mùa giá"

    def __str__(self):
        return self.name


class RoomPrice(models.Model):
    class RateType(models.TextChoices):
        HOURLY = "hourly", "Theo giờ"
        DAILY = "daily", "Theo ngày"
        MONTHLY = "monthly", "Theo tháng"

    id = models.BigAutoField(primary_key=True)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name="room_prices")
    room_type = models.ForeignKey(RoomType, on_delete=models.PROTECT, related_name="prices")
    season = models.ForeignKey(
        Season, on_delete=models.CASCADE, related_name="room_prices", null=True, blank=True,
        help_text="NULL = giá mặc định (áp dụng khi không rơi vào mùa nào)",
    )
    rate_type = models.CharField(max_length=10, choices=RateType.choices, default=RateType.DAILY)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    first_hours = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Số giờ đầu tính trong đơn giá (chỉ dùng khi rate_type=hourly)"
    )
    extra_hour_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Giá mỗi giờ phát sinh thêm (chỉ dùng khi rate_type=hourly)",
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "room_prices"
        constraints = [
            models.UniqueConstraint(
                fields=["branch", "room_type", "season", "rate_type"], name="uq_prices_combo"
            ),
        ]
        verbose_name = "Bảng giá phòng"
        verbose_name_plural = "Bảng giá phòng"

    def __str__(self):
        return f"{self.branch.code} - {self.room_type.name} - {self.rate_type}"
