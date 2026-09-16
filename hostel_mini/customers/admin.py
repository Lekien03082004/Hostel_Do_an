from django.contrib import admin
from .models import Customer


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = (
        "full_name",
        "phone",
        "email",
        "id_card_number",
        "id_card_type",
        "nationality",
        "created_at",
    )
    list_filter = ("id_card_type", "nationality", "created_at")
    search_fields = ("full_name", "phone", "email", "id_card_number")
    ordering = ("-created_at",)
