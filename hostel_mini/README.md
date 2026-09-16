# 🏨 Hostel Mini Backend

Hệ thống Backend quản lý chuỗi nhà nghỉ / khách sạn mini (Hostel Management System), được phát triển trên nền tảng **Python / Django** & **Django REST Framework (DRF)**, sử dụng cơ sở dữ liệu **MySQL**.

Hệ thống cung cấp đầy đủ các phân hệ nghiệp vụ: Quản lý chi nhánh, nhân sự, phòng & bảng giá linh hoạt, khách hàng, quy trình đặt phòng khép kín và xuất hóa đơn / thanh toán.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

* **Ngôn ngữ:** Python 3.13+
* **Framework:** Django 6.1+, Django REST Framework (DRF) 3.18+
* **Xác thực:** JSON Web Token (`djangorestframework-simplejwt`)
* **Cơ sở dữ liệu:** MySQL 8.x (`mysqlclient`)
* **CORS & Filter:** `django-cors-headers`, `django-filter`
* **Quản lý biến môi trường:** `python-dotenv`

---

## 📂 Cấu trúc dự án (Project Structure)

```text
hostel_mini/
├── .env                  # Cấu hình môi trường nội bộ (không commit)
├── .env.example          # File mẫu biến môi trường
├── .gitignore            # Danh sách loại trừ khi commit Git
├── manage.py             # Script quản trị Django
├── requirements.txt      # Danh sách thư viện phụ thuộc
├── README.md             # Tài liệu dự án
│
├── hostel_mini/          # Cấu hình lõi của dự án
│   ├── settings.py       # Cài đặt DB, JWT, CORS, Apps, Middleware
│   ├── urls.py           # Định tuyến API gốc & Admin
│   ├── wsgi.py / asgi.py
│
├── branches/             # Phân hệ Quản lý Chi nhánh
│   ├── models.py         # Model: Branch
│   ├── serializers.py    # Serializer: BranchSerializer
│   ├── views.py          # ViewSet: BranchViewSet
│   └── admin.py          # Quản trị Branch trong Django Admin
│
├── staff/                # Phân hệ Nhân sự & Phân quyền
│   ├── models.py         # Model: Role, Employee, EmployeeBranch, Shift, EmployeeShiftSchedule
│   ├── serializers.py    # Serializer: EmployeeSerializer, CurrentUserSerializer...
│   ├── views.py          # ViewSet: EmployeeViewSet, CurrentUserView (/me/)
│   └── admin.py
│
├── customers/            # Phân hệ Quản lý Khách hàng
│   ├── models.py         # Model: Customer (CCCD, SĐT, Quốc tịch...)
│   ├── serializers.py    # Serializer: CustomerSerializer (kèm validation SĐT)
│   ├── views.py          # ViewSet: CustomerViewSet (tìm kiếm theo tên, SĐT, CCCD)
│   └── admin.py
│
├── rooms/                # Phân hệ Phòng & Bảng giá
│   ├── models.py         # Model: RoomType, RoomImage, Room, Season, RoomPrice
│   ├── serializers.py    # Serializer: RoomSerializer, RoomTypeSerializer...
│   ├── views.py          # ViewSet: RoomViewSet (action /available/), RoomPriceViewSet...
│   └── admin.py
│
├── bookings/             # Phân hệ Đặt phòng & Dịch vụ (Core Business)
│   ├── models.py         # Model: BookingSource, Booking, BookingDetail, Service, BookingService
│   ├── serializers.py    # Serializer: BookingSerializer, BookingCreateSerializer
│   ├── views.py          # ViewSet: BookingViewSet (actions: check_in, check_out, cancel, add_service)
│   └── admin.py
│
└── billing/              # Phân hệ Hóa đơn & Thanh toán
    ├── models.py         # Model: Invoice, Payment
    ├── serializers.py    # Serializer: InvoiceSerializer, PaymentSerializer
    ├── views.py          # ViewSet: InvoiceViewSet (/recalculate/), PaymentViewSet
    └── admin.py
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy (Getting Started)

### 1. Yêu cầu tiên quyết
- Python 3.11+ (khuyên dùng Python 3.12 hoặc 3.13)
- MySQL Server đang chạy (mặc định port 3306 hoặc 3307)
- Đã tạo sẵn database tên `hostel`:
  ```sql
  CREATE DATABASE hostel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

