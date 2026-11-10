import React, { useState, useEffect } from 'react';
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
  Edit3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  Compass,
  Headset,
} from 'lucide-react';
import { UserBookedRoomsSection } from '../components/profile/UserBookedRoomsSection';
import { staffApi } from '../api';
import { useAuth } from '../context/AuthContext';

export const UserProfilePage: React.FC = () => {
  const { user, logout, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Edit account state
  const [showEditForm, setShowEditForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingAccount, setUpdatingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.employee?.full_name || user.first_name || user.username || '');
      setPhone(user.employee?.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    if (!user) return;
    try {
      setUpdatingAccount(true);
      await staffApi.updateUser(user.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        password: newPassword.trim() ? newPassword.trim() : undefined,
      });
      await refreshUser();
      setNewPassword('');
      setAccountMsg({ type: 'success', text: 'Cập nhật thông tin hồ sơ thành công!' });
    } catch (err: any) {
      setAccountMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Không thể lưu thông tin. Vui lòng thử lại.',
      });
    } finally {
      setUpdatingAccount(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-amber-600 mb-3" />
        <p className="text-xs text-stone-600 font-medium">Đang tải thông tin trang cá nhân...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 py-16">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#EDE7DD] shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl font-bold text-stone-900">
              Yêu Cầu Đăng Nhập
            </h2>
            <p className="text-xs text-stone-500">
              Vui lòng đăng nhập để truy cập trang cá nhân và theo dõi các phòng bạn đã đặt.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-all shadow-md text-center"
            >
              Đăng Nhập Ngay
            </Link>
            <Link
              to="/register"
              className="w-full py-3 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-all text-center"
            >
              Tạo Tài Khoản Mới
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isStaffOrAdmin = Boolean(user.is_staff || user.is_superuser);

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TOP BANNER HEADER (GIỮ NGUYÊN THIẾT KẾ ĐẸP CỦA HỒ SƠ) */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#1E1B18] via-[#2A2621] to-[#1E1B18] p-6 sm:p-10 text-white shadow-xl border border-[#3E3831] overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center rounded-3xl bg-amber-500/20 text-amber-300 font-serif font-bold text-3xl sm:text-4xl border-2 border-amber-400/40 shadow-inner">
                {user.first_name?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                    {user.is_superuser ? (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                        <span>Quản Trị Viên Cấp Cao (Super Admin)</span>
                      </>
                    ) : user.is_staff ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{user.employee?.role_name || 'Nhân Viên Quản Trị'}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Hội Viên Khách Hàng Thân Thiết</span>
                      </>
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                    <CheckCircle className="h-3 w-3" /> Đang hoạt động
                  </span>
                </div>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
                  {user.employee?.full_name || user.first_name || user.username}
                </h2>
                <p className="text-xs sm:text-sm text-stone-400 font-light mt-0.5">
                  Tài khoản hệ thống: <strong className="text-amber-200">@{user.username}</strong>
                  {user.employee?.employee_code && (
                    <span> • Mã NV: <strong className="text-stone-300 font-mono">{user.employee.employee_code}</strong></span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isStaffOrAdmin ? (
                <Link
                  to="/admin/rooms"
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-600 bg-white/5 px-4 py-2.5 text-xs font-semibold text-stone-200 hover:bg-white/10 hover:border-amber-400/50 transition-all cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4 text-amber-400" />
                  <span>Vào Bàn Vận Hành Admin</span>
                </Link>
              ) : (
                <Link
                  to="/rooms"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-stone-950 transition-all shadow-md cursor-pointer"
                >
                  <span>Đặt Thêm Phòng Mới</span>
                </Link>
              )}

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

        {/* PHẦN MỚI ĐƯỢC THÊM VÀO: PHÒNG TÔI ĐÃ BOOK & YÊU CẦU CHECK-IN / CHECK-OUT */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E3DDD2] shadow-xs">
          <UserBookedRoomsSection />
        </section>

        {/* PHẦN CŨ ĐƯỢC GIỮ NGUYÊN 100%: LỐI TẮT PHÂN HỆ VẬN HÀNH */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
            {isStaffOrAdmin ? 'Lối tắt Phân hệ Vận hành' : 'Lối tắt Tiện ích Khách Hàng'}
          </h3>

          {isStaffOrAdmin ? (
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <Link
                to="/rooms"
                className="group rounded-3xl bg-white p-6 border border-[#E3DDD2] shadow-xs hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 mb-4 group-hover:scale-105 transition-transform">
                    <BedDouble className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                    Khám Phá Phòng & Giá
                  </h4>
                  <p className="text-xs text-stone-500 font-light leading-relaxed">
                    Danh mục phòng nghỉ cao cấp, phòng dorm capsule, giá theo giờ và theo ngày ưu đãi hội viên.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Xem phòng</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </Link>

              <Link
                to="/branches"
                className="group rounded-3xl bg-white p-6 border border-[#E3DDD2] shadow-xs hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FAF4EA] text-amber-900 border border-[#E7DAC4] mb-4 group-hover:scale-105 transition-transform">
                    <Compass className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                    Chuỗi Chi Nhánh Lưu Trú
                  </h4>
                  <p className="text-xs text-stone-500 font-light leading-relaxed">
                    Trải nghiệm tại các vị trí đắc địa trung tâm Hà Nội, Sài Gòn, Đà Nẵng với không gian tinh tế.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Xem chi nhánh</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </Link>

              <a
                href="tel:19006886"
                className="group rounded-3xl bg-white p-6 border border-[#E3DDD2] shadow-xs hover:shadow-xl hover:border-amber-400/60 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-800 border border-stone-200 mb-4 group-hover:scale-105 transition-transform">
                    <Headset className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                    Hỗ Trợ Khách Hàng 24/7
                  </h4>
                  <p className="text-xs text-stone-500 font-light leading-relaxed">
                    Hotline lễ tân tiếp nhận yêu cầu check-in sớm, thay đổi lịch trình và giải đáp mọi thắc mắc.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>Gọi 1900 6886</span>
                  <span className="group-hover:translate-x-1 transition-transform">➔</span>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* PHẦN CŨ ĐƯỢC GIỮ NGUYÊN 100%: ACCOUNT DETAILS & SYSTEM INFO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card (6 THẺ THÔNG TIN GỐC) */}
          <div className="lg:col-span-2 rounded-3xl bg-white p-6 sm:p-8 border border-[#E3DDD2] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Thông tin Hồ sơ Cá nhân
                </h3>
                <p className="text-xs text-stone-500 font-light">
                  Chi tiết tài khoản đang đăng nhập phiên hiện tại trong hệ thống.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditForm(!showEditForm)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="h-3.5 w-3.5 text-amber-700" />
                <span>{showEditForm ? 'Đóng chỉnh sửa' : 'Cập nhật thông tin & Mật khẩu'}</span>
                {showEditForm ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* 6 THẺ THÔNG TIN CHI TIẾT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
                <span className="text-stone-400 font-medium block mb-1">Họ và tên</span>
                <strong className="text-stone-900 text-sm font-serif">
                  {user.employee?.full_name || user.first_name || user.username}
                </strong>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
                <span className="text-stone-400 font-medium block mb-1">Tên đăng nhập (Username)</span>
                <strong className="text-stone-900 text-sm font-mono">
                  {user.username}
                </strong>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
                <span className="text-stone-400 font-medium block mb-1">Email liên hệ</span>
                <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                  <Mail className="h-3.5 w-3.5 text-amber-700" />
                  <span>{user.email || 'Chưa cập nhật email'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
                <span className="text-stone-400 font-medium block mb-1">Số điện thoại</span>
                <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                  <Phone className="h-3.5 w-3.5 text-amber-700" />
                  <span>{user.employee?.phone || 'Chưa cập nhật'}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
                <span className="text-stone-400 font-medium block mb-1">Chi nhánh biên chế</span>
                <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                  <Building2 className="h-3.5 w-3.5 text-amber-700" />
                  <span>{user.employee?.branch_name || (isStaffOrAdmin ? 'Toàn hệ thống (HQ)' : 'Khách hàng toàn hệ thống')}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/70">
                <span className="text-stone-400 font-medium block mb-1">Cấp độ quyền hạn</span>
                <div className="flex items-center gap-1.5 text-stone-900 font-medium">
                  <Award className="h-3.5 w-3.5 text-amber-700" />
                  <span>
                    {user.is_superuser
                      ? 'Toàn quyền Quản trị tối cao'
                      : user.is_staff
                      ? (user.employee?.role_name || 'Nhân viên Vận hành')
                      : 'Hội viên Khách hàng'}
                  </span>
                </div>
              </div>
            </div>

            {/* FORM CẬP NHẬT HỒ SƠ & MẬT KHẨU (NẾU BẬT) */}
            {showEditForm && (
              <div className="pt-4 border-t border-stone-200 space-y-4">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-amber-700" />
                  <h4 className="font-serif font-bold text-sm text-stone-900">
                    Cập nhật thông tin & Đổi mật khẩu
                  </h4>
                </div>

                {accountMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
                      accountMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {accountMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    )}
                    <span>{accountMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateAccount} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Họ và tên của bạn:</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nhập họ và tên đầy đủ"
                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Số điện thoại liên hệ:</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09xx xxx xxx"
                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Email liên hệ:</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@gmail.com"
                        className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">
                        Đổi mật khẩu mới (bỏ trống nếu không đổi):
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mật khẩu mới tối thiểu 6 ký tự"
                          className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none pl-9"
                        />
                        <Lock className="h-4 w-4 text-stone-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updatingAccount}
                      className="px-6 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs uppercase tracking-wider hover:bg-amber-800 transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {updatingAccount && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>{updatingAccount ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* PHẦN CŨ: BẢO MẬT & PHIÊN LÀM VIỆC */}
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
              {isStaffOrAdmin ? (
                <Link
                  to="/admin/rooms"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-stone-950 py-3 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-stone-800 transition-all shadow-md cursor-pointer"
                >
                  <span>Vào Bàn Vận Hành Phòng</span>
                </Link>
              ) : (
                <Link
                  to="/rooms"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-400 py-3 text-xs font-bold uppercase tracking-wider text-stone-950 hover:bg-amber-300 transition-all shadow-md cursor-pointer"
                >
                  <span>Đặt Phòng Khách Sạn</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
