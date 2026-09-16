from django.contrib import admin
from .models import Role, Employee, EmployeeBranch, Shift, EmployeeShiftSchedule


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "description")
    search_fields = ("code", "name")


class EmployeeBranchInline(admin.TabularInline):
    model = EmployeeBranch
    extra = 1


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
        "employee_code",
        "full_name",
        "role",
        "home_branch",
        "phone",
        "email",
        "user",
        "is_active",
        "hire_date",
    )
    list_filter = ("role", "home_branch", "is_active")
    search_fields = ("employee_code", "full_name", "phone", "email", "user__username")
    autocomplete_fields = ["home_branch"]
    inlines = [EmployeeBranchInline]


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ("name", "start_time", "end_time")


@admin.register(EmployeeShiftSchedule)
class EmployeeShiftScheduleAdmin(admin.ModelAdmin):
    list_display = ("employee", "branch", "shift", "work_date", "status", "created_at")
    list_filter = ("branch", "shift", "status", "work_date")
    search_fields = ("employee__full_name", "employee__employee_code")
    date_hierarchy = "work_date"
