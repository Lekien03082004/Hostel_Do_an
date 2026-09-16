from django.conf import settings
from django.db import models

from branches.models import Branch


class Role(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=30, unique=True, help_text="VD: admin, manager, receptionist, housekeeping")
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)

    class Meta:
        db_table = "roles"
        verbose_name = "Vai trò"
        verbose_name_plural = "Vai trò"

    def __str__(self):
        return self.name


class Employee(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employee_profile",
        help_text="Tài khoản đăng nhập hệ thống (Django User)",
    )
    employee_code = models.CharField(max_length=20, unique=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name="employees")
    home_branch = models.ForeignKey(
        Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name="employees", help_text="Chi nhánh chính (biên chế)"
    )
    avatar_url = models.URLField(
        max_length=500, null=True, blank=True,
        help_text="Đường dẫn ảnh đại diện nhân viên (lưu trên storage/CDN, không lưu binary trong DB)",
    )
    hire_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "employees"
        verbose_name = "Nhân viên"
        verbose_name_plural = "Nhân viên"

    def __str__(self):
        return f"{self.employee_code} - {self.full_name}"


class EmployeeBranch(models.Model):
    id = models.BigAutoField(primary_key=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="branch_assignments")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="employee_assignments")
    assigned_from = models.DateField()
    assigned_to = models.DateField(null=True, blank=True, help_text="NULL = vẫn đang làm việc tại chi nhánh này")

    class Meta:
        db_table = "employee_branches"
        constraints = [
            models.UniqueConstraint(fields=["employee", "branch", "assigned_from"], name="uq_empbranch"),
        ]
        verbose_name = "Điều động nhân viên"
        verbose_name_plural = "Điều động nhân viên"

    def __str__(self):
        return f"{self.employee.full_name} @ {self.branch.code}"


class Shift(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=50, help_text="VD: Ca sáng, Ca chiều, Ca đêm")
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        db_table = "shifts"
        verbose_name = "Ca làm việc"
        verbose_name_plural = "Ca làm việc"

    def __str__(self):
        return self.name


class EmployeeShiftSchedule(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Đã lên lịch"
        CHECKED_IN = "checked_in", "Đã chấm công"
        ABSENT = "absent", "Vắng"
        LEAVE = "leave", "Nghỉ phép"

    id = models.BigAutoField(primary_key=True)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="shift_schedules")
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name="shift_schedules")
    shift = models.ForeignKey(Shift, on_delete=models.PROTECT, related_name="schedules")
    work_date = models.DateField()
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SCHEDULED)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "employee_shift_schedule"
        constraints = [
            models.UniqueConstraint(fields=["employee", "work_date", "shift"], name="uq_schedule"),
        ]
        indexes = [
            models.Index(fields=["work_date", "branch"], name="idx_schedule_date"),
        ]
        verbose_name = "Lịch phân ca"
        verbose_name_plural = "Lịch phân ca"

    def __str__(self):
        return f"{self.employee.full_name} - {self.work_date} - {self.shift.name}"
