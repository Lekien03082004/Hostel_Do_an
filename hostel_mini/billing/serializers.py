from rest_framework import serializers
from .models import Invoice, Payment


class PaymentSerializer(serializers.ModelSerializer):
    received_by_name = serializers.CharField(source="received_by_employee.full_name", read_only=True)
    invoice_code = serializers.CharField(source="invoice.invoice_code", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "invoice",
            "invoice_code",
            "payment_method",
            "payment_type",
            "amount",
            "received_by_employee",
            "received_by_name",
            "reference_no",
            "note",
            "paid_at",
            "created_at",
        ]
        read_only_fields = ["id", "paid_at", "created_at"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Số tiền thanh toán phải lớn hơn 0.")
        return value


class InvoiceSerializer(serializers.ModelSerializer):
    booking_code = serializers.CharField(source="booking.booking_code", read_only=True)
    customer_name = serializers.CharField(source="booking.customer.full_name", read_only=True)
    branch_name = serializers.CharField(source="booking.branch.name", read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    remaining_amount = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            "id",
            "invoice_code",
            "booking",
            "booking_code",
            "customer_name",
            "branch_name",
            "subtotal_rooms",
            "subtotal_services",
            "discount_amount",
            "tax_amount",
            "total_amount",
            "paid_amount",
            "remaining_amount",
            "status",
            "payments",
            "issued_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "invoice_code",
            "booking",
            "paid_amount",
            "issued_at",
            "created_at",
            "updated_at",
        ]

    def get_remaining_amount(self, obj):
        remaining = obj.total_amount - obj.paid_amount
        return max(0, remaining)