### 2. Thiết lập môi trường ảo & Cài đặt thư viện
```bash
# Mở terminal tại thư mục hostel_mini
cd hostel_mini

# Tạo môi trường ảo (nếu chưa có)
python -m venv .venv

# Kích hoạt môi trường ảo
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# Windows (cmd):
.\.venv\Scripts\activate.bat
# Linux/macOS:
source .venv/bin/activate

# Cài đặt các thư viện cần thiết
pip install -r requirements.txt
```

### 3. Cấu hình biến môi trường
Tạo file `.env` tại thư mục gốc `hostel_mini/` (dựa theo mẫu `.env.example`):
```env
# Django Settings
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# MySQL Settings
DB_NAME=hostel
DB_USER=ledinhkien
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=3307

# CORS Frontend (React Vite)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 4. Áp dụng Migrations & Tạo tài khoản Quản trị
```bash
# Áp dụng cấu trúc bảng vào MySQL
python manage.py migrate

# Tạo tài khoản Superuser để đăng nhập trang Admin
python manage.py createsuperuser
```

### 5. Khởi động Web Server
```bash
python manage.py runserver
```
Server sẽ chạy tại địa chỉ: `http://localhost:8000/`

---

## 💻 Giao diện Quản trị Django Admin

Truy cập: **`http://localhost:8000/admin/`**

Trang quản trị cung cấp đầy đủ các tiện ích:
* Lọc nhanh theo chi nhánh, trạng thái phòng, nguồn khách, ngày tạo.
* Tìm kiếm khách hàng theo Họ tên, Số điện thoại hoặc CCCD/CMND.
* Biểu mẫu lồng (Inline Forms) giúp xem ngay danh sách phòng thuộc đơn đặt và danh sách các đợt thanh toán của hóa đơn.

---

## 📡 Danh sách REST API Endpoints

Hệ thống sử dụng tiền tố `/api/`. Dưới đây là các endpoint quan trọng:

### 1. Xác thực (JWT Authentication)
| Method | Endpoint | Mô tả | Body / Params |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Đăng nhập lấy access & refresh token | `{"username": "...", "password": "..."}` |
| `POST` | `/api/auth/refresh/` | Cấp mới access token | `{"refresh": "..."}` |
| `GET` | `/api/auth/me/` | Lấy thông tin user hiện tại + hồ sơ nhân viên | Header: `Authorization: Bearer <access_token>` |

### 2. Chi nhánh & Khách hàng
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET / POST` | `/api/branches/` | Danh sách & Tạo chi nhánh (lọc `?is_active=true&province=...`) |
| `GET / PUT / DELETE` | `/api/branches/{id}/` | Chi tiết / Cập nhật / Xóa chi nhánh |
| `GET / POST` | `/api/customers/` | Danh sách & Tạo khách hàng (tìm kiếm `?search=0987654321`) |
| `GET / PUT / DELETE` | `/api/customers/{id}/` | Chi tiết / Cập nhật khách hàng |

### 3. Phòng & Bảng giá
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET / POST` | `/api/rooms/types/` | CRUD loại phòng (kèm danh sách ảnh) |
| `GET / POST` | `/api/rooms/rooms/` | Danh sách phòng (lọc `?branch=1&status=available`) |
| **`GET`** | **`/api/rooms/rooms/available/`** | **Tra cứu phòng trống:**<br>`?branch=1&check_in=2026-08-01T14:00:00&check_out=2026-08-03T12:00:00` |
| `GET / POST` | `/api/rooms/seasons/` | Quản lý mùa giá |
| `GET / POST` | `/api/rooms/prices/` | Quản lý bảng giá theo mùa, theo giờ, ngày, tháng |

