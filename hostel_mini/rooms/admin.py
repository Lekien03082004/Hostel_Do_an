from django.contrib import admin
from .models import RoomType, RoomImage, Room, Season, RoomPrice


class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1


@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "max_occupancy", "bed_type", "area_sqm", "created_at")
    search_fields = ("name",)
    inlines = [RoomImageInline]


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("room_number", "branch", "room_type", "floor", "status", "is_active", "created_at")
    list_filter = ("branch", "room_type", "status", "floor", "is_active")
    search_fields = ("room_number", "branch__name", "branch__code")
    list_select_related = ("branch", "room_type")


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
    list_display = ("name", "start_date", "end_date", "priority", "created_at")
    list_filter = ("start_date", "end_date")
    search_fields = ("name",)


@admin.register(RoomPrice)
class RoomPriceAdmin(admin.ModelAdmin):
    list_display = ("branch", "room_type", "season", "rate_type", "price", "first_hours", "extra_hour_price", "is_active")
    list_filter = ("branch", "room_type", "rate_type", "season", "is_active")
    list_select_related = ("branch", "room_type", "season")


@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = ("room_type", "branch", "is_primary", "sort_order", "created_at")
    list_filter = ("is_primary", "room_type", "branch")
