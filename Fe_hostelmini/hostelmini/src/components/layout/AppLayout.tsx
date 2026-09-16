import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  LogOut,
  Hotel,
  Menu,
  X,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/branches', label: 'Quản lý Chi nhánh', icon: Building2 },
    { to: '/customers', label: 'Quản lý Khách thuê', icon: Users },
  ];

  return (
    <div className="flex min-h-screen bg-[#F7F5F0] font-sans text-stone-900">
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-68 flex-col bg-[#141312] text-stone-300 border-r border-[#262320] transition-transform duration-300 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-20 items-center gap-3.5 border-b border-[#262320] px-6 bg-[#181615]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shadow-md">
            <Hotel className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-base font-bold tracking-wider text-white uppercase truncate">
              Aurelia Hostels
            </h1>
            <p className="text-[10px] tracking-widest text-amber-200/70 font-medium uppercase truncate">
              Boutique Hospitality
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <div className="px-3 pb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Quản trị Vận hành
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-3 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? 'bg-[#25221E] text-amber-300 border border-amber-500/30 shadow-xs'
                      : 'text-stone-400 hover:bg-[#1E1C1A] hover:text-stone-200'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 text-amber-400/80" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="border-t border-[#262320] p-4 bg-[#181615]">
          <div className="flex items-center gap-3 rounded-2xl bg-[#201E1B] p-3 border border-[#2E2B26]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 font-serif font-bold text-sm border border-amber-400/30 shrink-0">
              {user?.first_name?.[0] || user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-stone-100">
                {user?.employee?.full_name || user?.username}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-amber-200/80 font-medium mt-0.5">
                {user?.is_superuser ? (
                  <>
                    <ShieldAlert className="h-3 w-3 text-amber-400" />
                    <span>Quản trị viên cấp cao</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="h-3 w-3 text-emerald-400" />
                    <span className="truncate">{user?.employee?.role_name || 'Nhân viên'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#3A352F] bg-[#141312] px-3 py-2.5 text-xs font-semibold text-stone-300 hover:bg-stone-900 hover:text-rose-400 hover:border-rose-900/50 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header on mobile */}
        <header className="flex h-16 items-center justify-between border-b border-[#E3DDD2] bg-white px-4 md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-amber-400">
              <Hotel className="h-4 w-4" />
            </div>
            <span className="font-serif font-bold tracking-wide text-stone-900">Aurelia Hostels</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </header>

        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex h-16 items-center justify-between border-b border-[#E6E0D5] bg-white/70 backdrop-blur-md px-8 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Hệ thống Vận hành Chuỗi
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-xs text-amber-900 font-medium px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
              Phiên bản 2.0 (Boutique Edition)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-stone-600">
            <span>Chào mừng quay trở lại, <strong className="text-stone-900 font-bold">{user?.employee?.full_name || user?.username}</strong></span>
          </div>
        </header>

        {/* Page Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