### 4. Đặt phòng & Dịch vụ (Core Booking Flow)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET / POST` | `/api/bookings/sources/` | Nguồn đặt phòng (Trực tiếp, OTA, Điện thoại...) |
| `GET / POST` | `/api/bookings/services/` | Danh mục dịch vụ (Ăn sáng, Giặt ủi...) |
| **`POST`** | **`/api/bookings/bookings/`** | **Tạo đơn đặt phòng**: Tự động chụp giá snapshot, tạo chi tiết phòng và sinh ngay hóa đơn tương ứng trong `transaction.atomic()`. |
| `GET` | `/api/bookings/bookings/` | Danh sách đơn (lọc theo chi nhánh, trạng thái) |
| **`POST`** | **`/api/bookings/bookings/{id}/check_in/`** | Check-in: Chuyển đơn sang `checked_in`, phòng sang `occupied`. |
| **`POST`** | **`/api/bookings/bookings/{id}/check_out/`** | Check-out: Chuyển đơn sang `checked_out`, phòng sang `cleaning`. |
| **`POST`** | **`/api/bookings/bookings/{id}/cancel/`** | Hủy đơn: Trả phòng về `available`. |
| **`POST`** | **`/api/bookings/bookings/{id}/add_service/`** | Thêm dịch vụ sử dụng vào phòng đặt và cộng dồn vào hóa đơn. |

#### 📝 Ví dụ Body tạo đơn đặt phòng (`POST /api/bookings/bookings/`):
```json
{
  "branch": 1,
  "booking_source": 1,
  "customer_id": 2,
  "note": "Khách cần phòng yên tĩnh",
  "details": [
    {
      "room": 5,
      "rate_type": "daily",
      "check_in_planned": "2026-08-10T14:00:00+07:00",
      "check_out_planned": "2026-08-12T12:00:00+07:00",
      "unit_price": "450000.00",
      "adults": 2,
      "children": 0
    }
  ]
}
```

### 5. Hóa đơn & Thanh toán (Billing)
| Method | Endpoint | Mô tả |
|---|---|---|
| `GET` | `/api/billing/invoices/` | Danh sách hóa đơn (lọc `?status=unpaid`) |
| `POST` | `/api/billing/invoices/{id}/recalculate/` | Tính toán lại tổng tiền từ chi tiết thực tế |
| **`POST`** | **`/api/billing/payments/`** | **Ghi nhận thanh toán**: Tự động cập nhật số tiền đã thu và cập nhật trạng thái hóa đơn (`unpaid` -> `partial` -> `paid`). |

---

## 🌟 Điểm nổi bật trong Thiết kế Kiến trúc

1. **Snapshot Đơn giá (Price Snapshotting):**
   - Khi tạo đơn đặt phòng hoặc thêm dịch vụ, đơn giá tại thời điểm giao dịch được lưu trực tiếp (`BookingDetail.unit_price`, `BookingService.unit_price`). Nhờ đó, việc điều chỉnh bảng giá trong tương lai sẽ không làm sai lệch doanh thu của các đơn cũ.
2. **Ràng buộc Toàn vẹn Dữ liệu Chặt chẽ:**
   - Sử dụng `CheckConstraint` đảm bảo `check_out > check_in` và `end_date >= start_date`.
   - Sử dụng `UniqueConstraint` ngăn chặn trùng mã phòng theo chi nhánh, trùng ca làm việc.
   - Cơ chế `on_delete=models.PROTECT` ngăn ngừa việc vô tình xóa mất lịch sử giao dịch và tài chính quan trọng.
3. **Bảo toàn Giao dịch (Transaction Atomic):**
   - Mọi thao tác phức tạp như: Tạo Đơn + Tạo Chi tiết phòng + Sinh Hóa đơn, hoặc Ghi nhận Thanh toán + Cập nhật Hóa đơn đều được bao bọc trong `transaction.atomic()`, tránh tình trạng lỗi nửa chừng làm hỏng dữ liệu.
4. **Tối ưu hóa Truy vấn (N+1 Query Prevention):**
   - Toàn bộ ViewSets đều áp dụng `select_related` và `prefetch_related` hợp lý, giúp lấy dữ liệu lồng nhau chỉ với 1-2 truy vấn SQL.
5. **CORS Sẵn sàng cho Frontend:**
   - Được cấu hình sẵn sàng hỗ trợ kết nối với ứng dụng React + Vite (`Fe_hostelmini`) tại cổng `5173`.

---

## 🧪 Chạy Kiểm thử (Testing)

Để kiểm tra toàn bộ hoạt động của hệ thống API, chạy script kiểm thử:
```bash
python manage.py check
```
Và có thể tạo test script tự động để kiểm tra API flow trọn vẹn.
