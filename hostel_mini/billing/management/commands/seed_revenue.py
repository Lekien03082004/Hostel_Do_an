import random
import uuid
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction

from branches.models import Branch
from customers.models import Customer
from rooms.models import Room, RoomPrice
from bookings.models import Booking, BookingDetail, BookingSource, Service, BookingService
from billing.models import Invoice, Payment


class Command(BaseCommand):
    help = "Khởi tạo dữ liệu mẫu thực tế cho Báo cáo doanh thu & hóa đơn theo từng chi nhánh"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE(">> Khoi tao du lieu doanh thu mau cho cac chi nhanh..."))

        branches = list(Branch.objects.filter(is_active=True))
        if not branches:
            self.stdout.write(self.style.ERROR("Chua co chi nhanh nao! Vui long chay seed_data truoc."))
            return

        rooms = list(Room.objects.filter(is_active=True).select_related("room_type", "branch"))
        if not rooms:
            self.stdout.write(self.style.ERROR("Chua co phong nao! Vui long chay seed_data truoc."))
            return

        services = list(Service.objects.filter(is_active=True))
        sources = list(BookingSource.objects.filter(is_active=True))
        if not sources:
            source, _ = BookingSource.objects.get_or_create(name="Website", defaults={"source_type": "website"})
            sources = [source]

        # Khách hàng mẫu
        sample_customers = [
            ("Nguyễn Văn An", "0901234567", "an.nguyen@gmail.com"),
            ("Trần Thị Bích", "0912345678", "bich.tran@gmail.com"),
            ("Lê Hoàng Nam", "0987654321", "nam.le@yahoo.com"),
            ("Phạm Minh Tuấn", "0934567890", "tuan.pham@outlook.com"),
            ("Đỗ Mai Hương", "0978901234", "huong.do@gmail.com"),
            ("Vũ Đình Khoa", "0945678901", "khoa.vu@hotmail.com"),
            ("Hoàng Thu Trang", "0967890123", "trang.hoang@gmail.com"),
            ("Bùi Đức Hải", "0923456789", "hai.bui@gmail.com"),
            ("David Miller", "0919888777", "david.m@gmail.com"),
            ("Jessica Watson", "0928777666", "jessica.w@gmail.com"),
        ]

        created_customers = []
        for name, phone, email in sample_customers:
            cust, _ = Customer.objects.get_or_create(
                phone=phone,
                defaults={"full_name": name, "email": email, "nationality": "Việt Nam"}
            )
            created_customers.append(cust)

        now = timezone.now()
        current_year = now.year

        # Tạo ~60 đơn đặt phòng rải đều trong 12 tháng của năm hiện tại
        created_invoices = 0
        created_payments = 0

        with transaction.atomic():
            for month in range(1, 13):
                # Mỗi tháng tạo 4-6 đơn chia cho các chi nhánh
                bookings_this_month = random.randint(4, 7)
                for _ in range(bookings_this_month):
                    branch = random.choice(branches)
                    branch_rooms = [r for r in rooms if r.branch_id == branch.id]
                    if not branch_rooms:
                        continue

                    customer = random.choice(created_customers)
                    source = random.choice(sources)
                    room = random.choice(branch_rooms)

                    day = random.randint(1, 27)
                    hour = random.randint(10, 18)
                    checkin_dt = timezone.datetime(current_year, month, day, hour, 0, 0, tzinfo=timezone.get_current_timezone())
                    stay_nights = random.randint(1, 4)
                    checkout_dt = checkin_dt + timedelta(days=stay_nights)

                    booking_code = f"AH{checkin_dt.strftime('%y%m%d')}{uuid.uuid4().hex[:4].upper()}"
                    status = Booking.Status.CHECKED_OUT if checkout_dt < now else (
                        Booking.Status.CHECKED_IN if checkin_dt <= now <= checkout_dt else Booking.Status.CONFIRMED
                    )

                    booking = Booking.objects.create(
                        booking_code=booking_code,
                        branch=branch,
                        customer=customer,
                        booking_source=source,
                        status=status,
                        booked_at=checkin_dt - timedelta(days=random.randint(1, 10)),
                        note="Khách đặt phòng trải nghiệm nghỉ dưỡng",
                    )

                    # Giá phòng
                    unit_price = Decimal(str(random.choice([450000, 650000, 850000, 1250000, 2200000, 3100000])))
                    room_cost = unit_price * Decimal(stay_nights)

                    detail = BookingDetail.objects.create(
                        booking=booking,
                        room=room,
                        rate_type="daily",
                        check_in_planned=checkin_dt,
                        check_out_planned=checkout_dt,
                        check_in_actual=checkin_dt,
                        check_out_actual=checkout_dt if status == Booking.Status.CHECKED_OUT else None,
                        unit_price=unit_price,
                        adults=random.randint(1, 2),
                        children=random.randint(0, 1),
                        status="checked_out" if status == Booking.Status.CHECKED_OUT else (
                            "checked_in" if status == Booking.Status.CHECKED_IN else "booked"
                        ),
                    )

                    # Dịch vụ phát sinh (70% có dùng dịch vụ)
                    services_cost = Decimal("0")
                    if services and random.random() > 0.3:
                        used_services = random.sample(services, k=random.randint(1, min(3, len(services))))
                        for s in used_services:
                            qty = random.randint(1, 3)
                            s_cost = s.price * Decimal(qty)
                            BookingService.objects.create(
                                booking_detail=detail,
                                service=s,
                                quantity=qty,
                                unit_price=s.price,
                            )
                            services_cost += s_cost

                    # Hóa đơn
                    total_amt = room_cost + services_cost
                    inv_code = f"INV{checkin_dt.strftime('%Y%m%d')}{uuid.uuid4().hex[:4].upper()}"

                    # Quyết toán: Hầu hết đã thanh toán đủ hoặc đặt cọc
                    is_paid = status == Booking.Status.CHECKED_OUT or random.random() > 0.3
                    paid_amt = total_amt if is_paid else (total_amt * Decimal("0.5") if random.random() > 0.5 else Decimal("0"))
                    inv_status = Invoice.Status.PAID if paid_amt >= total_amt and total_amt > 0 else (
                        Invoice.Status.PARTIAL if paid_amt > 0 else Invoice.Status.UNPAID
                    )

                    invoice = Invoice.objects.create(
                        invoice_code=inv_code,
                        booking=booking,
                        subtotal_rooms=room_cost,
                        subtotal_services=services_cost,
                        discount_amount=Decimal("0"),
                        tax_amount=Decimal("0"),
                        total_amount=total_amt,
                        paid_amount=paid_amt,
                        status=inv_status,
                    )
                    # Hack update issued_at to the checkin date
                    Invoice.objects.filter(id=invoice.id).update(issued_at=checkin_dt, created_at=checkin_dt)
                    created_invoices += 1

                    # Thanh toán tương ứng
                    if paid_amt > 0:
                        method = random.choice(["bank_transfer", "bank_transfer", "credit_card", "cash", "e_wallet"])
                        ptype = "full" if paid_amt >= total_amt else "deposit"
                        Payment.objects.create(
                            invoice=invoice,
                            payment_method=method,
                            payment_type=ptype,
                            amount=paid_amt,
                            reference_no=f"REF{uuid.uuid4().hex[:8].upper()}" if method != "cash" else None,
                            note="Khách thanh toán đặt phòng",
                        )
                        Payment.objects.filter(invoice=invoice).update(paid_at=checkin_dt)
                        created_payments += 1

        self.stdout.write(self.style.SUCCESS(
            f">> Khoi tao thanh cong! Da tao them {created_invoices} hoa don va {created_payments} giao dich thanh toan."
        ))
