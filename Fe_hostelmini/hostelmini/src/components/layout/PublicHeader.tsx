import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, ArrowRight, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PublicHeader = () => {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Trang Chủ', href: '/' },
    { label: 'Phòng & Giá', href: '/rooms' },
    { label: 'Chi Nhánh', href: '/branches' },
    { label: 'Dịch Vụ', href: '/services' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname === path) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 bg-[#141312]/95 backdrop-blur-md border-b border-[#262320] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* LOGO & BRAND */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <img
                src="/images/logo.png"
                alt="AH Hotel & Hospitality Logo"
                className="w-12 h-12 rounded-full border-2 border-amber-400/60 object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base sm:text-lg tracking-wider text-amber-200 uppercase group-hover:text-amber-100 transition-colors">
                AH Hotel
              </span>
              <span className="text-[10px] tracking-widest text-stone-400 font-medium uppercase -mt-0.5">
                Hospitality & Stays
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION LINKS */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={`text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive(link.href)
                    ? 'text-amber-300 border-b-2 border-amber-400 pb-1'
                    : 'text-stone-300 hover:text-amber-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT ACTIONS: CURRENCY / HOTLINE / LOGIN */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 text-stone-400 text-xs font-medium pr-3 border-r border-stone-800">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Hotline: <strong className="text-stone-200 font-bold">888017377</strong></span>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {/* NÚT TÊN TÀI KHOẢN (LÊ ĐÌNH KIÊN): KHI NHẤN VÀO SẼ VÀO TRANG CÁ NHÂN */}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25221E] border border-amber-500/40 text-amber-300 text-xs font-bold hover:bg-[#2C2924] hover:border-amber-400 transition-all shadow-xs"
                  title="Nhấn vào để mở Trang Cá Nhân của bạn & xem các phòng đã đặt"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {user?.employee?.full_name || user?.first_name || user?.username}
                    {user?.is_staff && ' (Quản trị)'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </Link>
                {/* <button
                  type="button"
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-rose-400 hover:border-rose-900/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button> */}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full border border-amber-400/50 bg-amber-500/10 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-amber-400 hover:text-stone-950 transition-all shadow-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-full bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-all shadow-md"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>

          {/* MOBILE MENU TOGGLE */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE EXPANDED MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#262320] bg-[#141312] px-4 py-5 space-y-3">
          <nav className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-stone-300 hover:bg-[#201D1A] hover:text-amber-300 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-3 border-t border-stone-800 flex flex-col gap-2">
            {isAuthenticated ? (
              user?.is_staff || user?.is_superuser ? (
                <Link
                  to="/admin/rooms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider"
                >
                  Vào Trang Quản Trị
                </Link>
              ) : (
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider"
                >
                  Trang Cá Nhân Của Tôi
                </Link>
              )
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider"
                >
                  Đăng Ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
