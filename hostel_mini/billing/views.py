from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, F
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Invoice, Payment
from .serializers import InvoiceSerializer, PaymentSerializer
from bookings.models import BookingDetail, BookingService


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = (
        Invoice.objects.select_related("booking__customer", "booking__branch")
        .prefetch_related("payments__received_by_employee")
        .all()
        .order_by("-issued_at")
    )
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["status", "booking"]
    search_fields = ["invoice_code", "booking__booking_code", "booking__customer__full_name"]
    ordering_fields = ["issued_at", "total_amount", "paid_amount"]

    @action(detail=True, methods=["post"], url_path="recalculate")
    def recalculate(self, request, pk=None):
        """Tính toán lại tổng tiền từ chi tiết phòng và dịch vụ thực tế."""
        invoice = self.get_object()
        booking = invoice.booking

        with transaction.atomic():
            # 1. Tính tiền phòng
            total_room_cost = Decimal("0")
            for detail in booking.details.exclude(status=BookingDetail.Status.CANCELLED):
                check_in = detail.check_in_actual or detail.check_in_planned
                check_out = detail.check_out_actual or detail.check_out_planned
                duration = check_out - check_in

                if detail.rate_type == BookingDetail.RateType.DAILY:
                    days = max(1, duration.days)
                    total_room_cost += detail.unit_price * Decimal(days)
                elif detail.rate_type == BookingDetail.RateType.HOURLY:
                    hours = max(1, int(duration.total_seconds() // 3600))
                    total_room_cost += detail.unit_price * Decimal(hours)
                else:
                    total_room_cost += detail.unit_price

            # 2. Tính tiền dịch vụ
            services_sum = (
                BookingService.objects.filter(booking_detail__booking=booking)
                .aggregate(total=Sum(F("quantity") * F("unit_price")))
                .get("total")
                or Decimal("0")
            )

            # 3. Tính tiền đã thanh toán
            paid_sum = invoice.payments.aggregate(total=Sum("amount")).get("total") or Decimal("0")

            invoice.subtotal_rooms = total_room_cost
            invoice.subtotal_services = services_sum
            invoice.total_amount = (
                invoice.subtotal_rooms + invoice.subtotal_services - invoice.discount_amount + invoice.tax_amount
            )
            invoice.paid_amount = paid_sum

            if invoice.paid_amount >= invoice.total_amount and invoice.total_amount > 0:
                invoice.status = Invoice.Status.PAID
            elif invoice.paid_amount > 0:
                invoice.status = Invoice.Status.PARTIAL
            else:
                invoice.status = Invoice.Status.UNPAID

            invoice.save()

        return Response(InvoiceSerializer(invoice).data)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = (
        Payment.objects.select_related("invoice__booking", "received_by_employee")
        .all()
        .order_by("-paid_at")
    )
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["invoice", "payment_method", "payment_type"]
    search_fields = ["invoice__invoice_code", "reference_no"]
    ordering_fields = ["paid_at", "amount"]

    def perform_create(self, serializer):
        employee = None
        user = self.request.user
        if hasattr(user, "employee_profile"):
            employee = user.employee_profile

        with transaction.atomic():
            payment = serializer.save(received_by_employee=employee)
            invoice = payment.invoice

            # Cập nhật số tiền đã trả và trạng thái hóa đơn
            total_paid = invoice.payments.aggregate(total=Sum("amount")).get("total") or Decimal("0")
            invoice.paid_amount = total_paid

            if invoice.paid_amount >= invoice.total_amount and invoice.total_amount > 0:
                invoice.status = Invoice.Status.PAID
            elif invoice.paid_amount > 0:
                invoice.status = Invoice.Status.PARTIAL
            else:
                invoice.status = Invoice.Status.UNPAID

            invoice.save(update_fields=["paid_amount", "status", "updated_at"])
