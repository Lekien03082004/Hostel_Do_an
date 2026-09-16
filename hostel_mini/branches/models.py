from django.db import models


class Branch(models.Model):
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=20, unique=True, help_text="Mã chi nhánh, VD: HN01, SG02")
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255)
    ward = models.CharField(max_length=100, null=True, blank=True)
    district = models.CharField(max_length=100, null=True, blank=True)
    province = models.CharField(max_length=100, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    total_floors = models.PositiveSmallIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "branches"
        verbose_name = "Chi nhánh"
        verbose_name_plural = "Chi nhánh"

    def __str__(self):
        return f"{self.code} - {self.name}"
