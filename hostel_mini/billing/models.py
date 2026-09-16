from django.db import models

from bookings.models import Booking
from staff.models import Employee


class Invoice(models.Model):
    class Status(models.TextChoices):
        UNPAID = "unpaid", "Chưa thanh toán"
        PARTIAL = "partial", "Thanh toán một phần"
        PAID = "paid", "Đã thanh toán"
        REFUNDED = "refunded", "Đã hoàn tiền"
        CANCELLED = "cancelled", "Đã hủy"

    id = models.BigAutoField(primary_key=True)
    invoice_code = models.CharField(max_length=30, unique=True)
    booking = models.ForeignKey(Booking, on_delete=models.PROTECT, related_name="invoices")
    subtotal_rooms = models.DecimalField(max_digits=14, decimal_places=2, default=0, help_text="Tổng tiền phòng")
    subtotal_services = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="Tổng tiền dịch vụ"
    )
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=0,
        help_text="Tổng phải thu = subtotal_rooms + subtotal_services - discount + tax",
    )
    paid_amount = models.DecimalField(
        max_digits=14, decimal_places=2, default=0, help_text="Tổng đã thu, cập nhật từ bảng payments"
    )
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.UNPAID)
    issued_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "invoices"
        indexes = [
            models.Index(fields=["status"], name="idx_invoices_status"),
        ]
        verbose_name = "Hóa đơn"
        verbose_name_plural = "Hóa đơn"

    def __str__(self):
        return self.invoice_code


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", "Tiền mặt"
        BANK_TRANSFER = "bank_transfer", "Chuyển khoản"
        CREDIT_CARD = "credit_card", "Thẻ tín dụng"
        E_WALLET = "e_wallet", "Ví điện tử"
        OTHER = "other", "Khác"

    class PaymentType(models.TextChoices):
        DEPOSIT = "deposit", "Đặt cọc"
        PARTIAL = "partial", "Thanh toán một phần"
        FULL = "full", "Thanh toán đủ"
        REFUND = "refund", "Hoàn tiền"

    id = models.BigAutoField(primary_key=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="payments")
    payment_method = models.CharField(max_length=15, choices=Method.choices)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_type = models.CharField(max_length=10, choices=PaymentType.choices, default=PaymentType.PARTIAL)
    received_by_employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, related_name="received_payments", null=True, blank=True
    )
    paid_at = models.DateTimeField(auto_now_add=True)
    reference_no = models.CharField(
        max_length=100, null=True, blank=True, help_text="Mã giao dịch/chuyển khoản nếu có"
    )
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        indexes = [
            models.Index(fields=["invoice"], name="idx_payments_invoice"),
        ]
        verbose_name = "Thanh toán"
        verbose_name_plural = "Thanh toán"

    def __str__(self):
        return f"{self.invoice.invoice_code} - {self.amount}"
