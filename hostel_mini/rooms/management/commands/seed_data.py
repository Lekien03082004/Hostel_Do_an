from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from branches.models import Branch
from rooms.models import RoomType, Room, RoomPrice, RoomImage
from bookings.models import BookingSource, Service


class Command(BaseCommand):
    help = "Nạp dữ liệu mẫu thực tế cho khách sạn: Chi nhánh, Loại phòng, Phòng theo tầng, Bảng giá, Dịch vụ"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE(">> Khoi tao du lieu mau khach san..."))

        with transaction.atomic():
            # 1. Tạo Chi nhánh
            b_hn, _ = Branch.objects.get_or_create(
                code="HN01",
                defaults={
                    "name": "AH Boutique Hoàn Kiếm",
                    "address": "36 Hàng Bè",
                    "ward": "Hàng Bạc",
                    "district": "Hoàn Kiếm",
                    "province": "Hà Nội",
                    "phone": "02438886666",
                    "email": "hoankiem@ahhotel.com",
                    "total_floors": 4,
                    "is_active": True,
                },
            )

            b_sg, _ = Branch.objects.get_or_create(
                code="SG01",
                defaults={
                    "name": "AH Signature Sài Gòn",
                    "address": "88 Nguyễn Huệ",
                    "ward": "Bến Nghé",
                    "district": "Quận 1",
                    "province": "TP. Hồ Chí Minh",
                    "phone": "02839998888",
                    "email": "saigon@ahhotel.com",
                    "total_floors": 5,
                    "is_active": True,
                },
            )

            b_dn, _ = Branch.objects.get_or_create(
                code="DN01",
                defaults={
                    "name": "AH Beachfront Retreat",
                    "address": "120 Võ Nguyên Giáp",
                    "ward": "Phước Mỹ",
                    "district": "Sơn Trà",
                    "province": "Đà Nẵng",
                    "phone": "02363777999",
                    "email": "danang@ahhotel.com",
                    "total_floors": 4,
                    "is_active": True,
                },
            )

            self.stdout.write(self.style.SUCCESS(f"[OK] Da tao {Branch.objects.count()} chi nhanh."))

            # 2. Tạo Loại phòng
            rt_std, _ = RoomType.objects.get_or_create(
                name="Standard Cozy Room",
                defaults={
                    "description": "Phòng tiêu chuẩn ấm cúng, thiết kế hiện đại tối giản với đầy đủ tiện nghi, phù hợp 1-2 khách.",
                    "max_occupancy": 2,
                    "bed_type": "Queen Bed",
                    "area_sqm": Decimal("24.00"),
                },
            )

            rt_dlx, _ = RoomType.objects.get_or_create(
                name="Deluxe Heritage Suite",
                defaults={
                    "description": "Phòng cao cấp phong cách Indochine sang trọng, ban công view phố thoáng đãng và bồn tắm thư giãn.",
                    "max_occupancy": 2,
                    "bed_type": "King Bed",
                    "area_sqm": Decimal("38.00"),
                },
            )

            rt_pod, _ = RoomType.objects.get_or_create(
                name="Luxury Capsule Pod",
                defaults={
                    "description": "Khoang ngủ capsule thông minh chuẩn Nhật Bản, rèm nhung cách âm riêng tư, khóa từ an toàn.",
                    "max_occupancy": 1,
                    "bed_type": "Single Pod",
                    "area_sqm": Decimal("6.00"),
                },
            )

            rt_fam, _ = RoomType.objects.get_or_create(
                name="Family Garden Penthouse",
                defaults={
                    "description": "Căn hộ 2 phòng ngủ liên thông với phòng khách rộng rãi, bếp nhỏ tiện nghi và view sân vườn xanh mát.",
                    "max_occupancy": 4,
                    "bed_type": "2 King Beds",
                    "area_sqm": Decimal("65.00"),
                },
            )

            self.stdout.write(self.style.SUCCESS(f"[OK] Da tao {RoomType.objects.count()} loai phong."))

            # 3. Tạo Bảng giá phòng mẫu cho HN01 & SG01
            branches = [b_hn, b_sg, b_dn]
            pricing_data = [
                (rt_pod, Decimal("80000"), Decimal("320000"), Decimal("5500000")),
                (rt_std, Decimal("150000"), Decimal("750000"), Decimal("12000000")),
                (rt_dlx, Decimal("250000"), Decimal("1350000"), Decimal("22000000")),
                (rt_fam, Decimal("450000"), Decimal("2850000"), Decimal("45000000")),
            ]

            for br in branches:
                for rtype, hourly_p, daily_p, monthly_p in pricing_data:
                    RoomPrice.objects.get_or_create(
                        branch=br,
                        room_type=rtype,
                        rate_type=RoomPrice.RateType.DAILY,
                        defaults={"price": daily_p, "is_active": True},
                    )
                    RoomPrice.objects.get_or_create(
                        branch=br,
                        room_type=rtype,
                        rate_type=RoomPrice.RateType.HOURLY,
                        defaults={"price": hourly_p, "first_hours": 2, "extra_hour_price": hourly_p * Decimal("0.5"), "is_active": True},
                    )

            # 4. Tạo Danh sách phòng theo tầng cho HN01 (16 phòng trải 4 tầng)
            rooms_plan_hn = [
                # Tầng 1: Lễ tân + 4 phòng (Pods & Standard)
                ("101", 1, rt_pod, Room.Status.AVAILABLE),
                ("102", 1, rt_pod, Room.Status.OCCUPIED),
                ("103", 1, rt_pod, Room.Status.CLEANING),
                ("104", 1, rt_std, Room.Status.AVAILABLE),
                # Tầng 2: 5 phòng Standard & Deluxe
                ("201", 2, rt_std, Room.Status.AVAILABLE),
                ("202", 2, rt_std, Room.Status.OCCUPIED),
                ("203", 2, rt_dlx, Room.Status.AVAILABLE),
                ("204", 2, rt_dlx, Room.Status.OCCUPIED),
                ("205", 2, rt_dlx, Room.Status.CLEANING),
                # Tầng 3: 4 phòng Deluxe & Family
                ("301", 3, rt_dlx, Room.Status.AVAILABLE),
                ("302", 3, rt_dlx, Room.Status.AVAILABLE),
                ("303", 3, rt_fam, Room.Status.OCCUPIED),
                ("304", 3, rt_fam, Room.Status.MAINTENANCE),
                # Tầng 4: 3 phòng Penthouse Suite & Deluxe
                ("401", 4, rt_dlx, Room.Status.AVAILABLE),
                ("402", 4, rt_fam, Room.Status.AVAILABLE),
                ("403", 4, rt_fam, Room.Status.CLEANING),
            ]

            for r_num, floor, r_type, status in rooms_plan_hn:
                Room.objects.get_or_create(
                    branch=b_hn,
                    room_number=r_num,
                    defaults={
                        "floor": floor,
                        "room_type": r_type,
                        "status": status,
                        "is_active": True,
                    },
                )

            # Tạo thêm phòng cho SG01
            rooms_plan_sg = [
                ("101", 1, rt_std, Room.Status.AVAILABLE),
                ("102", 1, rt_std, Room.Status.OCCUPIED),
                ("201", 2, rt_dlx, Room.Status.AVAILABLE),
                ("202", 2, rt_dlx, Room.Status.CLEANING),
                ("301", 3, rt_fam, Room.Status.AVAILABLE),
            ]
            for r_num, floor, r_type, status in rooms_plan_sg:
                Room.objects.get_or_create(
                    branch=b_sg,
                    room_number=r_num,
                    defaults={
                        "floor": floor,
                        "room_type": r_type,
                        "status": status,
                        "is_active": True,
                    },
                )

            self.stdout.write(self.style.SUCCESS(f"[OK] Da tao {Room.objects.count()} phong."))

            # 5. Tạo Nguồn đặt phòng
            BookingSource.objects.get_or_create(name="Trực tiếp tại quầy", defaults={"source_type": BookingSource.SourceType.WALK_IN})
            BookingSource.objects.get_or_create(name="Website AH Hotel", defaults={"source_type": BookingSource.SourceType.DIRECT})
            BookingSource.objects.get_or_create(name="Booking.com", defaults={"source_type": BookingSource.SourceType.OTA, "commission_rate": Decimal("15.00")})
            BookingSource.objects.get_or_create(name="Agoda", defaults={"source_type": BookingSource.SourceType.OTA, "commission_rate": Decimal("15.00")})

            # 6. Tạo Dịch vụ mẫu
            Service.objects.get_or_create(name="Bữa sáng Buffet Á-Âu", defaults={"unit": "suất", "price": Decimal("120000")})
            Service.objects.get_or_create(name="Giặt sấy lấy nhanh trong ngày", defaults={"unit": "kg", "price": Decimal("40000")})
            Service.objects.get_or_create(name="Thuê xe máy tay ga (24h)", defaults={"unit": "ngày", "price": Decimal("150000")})
            Service.objects.get_or_create(name="Đưa đón sân bay 4 chỗ", defaults={"unit": "lượt", "price": Decimal("350000")})
            Service.objects.get_or_create(name="Bia craft & Nước suối Minibar", defaults={"unit": "lon", "price": Decimal("30000")})

            self.stdout.write(self.style.SUCCESS("[OK] NAP DU LIEU MAU KHACH SAN THANH CONG!"))
