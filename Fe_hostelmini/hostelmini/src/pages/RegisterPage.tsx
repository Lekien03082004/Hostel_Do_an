import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Wifi,
  ShieldCheck,
  Coffee,
  Bed,
  ArrowRight,
  Search,
  Headphones,
  Sparkles,
  Hotel,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.username.trim() || !formData.password) {
      setError('Vui lòng điền các trường bắt buộc (Họ tên, Tên đăng nhập, Mật khẩu).');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!agreeTerms) {
      setError('Vui lòng đồng ý với điều khoản dịch vụ của Aurelia Hostels.');
      return;
    }

    try {
      setIsSubmitting(true);
      await register({
        username: formData.username.trim(),
        password: formData.password,
        full_name: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });
      navigate('/branches');
    } catch (err: any) {
      if (err.response?.data?.username) {
        setError(err.response.data.username[0]);
      } else if (err.response?.data?.password) {
        setError(err.response.data.password[0]);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Đăng ký không thành công. Tên đăng nhập có thể đã tồn tại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#EDE9E1] p-0 md:p-6 lg:p-10 font-sans">
      <div className="w-full max-w-6xl min-h-[720px] bg-white rounded-none md:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-[#E3DDD2]">
        {/* LEFT COLUMN: HERO BOUTIQUE EXPERIENCE */}
        <div className="lg:col-span-6 relative hidden lg:flex flex-col justify-between p-10 text-white overflow-hidden bg-stone-900">
          {/* Background Image with Warm Dark Gradient */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
            style={{
              backgroundImage: `url('/images/hotel_lobby.jpg')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/70 to-black/85 backdrop-blur-[2px]" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center backdrop-blur-md">
                <Hotel className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h2 className="font-serif text-lg tracking-wider font-bold text-white uppercase">
                  Aurelia Hostels
                </h2>
                <p className="text-[10px] tracking-widest text-amber-200/80 uppercase font-medium">
                  Boutique Stays & Social Pods
                </p>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-medium text-amber-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              HOSTEL PASS • GIẢM THÊM 10%
            </div>
          </div>

          {/* Middle Quote & Description */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              ĐẶC QUYỀN THÀNH VIÊN AURELIA CLUB
            </div>

            <h1 className="font-serif text-3xl xl:text-4xl italic font-normal leading-snug tracking-tight text-white/95 mb-4">
              &ldquo;Trải nghiệm du lịch bản địa với không gian ấm cúng, sang xịn và kết nối bạn bè.&rdquo;
            </h1>

            <p className="text-stone-300 text-sm leading-relaxed max-w-md font-light">
              Đăng ký tài khoản thành viên ngay hôm nay để nhận ưu đãi giảm 10% giá phòng,
              tích điểm nâng hạng phòng miễn phí và tham gia các tour văn hóa độc quyền.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 gap-3 mt-8">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs text-stone-200">
                <Wifi className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Miễn phí Wifi 500Mbps</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs text-stone-200">
                <ShieldCheck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Khóa số & Locker riêng</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs text-stone-200">
                <Coffee className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Rooftop Cafe & Bar</span>
              </div>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs text-stone-200">
                <Bed className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Giường Pod rèm riêng tư</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 text-[11px] text-stone-400 font-light flex items-center justify-between border-t border-white/10 pt-4">
            <span>© 2026 Aurelia Hospitality Group</span>
            <span>Hệ thống chuỗi lưu trú cao cấp</span>
          </div>
        </div>

        {/* RIGHT COLUMN: REGISTRATION FORM */}
        <div className="lg:col-span-6 bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto max-h-[90vh]">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 text-stone-800">
              <div className="w-7 h-7 rounded-lg bg-[#FAF4EA] border border-[#E8DCC8] flex items-center justify-center text-amber-800 font-serif font-bold text-xs">
                A
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Aurelia Travel Pass
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-semibold">
                VND (đ)
              </span>
              <span className="px-2.5 py-1 rounded-md bg-stone-100 text-stone-700 text-xs font-semibold">
                VN / EN
              </span>
            </div>
          </div>

          <div className="my-auto py-6">
            {/* Tabs: Đăng Nhập / Tạo Tài Khoản / Tìm Đơn */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl mb-6 border border-stone-200/60 max-w-md">
              <Link
                to="/login"
                className="flex-1 py-2 text-center text-xs font-medium rounded-lg text-stone-500 hover:text-stone-900 transition-all"
              >
                Đăng Nhập
              </Link>
              <button
                type="button"
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-stone-900 shadow-xs transition-all"
              >
                Tạo Tài Khoản
              </button>
              <button
                type="button"
                onClick={() => alert('Chức năng tra cứu mã đặt phòng sẽ khả dụng khi kết nối với cổng đặt phòng trực tuyến.')}
                className="px-3 py-2 text-xs font-medium rounded-lg text-stone-500 hover:text-stone-900 transition-all flex items-center justify-center gap-1"
              >
                <Search className="w-3 h-3" />
                <span>Tìm Đơn</span>
              </button>
            </div>

            {/* Title & Description */}
            <div className="mb-5">
              <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900 mb-1.5">
                Tạo tài khoản thành viên mới
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                Đăng ký để tích điểm thành viên, hưởng ưu đãi độc quyền 10% cho mọi chi nhánh.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200 p-3 text-xs text-amber-900 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Họ và tên <span className="text-amber-700">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Tên đăng nhập <span className="text-amber-700">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <span className="text-xs font-bold text-stone-400">@</span>
                    </div>
                    <input
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="nguyenvana"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0912 345 678"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Mật khẩu <span className="text-amber-700">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-9 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
                    Xác nhận mật khẩu <span className="text-amber-700">*</span>
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Nhập lại mật khẩu"
                      className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-stone-300 text-stone-900 accent-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="agreeTerms" className="text-xs text-stone-600 select-none cursor-pointer">
                  Tôi đồng ý với <span className="text-amber-900 font-semibold underline">Quy chế lưu trú</span> & <span className="text-amber-900 font-semibold underline">Chính sách bảo mật</span> của Aurelia.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-stone-950 py-3 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-stone-800 transition-all active:scale-[0.99] disabled:opacity-60 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-stone-300" />
                    <span>ĐANG KHỞI TẠO TÀI KHOẢN...</span>
                  </>
                ) : (
                  <>
                    <span>HOÀN TẤT ĐĂNG KÝ THÀNH VIÊN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom 24/7 Support Banner */}
          <div className="mt-4 p-3.5 rounded-2xl bg-[#F6F2EA] border border-[#EADFCB] flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#DFD3BE] flex items-center justify-center text-amber-800 shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-stone-800">
                Bạn cần hỗ trợ đặt phòng hoặc check-in muộn?
              </p>
              <p className="text-stone-500 text-[11px]">
                Lễ tân hỗ trợ 24/7 qua Hotline:{' '}
                <span className="font-bold text-amber-900">1900 6886</span> hoặc Zalo / WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
