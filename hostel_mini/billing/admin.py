from django.contrib import admin
from .models import Invoice, Payment


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 1


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_code",
        "booking",
        "subtotal_rooms",
        "subtotal_services",
        "discount_amount",
        "tax_amount",
        "total_amount",
        "paid_amount",
        "status",
        "issued_at",
    )
    list_filter = ("status", "issued_at")
    search_fields = ("invoice_code", "booking__booking_code")
    list_select_related = ("booking",)
    date_hierarchy = "issued_at"
    inlines = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "invoice",
        "payment_method",
        "payment_type",
        "amount",
        "received_by_employee",
        "reference_no",
        "paid_at",
    )
    list_filter = ("payment_method", "payment_type", "paid_at")
    search_fields = ("invoice__invoice_code", "reference_no")
    list_select_related = ("invoice", "received_by_employee")
    date_hierarchy = "paid_at"
