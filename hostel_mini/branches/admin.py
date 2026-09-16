from django.contrib import admin
from .models import Branch


@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "phone", "province", "district", "total_floors", "is_active", "created_at")
    list_filter = ("is_active", "province")
    search_fields = ("code", "name", "phone", "address")
    ordering = ("code",)
