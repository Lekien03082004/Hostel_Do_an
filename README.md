# 🏨 Hostel_Do_an - Hệ Thống Quản Lý Hostel / Khách Sạn Mini

Đồ án xây dựng hệ thống quản lý chuỗi nhà nghỉ / khách sạn mini (Hostel Management System) với kiến trúc Full-stack hiện đại:

* **Backend:** [hostel_mini](./hostel_mini/) - Python / Django 6 + Django REST Framework + MySQL + JWT Authentication.
* **Frontend:** [Fe_hostelmini](./Fe_hostelmini/hostelmini/) - React + TypeScript + Vite.

---

## 📂 Cấu trúc Repository

```text
Hostel_Do_an/
├── hostel_mini/            # Mã nguồn Backend (Django REST Framework)
│   ├── branches/           # Quản lý chi nhánh
│   ├── staff/              # Nhân sự, vai trò, lịch trực
│   ├── customers/          # Quản lý khách hàng
│   ├── rooms/              # Phòng, loại phòng, bảng giá & tìm phòng trống
│   ├── bookings/           # Đặt phòng, dịch vụ, check-in / check-out
│   ├── billing/            # Hóa đơn & thanh toán
│   ├── hostel_mini/        # Cấu hình dự án (settings, urls)
│   └── README.md           # Hướng dẫn chi tiết Backend & Danh sách API
│
├── Fe_hostelmini/          # Mã nguồn Frontend (React + Vite + TypeScript)
│   └── hostelmini/
│       ├── src/            # Components, pages, hooks, services
│       └── package.json
│
└── README.md               # Tài liệu tổng quan dự án
```

---

## 🚀 Khởi chạy nhanh (Quick Start)

### 1. Khởi chạy Backend (`hostel_mini`)
Chi tiết xem tại [hostel_mini/README.md](./hostel_mini/README.md).
```bash
cd hostel_mini
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
Backend sẽ khởi chạy tại: `http://localhost:8000/` (Admin: `/admin/`, API: `/api/`).

### 2. Khởi chạy Frontend (`Fe_hostelmini/hostelmini`)
```bash
cd Fe_hostelmini/hostelmini
npm install
npm run dev
```
Frontend sẽ khởi chạy tại: `http://localhost:5173/`.
