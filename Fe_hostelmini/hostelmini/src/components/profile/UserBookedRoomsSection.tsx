import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BedDouble,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BellRing,
  Key,
  Receipt,
  RefreshCw,
  Plus,
  CalendarCheck,
  Coffee,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { bookingsApi, billingApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import type { Booking, Invoice } from '../../types';

interface UserBookedRoomsSectionProps {
  onRefresh?: () => void;
}

export const UserBookedRoomsSection: React.FC<UserBookedRoomsSectionProps> = () => {
  const { user } = useAuth();

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'checked_in' | 'checked_out'>('all');

  // Modals state
  const [checkinModalBooking, setCheckinModalBooking] = useState<Booking | null>(null);
  const [checkinTime, setCheckinTime] = useState('');
  const [checkinNote, setCheckinNote] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);

  const [checkoutModalBooking, setCheckoutModalBooking] = useState<Booking | null>(null);
  const [checkoutTime, setCheckoutTime] = useState('');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  const [invoiceModalBooking, setInvoiceModalBooking] = useState<Booking | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const [actionError, setActionError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Fetch bookings when user changes
  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [user]);

  const fetchMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await bookingsApi.getMyBookings();
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBookings(data);
    } catch (err: any) {
      if (user?.employee?.phone) {
        try {
          const lookupRes = await bookingsApi.lookup({ phone: user.employee.phone });
          const data = Array.isArray(lookupRes.data) ? lookupRes.data : [];
          setBookings(data);
        } catch {
          setBookings([]);
        }
      } else {
        setBookings([]);
      }
    } finally {
      setLoadingBookings(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  // CHECKIN REQUEST ACTION
  const handleOpenCheckinModal = (booking: Booking) => {
    setCheckinModalBooking(booking);
    setActionError('');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCheckinTime(timeStr);
    setCheckinNote(booking.checkin_note || 'Khách đã có mặt tại sảnh và sẵn sàng nhận phòng.');
  };

  const handleSubmitCheckinRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinModalBooking) return;
    try {
      setSubmittingCheckin(true);
      setActionError('');
      const combinedNote = checkinTime
        ? `[Dự kiến tới: ${checkinTime}] ${checkinNote.trim()}`
        : checkinNote.trim();

      const res = await bookingsApi.requestCheckIn(checkinModalBooking.id, {
        checkin_note: combinedNote,
      });

      showToast('Đã gửi yêu cầu Check-in tới Lễ tân! Lễ tân sẽ sớm chuẩn bị phòng cho bạn.');
      setCheckinModalBooking(null);

      if (res.data?.booking) {
        setBookings((prev) => prev.map((b) => (b.id === checkinModalBooking.id ? res.data.booking : b)));
      } else {
        await fetchMyBookings();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Không thể gửi yêu cầu nhận phòng. Vui lòng thử lại.');
    } finally {
      setSubmittingCheckin(false);
    }
  };

  // CHECKOUT REQUEST ACTION
  const handleOpenCheckoutModal = (booking: Booking) => {
    setCheckoutModalBooking(booking);
    setActionError('');
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setCheckoutTime(timeStr);
    setCheckoutNote(booking.checkout_note || 'Khách đã chuẩn bị xong hành lý và muốn làm thủ tục trả phòng.');
  };

  const handleSubmitCheckoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModalBooking) return;
    try {
      setSubmittingCheckout(true);
      setActionError('');
      const combinedNote = checkoutTime
        ? `[Dự kiến rời phòng: ${checkoutTime}] ${checkoutNote.trim()}`
        : checkoutNote.trim();

      const res = await bookingsApi.requestCheckOut(checkoutModalBooking.id, {
        checkout_note: combinedNote,
      });

      showToast('Đã gửi yêu cầu Check-out tới Lễ tân! Lễ tân sẽ kiểm tra phòng và hỗ trợ bạn.');
      setCheckoutModalBooking(null);

      if (res.data?.booking) {
        setBookings((prev) => prev.map((b) => (b.id === checkoutModalBooking.id ? res.data.booking : b)));
      } else {
        await fetchMyBookings();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Không thể gửi yêu cầu trả phòng. Vui lòng thử lại.');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // INVOICE PREVIEW ACTION
  const handleOpenInvoiceModal = async (booking: Booking) => {
    setInvoiceModalBooking(booking);
    setInvoice(null);
    try {
      setLoadingInvoice(true);
      const [invRes, bookRes] = await Promise.allSettled([
        billingApi.getInvoices({ booking: booking.id }),
        bookingsApi.getBookingById(booking.id),
      ]);

      if (invRes.status === 'fulfilled') {
        const data = Array.isArray(invRes.value.data)
          ? invRes.value.data
          : (invRes.value.data as any).results || [];
        if (data.length > 0) {
          setInvoice(data[0]);
        }
      }

      if (bookRes.status === 'fulfilled' && bookRes.value.data) {
        setInvoiceModalBooking(bookRes.value.data);
      }
    } catch {
      setInvoice(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    if (statusFilter === 'all') return bookings;
    if (statusFilter === 'pending') {
      return bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed');
    }
    if (statusFilter === 'checked_in') {
      return bookings.filter((b) => b.status === 'checked_in');
    }
    if (statusFilter === 'checked_out') {
      return bookings.filter((b) => b.status === 'checked_out');
    }
    return bookings;
  }, [bookings, statusFilter]);

  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;
    const checkedIn = bookings.filter((b) => b.status === 'checked_in').length;
    const checkedOut = bookings.filter((b) => b.status === 'checked_out').length;
    return { total, pending, checkedIn, checkedOut };
  }, [bookings]);

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
            Chờ Lễ Tân Xác Nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Đã Giữ Phòng (Chờ nhận phòng)
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang Ở Khách Sạn (Checked-in)
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 border border-stone-200">
            <CheckCircle2 className="h-3.5 w-3.5 text-stone-500" />
            Đã Trả Phòng
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            Đã Hủy
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
    <div className="space-y-6">
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-24 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-900 px-5 py-3.5 text-xs font-medium text-emerald-100 shadow-2xl border border-emerald-600/70 animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg('')}
            className="ml-2 text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DDD2] pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-800 border border-amber-300">
              <BedDouble className="h-5 w-5" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Phòng Tôi Đã Book & Yêu Cầu Check-In / Check-Out
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
              {bookings.length} đơn
            </span>
          </div>
          <p className="text-xs text-stone-500 font-light mt-1">
            Theo dõi trạng thái các phòng đã đặt, gửi yêu cầu Check-in nhận phòng hoặc Check-out trả phòng trực tiếp tới Lễ tân.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchMyBookings}
            disabled={loadingBookings}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-stone-500 ${loadingBookings ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <Link
            to="/rooms"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Đặt Thêm Phòng</span>
          </Link>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'all', label: 'Tất cả đơn', count: stats.total },
          { id: 'pending', label: 'Chờ nhận phòng', count: stats.pending },
          { id: 'checked_in', label: 'Đang lưu trú (Ở)', count: stats.checkedIn },
          { id: 'checked_out', label: 'Đã trả phòng', count: stats.checkedOut },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id as any)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-amber-200 text-amber-950 font-bold border border-amber-400 shadow-2xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold text-stone-700">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* BOOKINGS LIST */}
      {loadingBookings ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-[#EDE7DD] text-stone-400">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-2" />
          <p className="text-xs">Đang tải danh sách phòng của bạn...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-white rounded-3xl border border-[#EDE7DD] text-center p-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
            <CalendarCheck className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif text-base font-bold text-stone-800">
              Chưa có phòng nào trong danh mục này
            </h4>
            <p className="text-xs text-stone-500 max-w-sm">
              Bạn có thể dễ dàng tìm kiếm và đặt phòng trực tuyến tại chuỗi khách sạn AH Hotel & Hospitality.
            </p>
          </div>
          <Link
            to="/rooms"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-all shadow-md cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Khám Phá Phòng & Đặt Ngay</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredBookings.map((booking) => {
            return (
              <div
                key={booking.id}
                className="rounded-3xl border border-[#EDE7DD] bg-white p-6 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-5"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold text-amber-950">
                        #{booking.booking_code}
                      </span>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span className="flex items-center gap-1.5 font-semibold text-stone-800">
                        <Building2 className="h-4 w-4 text-amber-600" />
                        {booking.branch_name || `Chi nhánh #${booking.branch}`}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        Ngày đặt: {formatDateTime(booking.booked_at || booking.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* View Invoice button */}
                  <button
                    type="button"
                    onClick={() => handleOpenInvoiceModal(booking)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Receipt className="h-3.5 w-3.5 text-amber-700" />
                    <span>Chi tiết hóa đơn</span>
                  </button>
                </div>

                {/* ACTIVE ONLINE REQUEST BANNERS */}
                {booking.checkin_requested && (booking.status === 'pending' || booking.status === 'confirmed') && (
                  <div className="rounded-2xl border-2 border-purple-300 bg-purple-50/90 p-4 text-xs text-purple-950 flex items-start justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <BellRing className="h-5 w-5 text-purple-600 mt-0.5 shrink-0 animate-bounce" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-sm text-purple-900">
                            Bạn đã gửi Yêu Cầu Check-In trực tuyến!
                          </strong>
                          <span className="text-[11px] text-purple-700 font-normal">
                            ({formatDateTime(booking.checkin_request_time)})
                          </span>
                        </div>
                        <p className="text-purple-800">
                          Ghi chú của bạn: <span className="italic font-medium text-purple-950">"{booking.checkin_note || 'Khách đã có mặt tại sảnh và sẵn sàng nhận phòng'}"</span>
                        </p>
                        <p className="text-[11px] text-purple-700 font-light">
                          Lễ tân đã nhận được yêu cầu và đang chuẩn bị phòng cho bạn. Vui lòng xuất trình CCCD tại quầy để nhận chìa khóa.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckinModal(booking)}
                      className="shrink-0 text-[11px] font-bold text-purple-700 hover:text-purple-900 underline cursor-pointer"
                    >
                      Sửa ghi chú
                    </button>
                  </div>
                )}

                {booking.checkout_requested && booking.status === 'checked_in' && (
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 flex items-start justify-between gap-3 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <Key className="h-5 w-5 text-amber-600 mt-0.5 shrink-0 animate-bounce" />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <strong className="font-bold text-sm text-amber-900">
                            Bạn đã gửi Yêu Cầu Check-Out trực tuyến!
                          </strong>
                          <span className="text-[11px] text-amber-700 font-normal">
                            ({formatDateTime(booking.checkout_request_time)})
                          </span>
                        </div>
                        <p className="text-amber-800">
                          Ghi chú của bạn: <span className="italic font-medium text-amber-950">"{booking.checkout_note || 'Khách chuẩn bị hành lý và muốn làm thủ tục trả phòng'}"</span>
                        </p>
                        <p className="text-[11px] text-amber-700 font-light">
                          Lễ tân đang kiểm tra phòng và chuẩn bị hóa đơn thanh toán cho bạn tại sảnh.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenCheckoutModal(booking)}
                      className="shrink-0 text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      Sửa ghi chú
                    </button>
                  </div>
                )}

                {/* Rooms details inside booking */}
                <div className="space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Phòng bạn đã book ({booking.details?.length || 0} phòng):
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {booking.details?.map((detail) => (
                      <div
                        key={detail.id}
                        className="rounded-2xl border border-stone-200 bg-[#FAF9F7] p-4 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="h-8 w-8 rounded-xl bg-stone-900 text-amber-300 font-mono font-bold flex items-center justify-center text-xs shadow-xs">
                              {detail.room_number ? `P.${detail.room_number}` : `#${detail.room}`}
                            </span>
                            <div>
                              <p className="font-bold text-stone-900 text-sm">{detail.room_type_name || 'Phòng nghỉ'}</p>
                              <p className="text-[10px] text-stone-500">
                                {detail.rate_type === 'hourly' ? 'Theo giờ' : 'Theo ngày'}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-amber-900 text-sm">
                            {formatCurrency(detail.unit_price)}
                          </span>
                        </div>

                        <div className="space-y-1 text-stone-600 text-[11px] pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Giờ nhận phòng:</span>
                            <strong>{formatDateTime(detail.check_in_planned)}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-stone-400">Giờ trả phòng:</span>
                            <strong>{formatDateTime(detail.check_out_planned)}</strong>
                          </div>
                          {detail.check_in_actual && (
                            <div className="flex items-center justify-between text-emerald-700">
                              <span>Thực tế vào phòng:</span>
                              <strong>{formatDateTime(detail.check_in_actual)}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BOTTOM ACTION BAR */}
                <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-stone-500">
                    Khách đặt: <strong className="text-stone-800">{booking.customer?.full_name}</strong> ({booking.customer?.phone})
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* CHECK-IN ACTION BUTTON */}
                    {(booking.status === 'pending' || booking.status === 'confirmed') && (
                      <button
                        type="button"
                        onClick={() => handleOpenCheckinModal(booking)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                          booking.checkin_requested
                            ? 'bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200'
                            : 'bg-purple-700 hover:bg-purple-800 text-white ring-2 ring-purple-400/40 ring-offset-1'
                        }`}
                      >
                        <BellRing className="h-4 w-4" />
                        <span>{booking.checkin_requested ? 'Cập Nhật Yêu Cầu Check-In' : 'Gửi Yêu Cầu Check-In (Nhận phòng)'}</span>
                      </button>
                    )}

                    {/* ORDER SERVICES ACTION BUTTON */}
                    {booking.status === 'checked_in' && (
                      <Link
                        to="/services"
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-900 text-amber-300 hover:bg-stone-800 transition-all shadow-md"
                      >
                        <Coffee className="h-4 w-4 text-amber-400" />
                        <span>Gọi món & Dịch vụ</span>
                      </Link>
                    )}

                    {/* CHECK-OUT ACTION BUTTON */}
                    {booking.status === 'checked_in' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCheckoutModal(booking)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
                          booking.checkout_requested
                            ? 'bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200'
                            : 'bg-amber-700 hover:bg-amber-800 text-white ring-2 ring-amber-400/40 ring-offset-1'
                        }`}
                      >
                        <Key className="h-4 w-4" />
                        <span>{booking.checkout_requested ? 'Cập Nhật Yêu Cầu Check-Out' : 'Gửi Yêu Cầu Check-Out (Trả phòng)'}</span>
                      </button>
                    )}

                    {booking.status === 'checked_out' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 text-stone-600 text-xs font-semibold border border-stone-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-stone-500" />
                        <span>Đã hoàn tất kỳ lưu trú</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECK-IN REQUEST MODAL */}
      <Modal
        isOpen={!!checkinModalBooking}
        onClose={() => setCheckinModalBooking(null)}
        title={`Gửi Yêu Cầu Check-In Đơn #${checkinModalBooking?.booking_code}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitCheckinRequest} className="space-y-4 text-left">
          {actionError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="rounded-2xl bg-purple-50/80 border border-purple-200 p-4 text-xs text-purple-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <BellRing className="h-4 w-4 text-purple-700" />
              <span>Lễ tân sẽ nhận được thông báo ngay lập tức!</span>
            </p>
            <p className="text-purple-800 font-light">
              Sau khi gửi yêu cầu, lễ tân cơ sở {checkinModalBooking?.branch_name} sẽ tiến hành chuẩn bị phòng, mở điều hòa và chuẩn bị chìa khóa để đón bạn.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Thời gian bạn dự kiến đến khách sạn:
            </label>
            <input
              type="time"
              value={checkinTime}
              onChange={(e) => setCheckinTime(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-purple-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Ghi chú thêm gửi Lễ tân:
            </label>
            <textarea
              rows={3}
              value={checkinNote}
              onChange={(e) => setCheckinNote(e.target.value)}
              placeholder="Ví dụ: Tôi đã tới sảnh khách sạn / Xin nhận phòng sớm 30 phút..."
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-xs text-stone-900 focus:border-purple-600 focus:outline-none"
            />

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Tôi đã có mặt tại sảnh',
                'Dự kiến 15 phút nữa tới nơi',
                'Xin nhận phòng sớm',
                'Gia đình có trẻ nhỏ',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCheckinNote(tag)}
                  className="rounded-lg bg-stone-100 hover:bg-purple-100 text-stone-600 hover:text-purple-800 px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setCheckinModalBooking(null)}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingCheckin}
              className="px-5 py-2 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submittingCheckin ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellRing className="h-3.5 w-3.5" />}
              <span>Gửi Yêu Cầu Check-In Ngay</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* CHECK-OUT REQUEST MODAL */}
      <Modal
        isOpen={!!checkoutModalBooking}
        onClose={() => setCheckoutModalBooking(null)}
        title={`Gửi Yêu Cầu Check-Out Đơn #${checkoutModalBooking?.booking_code}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitCheckoutRequest} className="space-y-4 text-left">
          {actionError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="rounded-2xl bg-amber-50/90 border border-amber-200 p-4 text-xs text-amber-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Key className="h-4 w-4 text-amber-800" />
              <span>Lễ tân sẽ nhận thông báo kiểm tra phòng</span>
            </p>
            <p className="text-amber-800 font-light">
              Lễ tân sẽ tổng hợp hóa đơn tiền phòng và các dịch vụ sử dụng để bạn thanh toán nhanh chóng tại sảnh.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Thời gian bạn dự kiến rời phòng:
            </label>
            <input
              type="time"
              value={checkoutTime}
              onChange={(e) => setCheckoutTime(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Ghi chú thêm hoặc Yêu cầu hóa đơn:
            </label>
            <textarea
              rows={3}
              value={checkoutNote}
              onChange={(e) => setCheckoutNote(e.target.value)}
              placeholder="Ví dụ: Cần xuất hóa đơn VAT / Tôi để chìa khóa trên bàn / Dịch vụ rất tốt..."
              className="w-full rounded-xl border border-stone-300 bg-white p-3 text-xs text-stone-900 focus:border-amber-600 focus:outline-none"
            />

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                'Tôi chuẩn bị xuống quầy',
                'Cần xuất hóa đơn VAT công ty',
                'Tôi để chìa khóa tại phòng',
                'Dịch vụ rất tốt, cảm ơn',
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setCheckoutNote(tag)}
                  className="rounded-lg bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setCheckoutModalBooking(null)}
              className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submittingCheckout}
              className="px-5 py-2 rounded-xl bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {submittingCheckout ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
              <span>Gửi Yêu Cầu Check-Out Ngay</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* INVOICE PREVIEW MODAL */}
      <Modal
        isOpen={!!invoiceModalBooking}
        onClose={() => setInvoiceModalBooking(null)}
        title={`Bảng Kê Hóa Đơn #${invoiceModalBooking?.booking_code}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5 text-left text-xs">
          {loadingInvoice ? (
            <div className="flex flex-col items-center justify-center py-12 text-stone-400">
              <Loader2 className="h-6 w-6 animate-spin text-amber-600 mb-2" />
              <p>Đang tải thông tin hóa đơn...</p>
            </div>
          ) : !invoice ? (
            <div className="p-8 text-center text-stone-500 space-y-2">
              <Receipt className="h-8 w-8 text-stone-300 mx-auto" />
              <p className="font-semibold">Hóa đơn đang được hệ thống tổng hợp</p>
              <p className="text-stone-400 text-[11px]">
                Tổng tiền phòng tạm tính:{' '}
                <strong>
                  {formatCurrency(
                    invoiceModalBooking?.details?.reduce((acc, d) => acc + Number(d.unit_price || 0), 0)
                  )}
                </strong>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <span className="font-mono text-sm font-bold text-amber-900">
                    Hóa đơn #{invoice.invoice_code}
                  </span>
                  <p className="text-stone-500 text-[11px]">
                    Ngày lập: {formatDateTime(invoice.created_at)}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                  invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status === 'paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                </span>
              </div>

              {/* Itemized Services Table */}
              {invoiceModalBooking?.details?.some((d) => d.services_used && d.services_used.length > 0) && (
                <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="font-serif font-semibold text-stone-900 flex items-center gap-1.5 text-xs">
                      <Coffee className="h-3.5 w-3.5 text-amber-700" />
                      Dịch vụ & Món ăn đã gọi lên phòng
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Tính vào hóa đơn phòng khi check-out
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-stone-100 text-[10px] uppercase text-stone-400">
                        <tr>
                          <th className="py-1">Phòng</th>
                          <th className="py-1">Dịch vụ</th>
                          <th className="py-1 text-center">SL</th>
                          <th className="py-1 text-right">Đơn giá</th>
                          <th className="py-1 text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50 text-[11px]">
                        {invoiceModalBooking.details.flatMap((detail) =>
                          (detail.services_used || []).map((s) => (
                            <tr key={s.id}>
                              <td className="py-1.5 font-medium text-stone-700">
                                {detail.room_number || `#${detail.room}`}
                              </td>
                              <td className="py-1.5 font-medium text-stone-900">{s.service_name}</td>
                              <td className="py-1.5 text-center text-stone-600">
                                {s.quantity} {s.service_unit}
                              </td>
                              <td className="py-1.5 text-right font-mono text-stone-600">
                                {formatCurrency(s.unit_price)}
                              </td>
                              <td className="py-1.5 text-right font-mono font-bold text-amber-900">
                                {formatCurrency(s.total_price)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-stone-200 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Tiền phòng:</span>
                  <span className="font-semibold text-stone-900">{formatCurrency(invoice.subtotal_rooms)}</span>
                </div>
                {Number(invoice.subtotal_services) > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Dịch vụ & ăn uống:</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(invoice.subtotal_services)}</span>
                  </div>
                )}
                {Number(invoice.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Giảm giá / Ưu đãi:</span>
                    <span className="font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
                  </div>
                )}
                {Number(invoice.tax_amount) > 0 && (
                  <div className="flex justify-between text-stone-600">
                    <span>Thuế GTGT:</span>
                    <span className="font-semibold text-stone-900">{formatCurrency(invoice.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-900 font-bold text-sm border-t border-stone-200 pt-2.5">
                  <span>TỔNG CỘNG:</span>
                  <span className="text-amber-900">{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 pt-1 text-[11px]">
                  <span>Đã thanh toán:</span>
                  <span className="font-semibold">{formatCurrency(invoice.paid_amount)}</span>
                </div>
                {Number(invoice.remaining_amount) > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold pt-1 text-[11px]">
                    <span>Còn lại cần thanh toán:</span>
                    <span>{formatCurrency(invoice.remaining_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => setInvoiceModalBooking(null)}
              className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
