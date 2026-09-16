import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hotel, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
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
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại backend.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-center text-white">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md shadow-inner mb-3">
            <Hotel className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Hostel Mini</h2>
          <p className="mt-1 text-sm text-indigo-100 font-medium">Đăng nhập tài khoản hệ thống</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tên đăng nhập
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3.5 text-sm text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-600 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500 font-medium">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-bold text-indigo-600 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
