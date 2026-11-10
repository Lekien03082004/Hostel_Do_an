import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  UserCheck,
  Building2,
  BedDouble,
  Users,
  LogOut,
  Mail,
  Phone,
  CheckCircle,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserBookedRoomsSection } from '../components/profile/UserBookedRoomsSection';

export const AdminProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#1E1B18] via-[#2A2621] to-[#1E1B18] p-6 sm:p-10 text-white shadow-xl border border-[#3E3831] overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-300 font-serif font-bold text-3xl sm:text-4xl border-2 border-amber-400/40 shadow-inner">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                  {user?.is_superuser ? (
                    <>
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                      <span>Quản Trị Viên Cấp Cao (Super Admin)</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                      <span>{user?.employee?.role_name || 'Nhân Viên Quản Trị'}</span>
                    </>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                  <CheckCircle className="h-3 w-3" /> Đang hoạt động
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
                {user?.employee?.full_name || user?.username}
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 font-light mt-0.5">
                Tài khoản hệ thống: <strong className="text-amber-200">@{user?.username}</strong>
                {user?.employee?.employee_code && (
                  <span> • Mã NV: <strong className="text-stone-300 font-mono">{user.employee.employee_code}</strong></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-stone-600 bg-white/5 px-4 py-2.5 text-xs font-semibold text-stone-200 hover:bg-white/10 hover:border-amber-400/50 transition-all cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 text-amber-400" />
              <span>Xem Website Khách</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-950/60 border border-rose-800/60 px-4 py-2.5 text-xs font-bold text-rose-300 hover:bg-rose-900 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* PHẦN PHÒNG TÔI ĐÃ BOOK & YÊU CẦU CHECK-IN / CHECK-OUT */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3DDD2] shadow-xs">
        <UserBookedRoomsSection />
      </section>

      {/* QUICK ACCESS ADMIN SHORTCUTS */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
          Lối tắt Phân hệ Vận hành
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link
            to="/admin/rooms"
            className="group rounded-3xl bg-white p-6 border border-[#E3DDD2] shadow-xs hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 mb-4 group-hover:scale-105 transition-transform">
                <BedDouble className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                Sơ đồ & Quản lý Phòng
              </h4>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Xem sơ đồ Room Rack thời gian thực, điều phối buồng phòng, cập nhật phòng trống và bảng giá.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Mở Room Rack</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </Link>

          <Link
            to="/admin/branches"
            className="group rounded-3xl bg-white p-6 border border-[#E3DDD2] shadow-xs hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF4EA] text-amber-900 border border-[#E7DAC4] mb-4 group-hover:scale-105 transition-transform">
                <Building2 className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                Quản lý Chi nhánh
              </h4>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Danh sách chuỗi cơ sở lưu trú tại Hà Nội, Sài Gòn, Đà Nẵng, thông tin liên hệ và số tầng.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Xem chi nhánh</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </Link>

          <Link
            to="/admin/customers"
            className="group rounded-3xl bg-white p-6 border border-[#E3DDD2] shadow-xs hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 border border-stone-200 mb-4 group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                Quản lý Khách thuê
              </h4>
              <p className="text-xs text-stone-500 font-light leading-relaxed">
                Hồ sơ khách lưu trú, số CCCD/Hộ chiếu, số điện thoại và lịch sử đặt phòng trong hệ thống.
              </p>
            </div>
            <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
              <span>Xem khách hàng</span>
              <span className="group-hover:translate-x-1 transition-transform">➔</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ACCOUNT DETAILS & SYSTEM INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 sm:p-8 border border-[#E3DDD2] shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Thông tin Hồ sơ Cá nhân
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Chi tiết tài khoản quản trị nội bộ đang đăng nhập phiên hiện tại.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
              <span className="text-stone-400 font-medium block mb-1">Họ và tên</span>
              <strong className="text-stone-900 text-sm font-serif">
                {user?.employee?.full_name || user?.username}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
              <span className="text-stone-400 font-medium block mb-1">Tên đăng nhập (Username)</span>
              <strong className="text-stone-900 text-sm font-mono">
                {user?.username}
              </strong>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
              <span className="text-stone-400 font-medium block mb-1">Email liên hệ</span>
              <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                <Mail className="h-3.5 w-3.5 text-amber-700" />
                <span>{user?.email || 'Chưa cập nhật email'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
              <span className="text-stone-400 font-medium block mb-1">Số điện thoại</span>
              <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                <Phone className="h-3.5 w-3.5 text-amber-700" />
                <span>{user?.employee?.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
              <span className="text-stone-400 font-medium block mb-1">Chi nhánh biên chế</span>
              <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                <Building2 className="h-3.5 w-3.5 text-amber-700" />
                <span>{user?.employee?.branch_name || 'Toàn hệ thống (HQ)'}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
              <span className="text-stone-400 font-medium block mb-1">Cấp độ quyền hạn</span>
              <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                <Award className="h-3.5 w-3.5 text-amber-700" />
                <span>{user?.is_superuser ? 'Toàn quyền Quản trị tối cao' : 'Nhân viên Vận hành'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-[#E3DDD2] shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Bảo mật & Phiên làm việc
            </h3>
            <p className="text-xs text-stone-500 font-light">
              Xác thực JWT Token bảo vệ an toàn.
            </p>
          </div>

          <div className="space-y-3.5 text-xs text-stone-600">
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span>Cơ chế xác thực:</span>
              <span className="font-mono font-bold text-stone-900">JWT SimpleJWT</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span>Cơ sở dữ liệu:</span>
              <span className="font-mono font-bold text-stone-900">MySQL 8.x</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-stone-100">
              <span>Backend Core:</span>
              <span className="font-mono font-bold text-stone-900">Django 6 + DRF</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Trạng thái kết nối API:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Sẵn sàng
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100">
            <Link
              to="/admin/rooms"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-950 py-3 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-stone-800 transition-all shadow-md cursor-pointer"
            >
              <span>Vào Bàn Vận Hành Phòng</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
