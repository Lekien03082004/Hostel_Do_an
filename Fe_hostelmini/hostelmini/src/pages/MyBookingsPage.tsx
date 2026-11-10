import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Search,
  Building2,
  User,
  Phone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  BellRing,
  Key,
  Receipt,
  RefreshCw,
  Info,
} from 'lucide-react';
import { PublicHeader } from '../components/layout/PublicHeader';
import { Modal } from '../components/common/Modal';
import { bookingsApi, billingApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Booking, Invoice } from '../types';

export const MyBookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Search state
  const [searchCode, setSearchCode] = useState('');
  const [searchPhone, setSearchPhone] = useState('');

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [selectedBookingForAction, setSelectedBookingForAction] = useState<Booking | null>(null);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [requestNote, setRequestNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Invoice state
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Auto-fetch if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyBookings();
    }
  }, [isAuthenticated]);

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await bookingsApi.getMyBookings();
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBookings(data);
      setSearched(true);
    } catch {
      // Fallback: If my_bookings is empty or user doesn't match by email, don't crash
      setBookings([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchCode.trim() && !searchPhone.trim()) {
      setErrorMsg('Vui lòng nhập Mã đơn đặt phòng hoặc Số điện thoại để tra cứu.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const res = await bookingsApi.lookup({
        code: searchCode.trim() || undefined,
        phone: searchPhone.trim() || undefined,
      });
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBookings(data);
      setSearched(true);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Không tìm thấy đơn đặt phòng phù hợp.');
      setBookings([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Submit Check-in Request
  const handleOpenCheckinModal = (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setRequestNote(booking.checkin_note || '');
    setIsCheckinModalOpen(true);
  };

  const handleSubmitCheckinRequest = async () => {
    if (!selectedBookingForAction) return;
    try {
      setActionLoading(true);
      const res = await bookingsApi.requestCheckIn(selectedBookingForAction.id, {
        note: requestNote.trim(),
      });
      const updatedBooking = res.data?.booking;

      // Update state
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBookingForAction.id ? { ...b, ...(updatedBooking || { checkin_requested: true, checkin_note: requestNote }) } : b))
      );

      setIsCheckinModalOpen(false);
      showNotification('Đã gửi yêu cầu Check-in tới Lễ tân! Lễ tân sẽ tiếp nhận và đón bạn ngay khi tới.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể gửi yêu cầu Check-in. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Check-out Request
  const handleOpenCheckoutModal = (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setRequestNote(booking.checkout_note || '');
    setIsCheckoutModalOpen(true);
  };

  const handleSubmitCheckoutRequest = async () => {
    if (!selectedBookingForAction) return;
    try {
      setActionLoading(true);
      const res = await bookingsApi.requestCheckOut(selectedBookingForAction.id, {
        note: requestNote.trim(),
      });
      const updatedBooking = res.data?.booking;

      // Update state
      setBookings((prev) =>
        prev.map((b) => (b.id === selectedBookingForAction.id ? { ...b, ...(updatedBooking || { checkout_requested: true, checkout_note: requestNote }) } : b))
      );

      setIsCheckoutModalOpen(false);
      showNotification('Đã gửi yêu cầu Check-out tới Lễ tân! Lễ tân sẽ kiểm tra phòng và hỗ trợ bạn.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Không thể gửi yêu cầu Check-out. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Invoice View
  const handleOpenInvoiceModal = async (booking: Booking) => {
    setSelectedBookingForAction(booking);
    setIsInvoiceModalOpen(true);
    try {
      setLoadingInvoice(true);
      const res = await billingApi.getInvoices({ booking: booking.id });
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      if (data.length > 0) setCurrentInvoice(data[0]);
      else setCurrentInvoice(null);
    } catch {
      setCurrentInvoice(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const formatCurrency = (val: string | number | undefined | null) => {
    if (!val) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ lễ tân xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Đã xác nhận phòng
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang lưu trú (Checked-in)
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 border border-stone-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-stone-500" />
            Đã trả phòng
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900 font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* PUBLIC HEADER */}
      <PublicHeader />

      {/* HERO SECTION */}
      <section className="relative bg-[#141312] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-[#262320] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/80 to-transparent" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CỔNG DỊCH VỤ KHÁCH HÀNG TRỰC TUYẾN</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
            Tra Cứu & Quản Lý Đơn Đặt Phòng
          </h1>

          <p className="text-stone-300 text-sm sm:text-base font-light max-w-2xl mx-auto leading-relaxed">
            Xem lại lịch sử chuyến đi, theo dõi tiến độ chuẩn bị phòng và chủ động gửi yêu cầu <strong>Check-in khi đến</strong> hoặc <strong>Check-out khi rời đi</strong>.
          </p>
        </div>
      </section>

      {/* LOOKUP SEARCH BAR CARD */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 relative z-20 w-full">
        <form
          onSubmit={handleLookup}
          className="rounded-3xl bg-white p-5 sm:p-6 shadow-xl border border-stone-200/90 flex flex-col md:flex-row items-center gap-4"
        >
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Mã Đơn / Mã Hóa Đơn
              </label>
              <div className="relative">
                <CalendarCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="Ví dụ: BK2026... hoặc INV2026..."
                  className="w-full rounded-xl border border-stone-300 bg-[#FAF9F7] pl-10 pr-3.5 py-2.5 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1.5">
                Số Điện Thoại Khách
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  value={searchPhone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  placeholder="Số điện thoại đặt phòng..."
                  className="w-full rounded-xl border border-stone-300 bg-[#FAF9F7] pl-10 pr-3.5 py-2.5 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto h-[42px] px-6 rounded-xl bg-stone-950 text-amber-300 text-xs font-bold uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Tra Cứu Đơn</span>
                </>
              )}
            </button>
          </div>
        </form>

        {isAuthenticated && (
          <div className="mt-3 flex items-center justify-between text-xs text-stone-500 px-2">
            <span>
              Đang đăng nhập: <strong className="text-stone-800 font-semibold">{user?.username} ({user?.email})</strong>
            </span>
            <button
              type="button"
              onClick={fetchMyBookings}
              className="text-amber-800 hover:text-amber-950 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Xem lại đơn của tôi</span>
            </button>
          </div>
        )}
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 space-y-6">
        {/* Success Alert */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-sm">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="flex h-56 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
              <span className="text-xs font-medium text-stone-500">Đang tra cứu dữ liệu đơn đặt phòng...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && searched && bookings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-12 text-center">
            <CalendarCheck className="mx-auto h-12 w-12 text-stone-300 mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy đơn đặt phòng nào</h3>
            <p className="mt-1 text-xs text-stone-500 font-light max-w-md mx-auto">
              Vui lòng kiểm tra lại Mã đơn hoặc Số điện thoại. Bạn cũng có thể liên hệ tổng đài <strong>1900 6886</strong> để được lễ tân hỗ trợ trực tiếp.
            </p>
          </div>
        )}

        {/* Booking Cards List */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h2 className="font-serif text-lg font-bold text-stone-900">
                Tìm thấy {bookings.length} đơn đặt phòng
              </h2>
              <span className="text-xs text-stone-500">Hỗ trợ 24/7 tại toàn chuỗi</span>
            </div>

            {bookings.map((booking) => {
              return (
                <div
                  key={booking.id}
                  className="rounded-3xl border border-[#EDE7DD] bg-white p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-bold text-amber-900">
                          #{booking.booking_code}
                        </span>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500">
                        <Building2 className="h-3.5 w-3.5 text-amber-600" />
                        <span className="font-semibold text-stone-800">{booking.branch_name || `Chi nhánh #${booking.branch}`}</span>
                        <span>•</span>
                        <span>Đặt ngày: {formatDateTime(booking.booked_at || booking.created_at)}</span>
                      </div>
                    </div>

                    {/* View Invoice button */}
                    <button
                      type="button"
                      onClick={() => handleOpenInvoiceModal(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      <Receipt className="h-3.5 w-3.5 text-amber-700" />
                      <span>Xem hóa đơn</span>
                    </button>
                  </div>

                  {/* ACTIVE REQUEST BANNERS */}
                  {booking.checkin_requested && (
                    <div className="rounded-2xl border border-purple-300 bg-purple-50/80 p-4 text-xs text-purple-950 flex items-start gap-3 shadow-2xs">
                      <BellRing className="h-5 w-5 text-purple-600 mt-0.5 shrink-0 animate-bounce" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="font-bold text-sm text-purple-900">
                            Bạn đã gửi Yêu Cầu Check-In trực tuyến!
                          </strong>
                          <span className="text-[11px] text-purple-700">
                            {formatDateTime(booking.checkin_request_time)}
                          </span>
                        </div>
                        <p className="text-purple-800">
                          Ghi chú: <span className="italic font-medium">"{booking.checkin_note || 'Khách đã tới sảnh và sẵn sàng nhận phòng'}"</span>
                        </p>
                        <p className="text-[11px] text-purple-700 font-light">
                          Lễ tân đã nhận thông báo và đang kiểm tra phòng. Vui lòng xuất trình CCCD tại quầy để nhận chìa khóa.
                        </p>
                      </div>
                    </div>
                  )}

                  {booking.checkout_requested && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950 flex items-start gap-3 shadow-2xs">
                      <BellRing className="h-5 w-5 text-amber-600 mt-0.5 shrink-0 animate-bounce" />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="font-bold text-sm text-amber-900">
                            Bạn đã gửi Yêu Cầu Check-Out trực tuyến!
                          </strong>
                          <span className="text-[11px] text-amber-700">
                            {formatDateTime(booking.checkout_request_time)}
                          </span>
                        </div>
                        <p className="text-amber-800">
                          Ghi chú: <span className="italic font-medium">"{booking.checkout_note || 'Khách chuẩn bị hành lý và muốn trả phòng'}"</span>
                        </p>
                        <p className="text-[11px] text-amber-700 font-light">
                          Lễ tân đang tổng hợp hóa đơn và kiểm tra phòng để hoàn tất thủ tục trả phòng cho bạn.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Room Details in Booking */}
                  <div className="space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Danh sách phòng trong đơn ({booking.details?.length || 0} phòng):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {booking.details?.map((detail) => (
                        <div
                          key={detail.id}
                          className="rounded-2xl border border-stone-200 bg-[#FAF9F7] p-3.5 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="h-7 w-7 rounded-lg bg-stone-900 text-amber-300 font-mono font-bold flex items-center justify-center text-xs">
                                {detail.room_number || `#${detail.room}`}
                              </span>
                              <div>
                                <p className="font-bold text-stone-900">{detail.room_type_name || 'Phòng nghỉ'}</p>
                                <p className="text-[10px] text-stone-500">
                                  {detail.rate_type === 'hourly' ? 'Theo giờ' : 'Theo ngày'}
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-amber-900">
                              {formatCurrency(detail.unit_price)}
                            </span>
                          </div>

                          <div className="space-y-1 text-stone-600 text-[11px]">
                            <p>
                              <strong>Nhận phòng:</strong> {formatDateTime(detail.check_in_planned)}
                            </p>
                            <p>
                              <strong>Trả phòng:</strong> {formatDateTime(detail.check_out_planned)}
                            </p>
                            {detail.check_in_actual && (
                              <p className="text-emerald-700 font-medium">
                                <strong>Thực tế vào:</strong> {formatDateTime(detail.check_in_actual)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOMER ACTION BUTTONS */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-stone-500 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-stone-400" />
                      <span>Khách: <strong className="text-stone-800">{booking.customer?.full_name}</strong> ({booking.customer?.phone})</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Check-in Button */}
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckinModal(booking)}
                          disabled={booking.checkin_requested}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            booking.checkin_requested
                              ? 'bg-purple-100 text-purple-800 border border-purple-300 opacity-80 cursor-default'
                              : 'bg-purple-700 hover:bg-purple-800 text-white'
                          }`}
                        >
                          <BellRing className="h-3.5 w-3.5" />
                          <span>{booking.checkin_requested ? 'Đã gửi yêu cầu Check-in' : 'Gửi yêu cầu Check-in'}</span>
                        </button>
                      )}

                      {/* Check-out Button */}
                      {booking.status === 'checked_in' && (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckoutModal(booking)}
                          disabled={booking.checkout_requested}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            booking.checkout_requested
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 opacity-80 cursor-default'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                        >
                          <Key className="h-3.5 w-3.5" />
                          <span>{booking.checkout_requested ? 'Đã gửi yêu cầu Check-out' : 'Gửi yêu cầu Check-out'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CHECK-IN REQUEST MODAL */}
      <Modal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        title={`Gửi Yêu Cầu Nhận Phòng #${selectedBookingForAction?.booking_code}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-purple-50 p-4 text-xs text-purple-900 border border-purple-200">
            <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Bạn có thể gửi yêu cầu Check-in khi đã đến khách sạn hoặc đang trên đường tới. Lễ tân sẽ ưu tiên dọn dẹp, chuẩn bị chìa khóa và đón bạn ngay khi tới quầy.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-[#FAF9F7] p-3 text-xs space-y-1 text-stone-700">
            <p><strong>Cơ sở:</strong> {selectedBookingForAction?.branch_name}</p>
            <p><strong>Khách lưu trú:</strong> {selectedBookingForAction?.customer?.full_name}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Ghi chú gửi lễ tân (Giờ dự kiến đến, số lượng hành lý...)
            </label>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Tôi đã có mặt tại sảnh, hoặc dự kiến đến lúc 14:15..."
              className="w-full rounded-xl border border-stone-300 p-3 text-xs text-stone-900 focus:border-purple-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsCheckinModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmitCheckinRequest}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
              <span>Gửi Yêu Cầu Cho Lễ Tân</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* CHECK-OUT REQUEST MODAL */}
      <Modal
        isOpen={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        title={`Gửi Yêu Cầu Trả Phòng #${selectedBookingForAction?.booking_code}`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs text-amber-900 border border-amber-200">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Khi chuẩn bị rời khách sạn, hãy gửi yêu cầu Check-out để lễ tân kiểm tra minibar, xuất hóa đơn sẵn sàng và tiết kiệm thời gian chờ đợi cho bạn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              Ghi chú gửi lễ tân (Bàn giao chìa khóa, thanh toán...)
            </label>
            <textarea
              value={requestNote}
              onChange={(e) => setRequestNote(e.target.value)}
              rows={3}
              placeholder="Ví dụ: Tôi đã gửi chìa khóa tại quầy, phòng không dùng đồ minibar, thanh toán chuyển khoản..."
              className="w-full rounded-xl border border-stone-300 p-3 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsCheckoutModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmitCheckoutRequest}
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
              <span>Gửi Yêu Cầu Trả Phòng</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* INVOICE DETAIL MODAL */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title={`Hóa Đơn Đơn Đặt #${selectedBookingForAction?.booking_code}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          {loadingInvoice ? (
            <div className="py-8 flex justify-center items-center text-xs text-stone-500">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải hóa đơn...
            </div>
          ) : currentInvoice ? (
            <div className="space-y-3 text-xs">
              <div className="rounded-2xl border border-stone-200 bg-[#FAF9F7] p-4 space-y-2">
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-500">Mã hóa đơn:</span>
                  <span className="font-mono font-bold text-stone-900">{currentInvoice.invoice_code}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-500">Tiền phòng:</span>
                  <span className="font-semibold text-stone-800">{formatCurrency(currentInvoice.subtotal_rooms)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-500">Tiền dịch vụ minibar:</span>
                  <span className="font-semibold text-stone-800">{formatCurrency(currentInvoice.subtotal_services)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-stone-200 text-sm">
                  <span className="font-bold text-stone-900">Tổng cộng:</span>
                  <span className="font-serif font-bold text-amber-900 text-base">{formatCurrency(currentInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-stone-500">Đã thanh toán:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(currentInvoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-stone-200 font-bold">
                  <span className="text-stone-800">Còn lại phải thu:</span>
                  <span className={currentInvoice.remaining_amount > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                    {formatCurrency(currentInvoice.remaining_amount)}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-stone-500 italic text-center">
                * Quý khách có thể thanh toán trực tiếp tại quầy lễ tân bằng tiền mặt, thẻ ngân hàng hoặc chuyển khoản mã QR.
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-stone-400">
              Chưa có dữ liệu hóa đơn cho đơn đặt này.
            </div>
          )}

          <div className="pt-3 border-t border-stone-100 flex justify-end">
            <button
              type="button"
              onClick={() => setIsInvoiceModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
