import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
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

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập (hoặc email) và mật khẩu.');
      return;
    }

    try {
      setIsSubmitting(true);
      await login(username.trim(), password);
      navigate('/branches');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.status === 401) {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
      } else {
        setError('Không thể kết nối máy chủ. Vui lòng kiểm tra lại dịch vụ Backend.');
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
              Đăng nhập để nhận ngay ưu đãi giảm 10% cho mọi giường ký túc xá capsule & phòng riêng boutique,
              quản lý chuyến đi dễ dàng và kết nối sự kiện giao lưu văn hóa mỗi tối.
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

        {/* RIGHT COLUMN: AUTHENTICATION FORM */}
        <div className="lg:col-span-6 bg-white flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
          {/* Top Bar: Travel Pass, Currency, Language */}
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
            <div className="flex items-center gap-1.5 p-1 bg-stone-100/90 rounded-xl mb-7 border border-stone-200/60 max-w-md">
              <button
                type="button"
                className="flex-1 py-2 text-xs font-bold rounded-lg bg-white text-stone-900 shadow-xs transition-all"
              >
                Đăng Nhập
              </button>
              <Link
                to="/register"
                className="flex-1 py-2 text-center text-xs font-medium rounded-lg text-stone-500 hover:text-stone-900 transition-all"
              >
                Tạo Tài Khoản
              </Link>
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
            <div className="mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900 mb-1.5">
                Đăng nhập tài khoản du lịch
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
                Đăng nhập để xem giá ưu đãi thành viên và quản lý chuyến đi của bạn.
              </p>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200 p-3.5 text-xs text-amber-900 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Email hoặc Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dukhach@gmail.com hoặc tên đăng nhập"
                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <p className="mt-1 text-[11px] text-stone-400">
                  Dùng để đăng nhập hoặc nhận hóa đơn đặt phòng điện tử.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700">
                    Mật khẩu
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Vui lòng liên hệ Quản lý chi nhánh hoặc Hotline 1900 6886 để thiết lập lại mật khẩu.')}
                    className="text-[11px] text-amber-800 hover:text-amber-900 font-medium hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-stone-300 bg-white py-2.5 pl-10 pr-10 text-sm text-stone-900 placeholder-stone-400 transition-all focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-stone-300 text-stone-900 accent-stone-900 focus:ring-stone-900"
                />
                <label htmlFor="remember" className="text-xs text-stone-600 select-none cursor-pointer">
                  Duy trì đăng nhập trên thiết bị này
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
                    <span>ĐANG ĐĂNG NHẬP...</span>
                  </>
                ) : (
                  <>
                    <span>TIẾP TỤC ĐĂNG NHẬP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Social Logins */}
            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-4">
                <div className="border-t border-stone-200 w-full" />
                <span className="bg-white px-3 text-[10px] uppercase font-bold tracking-widest text-stone-400 shrink-0">
                  HOẶC ĐĂNG NHẬP BẰNG
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => alert('Đăng nhập Google đang trong lộ trình tích hợp OAuth 2.0.')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert('Đăng nhập Facebook đang trong lộ trình tích hợp OAuth 2.0.')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-stone-500">
                Bạn muốn kiểm tra mã đặt chỗ mà không cần tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => alert('Vui lòng chuẩn bị Mã đặt phòng (ví dụ: BK2026...) để nhân viên lễ tân hỗ trợ.')}
                  className="font-bold text-amber-800 hover:text-amber-900 underline underline-offset-2"
                >
                  Tra cứu đơn ngay
                </button>
              </p>
            </div>
          </div>

          {/* Bottom 24/7 Support Banner */}
          <div className="mt-6 p-3.5 rounded-2xl bg-[#F6F2EA] border border-[#EADFCB] flex items-center gap-3">
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
