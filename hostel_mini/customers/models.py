from django.db import models


class Customer(models.Model):
    class IdCardType(models.TextChoices):
        CCCD = "cccd", "CCCD"
        CMND = "cmnd", "CMND"
        PASSPORT = "passport", "Passport"
        OTHER = "other", "Khác"

    id = models.BigAutoField(primary_key=True)
    full_name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20, null=True, blank=True, db_index=True)
    email = models.EmailField(max_length=100, null=True, blank=True)
    id_card_number = models.CharField(max_length=30, unique=True, null=True, blank=True)
    id_card_type = models.CharField(max_length=10, choices=IdCardType.choices, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality = models.CharField(max_length=50, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customers"
        indexes = [
            models.Index(fields=["full_name"], name="idx_customers_name"),
        ]
        verbose_name = "Khách hàng"
        verbose_name_plural = "Khách hàng"

    def __str__(self):
        return self.full_name
