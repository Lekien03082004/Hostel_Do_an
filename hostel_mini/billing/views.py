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

    @action(detail=False, methods=["get"], url_path="analytics", permission_classes=[permissions.IsAuthenticatedOrReadOnly])
    def analytics(self, request):
        """Báo cáo doanh thu tổng quan và chi tiết từng chi nhánh."""
        import calendar
        from datetime import datetime
        from django.utils import timezone
        from branches.models import Branch

        year = request.query_params.get("year")
        month = request.query_params.get("month")
        branch_id = request.query_params.get("branch_id")

        now = timezone.now()
        current_year = int(year) if year and year.isdigit() else now.year
        tz = timezone.get_current_timezone()

        def get_month_range(y, m):
            _, last_day = calendar.monthrange(y, m)
            start_dt = timezone.make_aware(datetime(y, m, 1, 0, 0, 0), tz)
            end_dt = timezone.make_aware(datetime(y, m, last_day, 23, 59, 59, 999999), tz)
            return start_dt, end_dt

        def get_year_range(y):
            start_dt = timezone.make_aware(datetime(y, 1, 1, 0, 0, 0), tz)
            end_dt = timezone.make_aware(datetime(y, 12, 31, 23, 59, 59, 999999), tz)
            return start_dt, end_dt

        start_year, end_year = get_year_range(current_year)
        base_qs = (
            Invoice.objects.exclude(status=Invoice.Status.CANCELLED)
            .filter(issued_at__range=(start_year, end_year))
            .select_related("booking__branch")
        )

        filtered_qs = base_qs
        if branch_id and str(branch_id) != "all":
            filtered_qs = filtered_qs.filter(booking__branch_id=branch_id)

        if month and str(month) != "all" and str(month).isdigit():
            m_start, m_end = get_month_range(current_year, int(month))
            filtered_qs = filtered_qs.filter(issued_at__range=(m_start, m_end))

        totals = filtered_qs.aggregate(
            total_rev=Sum("total_amount"),
            room_rev=Sum("subtotal_rooms"),
            serv_rev=Sum("subtotal_services"),
            paid_tot=Sum("paid_amount"),
        )
        total_revenue = float(totals["total_rev"] or 0)
        room_revenue = float(totals["room_rev"] or 0)
        service_revenue = float(totals["serv_rev"] or 0)
        paid_amount = float(totals["paid_tot"] or 0)
        remaining_amount = max(0, total_revenue - paid_amount)

        # 1. Doanh thu theo từng chi nhánh
        all_branches = list(Branch.objects.filter(is_active=True).order_by("id"))
        branch_reports = []
        for b in all_branches:
            b_invoices = base_qs.filter(booking__branch=b)
            if month and str(month) != "all" and str(month).isdigit():
                m_start, m_end = get_month_range(current_year, int(month))
                b_invoices = b_invoices.filter(issued_at__range=(m_start, m_end))

            b_tot = b_invoices.aggregate(
                rev=Sum("total_amount"),
                room=Sum("subtotal_rooms"),
                serv=Sum("subtotal_services"),
                paid=Sum("paid_amount"),
            )
            b_rev = float(b_tot["rev"] or 0)
            b_room = float(b_tot["room"] or 0)
            b_serv = float(b_tot["serv"] or 0)
            b_paid = float(b_tot["paid"] or 0)
            b_count = b_invoices.count()
            pct = round((b_rev / total_revenue * 100), 1) if total_revenue > 0 else 0

            branch_reports.append({
                "branch_id": b.id,
                "branch_name": b.name,
                "branch_code": b.code,
                "total_revenue": b_rev,
                "room_revenue": b_room,
                "service_revenue": b_serv,
                "paid_amount": b_paid,
                "remaining_amount": max(0, b_rev - b_paid),
                "invoices_count": b_count,
                "percentage": pct,
            })

        branch_reports.sort(key=lambda x: x["total_revenue"], reverse=True)

        # 2. Xu hướng theo 12 tháng (Timeline Monthly Trend)
        monthly_trend = []
        for m in range(1, 13):
            m_start, m_end = get_month_range(current_year, m)
            m_invoices = base_qs.filter(issued_at__range=(m_start, m_end))
            if branch_id and str(branch_id) != "all":
                m_invoices = m_invoices.filter(booking__branch_id=branch_id)

            m_tot = m_invoices.aggregate(
                rev=Sum("total_amount"),
                room=Sum("subtotal_rooms"),
                serv=Sum("subtotal_services"),
                paid=Sum("paid_amount"),
            )
            
            by_branch = {}
            for b in all_branches:
                b_val = float(
                    base_qs.filter(issued_at__range=(m_start, m_end), booking__branch=b).aggregate(Sum("total_amount"))["total_amount__sum"] or 0
                )
                by_branch[str(b.id)] = b_val

            monthly_trend.append({
                "month": m,
                "label": f"Tháng {m}",
                "total_revenue": float(m_tot["rev"] or 0),
                "room_revenue": float(m_tot["room"] or 0),
                "service_revenue": float(m_tot["serv"] or 0),
                "paid_amount": float(m_tot["paid"] or 0),
                "invoices_count": m_invoices.count(),
                "by_branch": by_branch,
            })

        # 3. Phân bổ dịch vụ theo danh mục
        category_labels = {
            "food_beverage": "Ẩm thực & Đồ uống",
            "laundry": "Giặt là & Giặt sấy",
            "spa_wellness": "Spa & Trị liệu",
            "transport": "Xe đưa đón",
            "room_amenities": "Tiện ích buồng phòng",
            "other": "Dịch vụ khác",
        }
        services_used = (
            BookingService.objects.filter(booking_detail__booking__in=filtered_qs.values("booking"))
            .values("service__category")
            .annotate(total=Sum(F("quantity") * F("unit_price")))
            .order_by("-total")
        )
        service_categories = []
        for item in services_used:
            cat = item["service__category"]
            cat_name = category_labels.get(cat, cat or "Khác")
            service_categories.append({
                "category": cat,
                "category_name": cat_name,
                "amount": float(item["total"] or 0),
            })

        # 4. Phân bổ phương thức thanh toán
        method_labels = {
            "cash": "Tiền mặt",
            "bank_transfer": "Chuyển khoản (VietQR)",
            "credit_card": "Thẻ tín dụng",
            "e_wallet": "Ví điện tử",
            "other": "Khác",
        }
        payments_qs = Payment.objects.filter(invoice__in=filtered_qs)
        payments_used = (
            payments_qs.values("payment_method")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )
        payment_methods = []
        for p in payments_used:
            meth = p["payment_method"]
            payment_methods.append({
                "method": meth,
                "method_name": method_labels.get(meth, meth),
                "amount": float(p["total"] or 0),
            })

        # 5. Phân bổ trạng thái hóa đơn
        invoices_by_status = [
            {"status": "paid", "label": "Đã thanh toán đủ", "count": filtered_qs.filter(status=Invoice.Status.PAID).count()},
            {"status": "partial", "label": "Thanh toán 1 phần", "count": filtered_qs.filter(status=Invoice.Status.PARTIAL).count()},
            {"status": "unpaid", "label": "Chưa thanh toán", "count": filtered_qs.filter(status=Invoice.Status.UNPAID).count()},
        ]

        return Response({
            "year": current_year,
            "month": month or "all",
            "branch_id": branch_id or "all",
            "total_revenue": total_revenue,
            "room_revenue": room_revenue,
            "service_revenue": service_revenue,
            "paid_amount": paid_amount,
            "remaining_amount": remaining_amount,
            "invoices_count": filtered_qs.count(),
            "branch_reports": branch_reports,
            "monthly_trend": monthly_trend,
            "service_categories": service_categories,
            "payment_methods": payment_methods,
            "invoices_by_status": invoices_by_status,
        })


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
