from django.contrib import admin
from .models import BookingSource, Booking, BookingDetail, Service, BookingService


@admin.register(BookingSource)
class BookingSourceAdmin(admin.ModelAdmin):
    list_display = ("name", "source_type", "commission_rate", "is_active", "created_at")
    list_filter = ("source_type", "is_active")
    search_fields = ("name",)


class BookingDetailInline(admin.StackedInline):
    model = BookingDetail
    extra = 1


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = (
        "booking_code",
        "branch",
        "customer",
        "booking_source",
        "status",
        "created_by_employee",
        "booked_at",
    )
    list_filter = ("branch", "status", "booking_source")
    search_fields = ("booking_code", "customer__full_name", "customer__phone")
    list_select_related = ("branch", "customer", "booking_source", "created_by_employee")
    date_hierarchy = "booked_at"
    inlines = [BookingDetailInline]


@admin.register(BookingDetail)
class BookingDetailAdmin(admin.ModelAdmin):
    list_display = (
        "booking",
        "room",
        "rate_type",
        "check_in_planned",
        "check_out_planned",
        "unit_price",
        "status",
    )
    list_filter = ("status", "rate_type")
    search_fields = ("booking__booking_code", "room__room_number")
    list_select_related = ("booking", "room")


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("name", "branch", "unit", "price", "is_active", "created_at")
    list_filter = ("branch", "is_active")
    search_fields = ("name",)


@admin.register(BookingService)
class BookingServiceAdmin(admin.ModelAdmin):
    list_display = ("booking_detail", "service", "quantity", "unit_price", "used_at")
    list_select_related = ("booking_detail", "service")
