import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  Building2,
  BedDouble,
  Coffee,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Receipt,
  Plus,
  Loader2,
  Bell,
  Banknote,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { PaymentModal } from './PaymentModal';
import { billingApi } from '../../api';
import type { Booking, Invoice } from '../../types';

export interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCheckIn: (bookingId: number) => Promise<void>;
  onCheckOut: (bookingId: number) => Promise<void>;
  onCancel: (bookingId: number) => Promise<void>;
  onOpenAddService: (booking: Booking) => void;
  onRefresh: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCheckIn,
  onCheckOut,
  onCancel,
  onOpenAddService,
  onRefresh,
}) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      setActionError('');
      fetchInvoice();
    } else {
      setInvoice(null);
    }
  }, [isOpen, booking]);

  const fetchInvoice = async () => {
    if (!booking) return;
    try {
      setLoadingInvoice(true);
      const res = await billingApi.getInvoices({ booking: booking.id });
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      if (data.length > 0) {
        setInvoice(data[0]);
      } else {
        setInvoice(null);
      }
    } catch {
      // Non-blocking if invoice fails to load
      setInvoice(null);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleRecalculateInvoice = async () => {
    if (!invoice) return;
    try {
      setRecalculating(true);
      const res = await billingApi.recalculateInvoice(invoice.id);
      setInvoice(res.data);
    } catch {
      // Non-blocking
    } finally {
      setRecalculating(false);
    }
  };

  if (!booking) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ xác nhận
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Đã xác nhận
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang ở (Checked-in)
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
            <XCircle className="h-3.5 w-3.5 text-rose-500" />
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

  const handleAction = async (fn: (id: number) => Promise<void>) => {
    try {
      setActionLoading(true);
      setActionError('');
      await fn(booking.id);
      onClose();
    } catch (err: any) {
      setActionError(err.response?.data?.error || err.message || 'Thao tác không thành công.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết Đơn đặt phòng #${booking.booking_code}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {actionError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Customer Online Check-in Request Alert */}
        {booking.checkin_requested && (booking.status === 'pending' || booking.status === 'confirmed') && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-purple-300 bg-purple-50/90 p-4 text-xs text-purple-900 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-200 text-purple-700 shrink-0 mt-0.5">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="font-bold text-sm text-purple-950 flex flex-wrap items-center gap-2">
                  <span>Khách hàng đã gửi yêu cầu Check-in Online</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-800">
                    {formatDateTime(booking.checkin_request_time)}
                  </span>
                </div>
                <p className="mt-1 text-purple-800">
                  Ghi chú của khách: <strong className="font-semibold text-purple-950">"{booking.checkin_note || 'Không có ghi chú thêm'}"</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAction(onCheckIn)}
              className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-purple-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span>Duyệt Nhận Phòng Ngay</span>
            </button>
          </div>
        )}

        {/* Customer Online Check-out Request Alert */}
        {booking.checkout_requested && booking.status === 'checked_in' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-200 text-amber-800 shrink-0 mt-0.5">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="font-bold text-sm text-amber-950 flex flex-wrap items-center gap-2">
                  <span>Khách hàng đã gửi yêu cầu Check-out (Trả phòng) Online</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                    {formatDateTime(booking.checkout_request_time)}
                  </span>
                </div>
                <p className="mt-1 text-amber-900">
                  Ghi chú / phản hồi: <strong className="font-semibold text-amber-950">"{booking.checkout_note || 'Không có ghi chú thêm'}"</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleAction(onCheckOut)}
              className="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-amber-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              <span>Duyệt Trả Phòng Ngay</span>
            </button>
          </div>
        )}

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-[#FAF8F5] p-5 border border-[#EDE7DD]">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xl font-bold tracking-tight text-amber-900">
                {booking.booking_code}
              </span>
              {getStatusBadge(booking.status)}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                {booking.branch_name || `Chi nhánh #${booking.branch}`}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Đặt ngày: {formatDateTime(booking.booked_at || booking.created_at)}
              </span>
              <span>•</span>
              <span>Nguồn: <strong>{booking.booking_source_name || 'Trực tiếp'}</strong></span>
            </div>
          </div>

          {/* Quick Status Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => handleAction(onCheckIn)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Nhận phòng (Check-in)</span>
              </button>
            )}

            {booking.status === 'checked_in' && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAddService(booking)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Gọi Dịch Vụ</span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAction(onCheckOut)}
                  className="flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-stone-100 shadow-xs hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                  <span>Trả phòng (Check-out)</span>
                </button>
              </>
            )}

            {booking.status !== 'checked_out' && booking.status !== 'cancelled' && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => {
                  if (window.confirm(`Bạn có chắc muốn hủy đơn đặt phòng #${booking.booking_code}?`)) {
                    handleAction(onCancel);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Hủy Đơn</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Columns Grid: Customer Info & Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Customer Info Card */}
          <div className="rounded-2xl border border-[#EDE7DD] bg-white p-5 space-y-3.5">
            <h4 className="flex items-center gap-2 font-serif text-sm font-semibold text-stone-900 border-b border-stone-100 pb-2">
              <User className="h-4 w-4 text-amber-600" />
              <span>Thông tin Khách thuê</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-stone-500">Họ và tên:</span>
                <span className="font-semibold text-stone-900 text-sm">{booking.customer?.full_name || 'Khách vãng lai'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-stone-500 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-stone-400" />
                  Số điện thoại:
                </span>
                <a href={`tel:${booking.customer?.phone}`} className="font-mono font-medium text-amber-800 hover:underline">
                  {booking.customer?.phone || 'Chưa cập nhật'}
                </a>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-stone-500 flex items-center gap-1">
                  <Mail className="h-3 w-3 text-stone-400" />
                  Email:
                </span>
                <span className="text-stone-700">{booking.customer?.email || '—'}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-stone-500 flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-stone-400" />
                  CCCD / CMND:
                </span>
                <span className="font-mono text-stone-700">{booking.customer?.id_card_number || 'Chưa lưu'}</span>
              </div>
              {booking.note && (
                <div className="pt-2 border-t border-stone-100">
                  <span className="text-stone-500 block mb-1">Ghi chú từ khách / Lễ tân:</span>
                  <p className="rounded-xl bg-amber-50/70 p-2.5 text-xs text-amber-900 border border-amber-200/60 italic">
                    "{booking.note}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Billing & Invoice Summary Card */}
          <div className="rounded-2xl border border-[#EDE7DD] bg-white p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <h4 className="flex items-center gap-2 font-serif text-sm font-semibold text-stone-900">
                <Receipt className="h-4 w-4 text-amber-600" />
                <span>Hóa đơn & Thanh toán</span>
              </h4>
              {invoice && (
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                  invoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : invoice.status === 'partial'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {invoice.status === 'paid' ? 'Đã thanh toán đủ' : invoice.status === 'partial' ? 'Thanh toán một phần' : 'Chưa thanh toán'}
                </span>
              )}
            </div>

            {loadingInvoice ? (
              <div className="py-8 flex justify-center items-center text-xs text-stone-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải hóa đơn...
              </div>
            ) : invoice ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-stone-500">Mã hóa đơn:</span>
                  <span className="font-mono font-bold text-stone-900">{invoice.invoice_code}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-stone-500">Tiền phòng (Subtotal):</span>
                  <span className="font-medium text-stone-800">{formatCurrency(invoice.subtotal_rooms)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-stone-500">Tiền dịch vụ:</span>
                  <span className="font-medium text-stone-800">{formatCurrency(invoice.subtotal_services)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-t border-stone-100 text-sm">
                  <span className="font-semibold text-stone-900">Tổng cộng:</span>
                  <span className="font-serif font-bold text-base text-amber-900">{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-stone-500">Đã thanh toán:</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(invoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-t border-stone-100">
                  <span className="font-medium text-stone-700">Còn lại phải thu:</span>
                  <span className={`font-bold ${invoice.remaining_amount > 0 ? 'text-rose-600' : 'text-stone-500'}`}>
                    {formatCurrency(invoice.remaining_amount)}
                  </span>
                </div>

                {/* Actions: Recalculate & Payment */}
                <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={handleRecalculateInvoice}
                    disabled={recalculating}
                    title="Tính lại tổng tiền phòng và tiền các dịch vụ đã dùng"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-200 text-[11px] font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${recalculating ? 'animate-spin text-amber-600' : ''}`} />
                    <span>{recalculating ? 'Đang tính...' : 'Cập nhật số tiền'}</span>
                  </button>

                  {invoice.remaining_amount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-[11px] font-semibold text-white hover:bg-amber-700 shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      <span>Thu tiền ({formatCurrency(invoice.remaining_amount)})</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đã thanh toán đủ
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-stone-400">
                Chưa có dữ liệu hóa đơn cho đơn đặt này.
              </div>
            )}
          </div>
        </div>

        {/* Room Details & Services Used */}
        <div className="rounded-2xl border border-[#EDE7DD] bg-white p-5 space-y-4">
          <h4 className="flex items-center gap-2 font-serif text-sm font-semibold text-stone-900 border-b border-stone-100 pb-2">
            <BedDouble className="h-4 w-4 text-amber-600" />
            <span>Phòng Đã Đặt & Dịch Vụ Sử Dụng ({booking.details?.length || 0} phòng)</span>
          </h4>

          {booking.details && booking.details.length > 0 ? (
            <div className="space-y-4">
              {booking.details.map((detail) => (
                <div
                  key={detail.id}
                  className="rounded-xl border border-stone-200 bg-[#FAF9F7] p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 font-mono font-bold text-sm text-amber-300">
                        {detail.room_number || `#${detail.room}`}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-stone-900">{detail.room_type_name || 'Phòng nghỉ'}</p>
                        <p className="text-[11px] text-stone-500">Hình thức: {detail.rate_type === 'hourly' ? 'Theo giờ' : 'Theo ngày'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-400 block">Đơn giá snapshot</span>
                      <span className="font-mono font-bold text-xs text-amber-900">{formatCurrency(detail.unit_price)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider">Thời gian dự kiến</span>
                      <p className="text-stone-700"><strong>Vào:</strong> {formatDateTime(detail.check_in_planned)}</p>
                      <p className="text-stone-700"><strong>Ra:</strong> {formatDateTime(detail.check_out_planned)}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-stone-400 uppercase font-semibold tracking-wider">Thực tế nhận / trả</span>
                      <p className="text-stone-700"><strong>Thực tế vào:</strong> {formatDateTime(detail.check_in_actual)}</p>
                      <p className="text-stone-700"><strong>Thực tế ra:</strong> {formatDateTime(detail.check_out_actual)}</p>
                    </div>
                  </div>

                  {/* Services Used in this Room */}
                  <div className="pt-2 border-t border-stone-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-stone-600 flex items-center gap-1.5">
                        <Coffee className="h-3 w-3 text-amber-600" />
                        Dịch vụ đã dùng tại phòng này ({detail.services_used?.length || 0}):
                      </span>
                      {booking.status === 'checked_in' && (
                        <button
                          type="button"
                          onClick={() => onOpenAddService(booking)}
                          className="text-[11px] font-medium text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Thêm món/dịch vụ
                        </button>
                      )}
                    </div>

                    {detail.services_used && detail.services_used.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="border-b border-stone-200 bg-stone-50 text-[11px] text-stone-500">
                            <tr>
                              <th className="px-3 py-1.5 font-medium">Tên dịch vụ</th>
                              <th className="px-3 py-1.5 font-medium text-center">Số lượng</th>
                              <th className="px-3 py-1.5 font-medium text-right">Đơn giá</th>
                              <th className="px-3 py-1.5 font-medium text-right">Thành tiền</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {detail.services_used.map((s) => (
                              <tr key={s.id}>
                                <td className="px-3 py-1.5 font-medium text-stone-800">{s.service_name}</td>
                                <td className="px-3 py-1.5 text-center text-stone-600">{s.quantity} {s.service_unit}</td>
                                <td className="px-3 py-1.5 text-right font-mono text-stone-600">{formatCurrency(s.unit_price)}</td>
                                <td className="px-3 py-1.5 text-right font-mono font-bold text-amber-900">{formatCurrency(s.total_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-[11px] text-stone-400 italic">Chưa phát sinh dịch vụ mini-bar / giặt ủi tại phòng này.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-400 py-3">Không có thông tin chi tiết phòng.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </Modal>

    {invoice && (
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={invoice}
        booking={booking}
        onSuccess={() => {
          fetchInvoice();
          onRefresh();
        }}
      />
    )}
  </>
  );
};
