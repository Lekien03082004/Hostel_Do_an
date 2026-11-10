import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Plus,
  RefreshCw,
  Building2,
  Calendar,
  Clock,
  Phone,
  BedDouble,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  Coffee,
  X,
  Bell,
} from 'lucide-react';
import { bookingsApi, branchesApi } from '../api';
import type { Booking, Branch, BookingStatus } from '../types';
import {
  BookingDetailModal,
  AddServiceModal,
  WalkInBookingModal,
} from '../components/modals';

export const BookingsPage: React.FC = () => {
  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modals state
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [serviceBooking, setServiceBooking] = useState<Booking | null>(null);
  const [isServiceOpen, setIsServiceOpen] = useState(false);

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const [branchesRes, bookingsRes] = await Promise.all([
        branchesApi.getAll(),
        bookingsApi.getBookings(),
      ]);

      const branchesData = Array.isArray(branchesRes.data)
        ? branchesRes.data
        : (branchesRes.data as any).results || [];
      const bookingsData = Array.isArray(bookingsRes.data)
        ? bookingsRes.data
        : (bookingsRes.data as any).results || [];

      setBranches(branchesData);
      setBookings(bookingsData);
    } catch {
      setError('Không thể tải danh sách đơn đặt phòng. Vui lòng kiểm tra kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const reloadBookings = async () => {
    try {
      setRefreshing(true);
      const res = await bookingsApi.getBookings();
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBookings(data);
    } catch {
      setError('Lỗi làm mới dữ liệu.');
    } finally {
      setRefreshing(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4500);
  };

  // Actions
  const handleCheckIn = async (bookingId: number) => {
    try {
      setActionLoadingId(bookingId);
      setError('');
      await bookingsApi.checkIn(bookingId);
      showNotification('Nhận phòng (Check-in) thành công! Phòng đã chuyển sang trạng thái đang ở.');
      await reloadBookings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể thực hiện Check-in.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCheckOut = async (bookingId: number) => {
    try {
      setActionLoadingId(bookingId);
      setError('');
      await bookingsApi.checkOut(bookingId);
      showNotification('Trả phòng (Check-out) thành công! Phòng đã được chuyển sang chế độ chờ dọn dẹp.');
      await reloadBookings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể thực hiện Check-out.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    try {
      setActionLoadingId(bookingId);
      setError('');
      await bookingsApi.cancel(bookingId);
      showNotification('Hủy đơn đặt phòng thành công.');
      await reloadBookings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Không thể hủy đơn đặt phòng.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Branch filter
      if (selectedBranchId !== 'all' && String(b.branch) !== selectedBranchId) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'requested') {
          if (!b.checkin_requested && !b.checkout_requested) {
            return false;
          }
        } else if (b.status !== selectedStatus) {
          return false;
        }
      }

      // Date filter (by check-in date)
      if (selectedDate) {
        const hasMatchingDate = b.details?.some((d) =>
          d.check_in_planned?.startsWith(selectedDate)
        );
        if (!hasMatchingDate && !b.booked_at?.startsWith(selectedDate)) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchCode = b.booking_code?.toLowerCase().includes(term);
        const matchCustomer = b.customer?.full_name?.toLowerCase().includes(term);
        const matchPhone = b.customer?.phone?.includes(term);
        const matchRoom = b.details?.some((d) =>
          d.room_number?.toLowerCase().includes(term)
        );
        if (!matchCode && !matchCustomer && !matchPhone && !matchRoom) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, selectedBranchId, selectedStatus, selectedDate, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = bookings.length;
    const checkedIn = bookings.filter((b) => b.status === 'checked_in').length;
    const pending = bookings.filter((b) => b.status === 'pending' || b.status === 'confirmed').length;
    const checkedOut = bookings.filter((b) => b.status === 'checked_out').length;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const requested = bookings.filter((b) => b.checkin_requested || b.checkout_requested).length;
    return { total, checkedIn, pending, checkedOut, cancelled, requested };
  }, [bookings]);

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Chờ duyệt
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Đã duyệt
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Đang ở
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 border border-stone-200">
            <CheckCircle2 className="h-3 w-3 text-stone-500" />
            Đã trả phòng
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-500" />
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (val: string | number | undefined | null) => {
    if (!val) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const formatShortDateTime = (isoStr?: string | null) => {
    if (!isoStr) return '—';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-900 px-5 py-3.5 text-xs font-medium text-emerald-100 shadow-xl border border-emerald-700/60 animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0" />
          <span>{successMsg}</span>
          <button
            type="button"
            onClick={() => setSuccessMsg('')}
            className="ml-2 text-emerald-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2.5">
            <CalendarCheck className="h-7 w-7 text-amber-600" />
            Quản Lý Đặt Phòng & Điều Phối Lễ Tân
          </h2>
          <p className="text-xs text-stone-500 font-light mt-1">
            Tiếp nhận đơn đặt phòng trực tuyến, làm thủ tục Check-in / Check-out và điều phối buồng phòng tức thời.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={reloadBookings}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`h-4 w-4 text-stone-500 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            type="button"
            onClick={() => setIsWalkInOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo Đơn Tại Quầy (Walk-in)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#EDE7DD] bg-white p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Tổng số đơn</p>
            <p className="font-serif text-2xl font-bold text-stone-900 mt-0.5">{stats.total}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 border border-stone-200">
            <CalendarCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">Đang lưu trú (Ở)</p>
            <p className="font-serif text-2xl font-bold text-emerald-950 mt-0.5">{stats.checkedIn}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-200">
            <BedDouble className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Chờ nhận phòng</p>
            <p className="font-serif text-2xl font-bold text-amber-950 mt-0.5">{stats.pending}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">Đã trả phòng</p>
            <p className="font-serif text-2xl font-bold text-stone-800 mt-0.5">{stats.checkedOut}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-200 text-stone-700 border border-stone-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="rounded-2xl border border-[#EDE7DD] bg-white p-4 space-y-4 shadow-2xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-100 pb-3">
          {[
            { id: 'all', label: 'Tất cả đơn', count: stats.total },
            { id: 'requested', label: '🔔 Khách yêu cầu', count: stats.requested },
            { id: 'pending', label: 'Chờ duyệt', count: bookings.filter((b) => b.status === 'pending').length },
            { id: 'confirmed', label: 'Đã duyệt', count: bookings.filter((b) => b.status === 'confirmed').length },
            { id: 'checked_in', label: 'Đang ở', count: stats.checkedIn },
            { id: 'checked_out', label: 'Đã trả', count: stats.checkedOut },
            { id: 'cancelled', label: 'Đã hủy', count: stats.cancelled },
          ].map((tab) => {
            const isRequestedTab = tab.id === 'requested';
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? isRequestedTab
                      ? 'bg-purple-100 text-purple-950 border border-purple-300 shadow-2xs'
                      : 'bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs'
                    : isRequestedTab && tab.count > 0
                    ? 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.2 text-[10px] ${
                    isSelected
                      ? isRequestedTab
                        ? 'bg-purple-200 text-purple-900 font-bold'
                        : 'bg-amber-200 text-amber-900 font-bold'
                      : isRequestedTab && tab.count > 0
                      ? 'bg-purple-200 text-purple-800 font-bold'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Inputs Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên khách hàng, số điện thoại, số phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Branch Select */}
          <div className="lg:col-span-4 relative">
            <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              <option value="all">Tất cả chi nhánh ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker Filter */}
          <div className="lg:col-span-3 relative">
            <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
              title="Lọc theo ngày nhận phòng"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto text-rose-500 hover:text-rose-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Bookings Table / List */}
      <div className="overflow-hidden rounded-2xl border border-[#EDE7DD] bg-white shadow-2xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-2" />
            <p className="text-xs">Đang tải danh sách đơn đặt phòng...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <CalendarCheck className="h-12 w-12 text-stone-300 mb-3" />
            <p className="font-serif text-base font-semibold text-stone-700">
              Không tìm thấy đơn đặt phòng nào
            </p>
            <p className="text-xs text-stone-400 mt-1 max-w-sm text-center">
              Thử điều chỉnh lại bộ lọc tìm kiếm hoặc tạo một đơn đặt phòng mới tại quầy.
            </p>
            <button
              type="button"
              onClick={() => setIsWalkInOpen(true)}
              className="mt-4 flex items-center gap-1.5 rounded-xl bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Tạo đơn tại quầy ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EDE7DD] bg-[#FAF8F5] text-stone-600 font-semibold">
                <tr>
                  <th className="px-5 py-4">Mã Đơn / Nguồn</th>
                  <th className="px-5 py-4">Khách Hàng</th>
                  <th className="px-5 py-4">Chi Nhánh & Phòng</th>
                  <th className="px-5 py-4">Lịch Trình Lưu Trú</th>
                  <th className="px-5 py-4">Tiền Phòng</th>
                  <th className="px-5 py-4">Trạng Thái</th>
                  <th className="px-5 py-4 text-right">Thao Tác Nghiệp Vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE7DD]/70">
                {filteredBookings.map((b) => {
                  const firstDetail = b.details?.[0];
                  const isLoadingAction = actionLoadingId === b.id;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-amber-50/20 transition-colors group"
                    >
                      {/* Booking Code & Source */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setDetailBooking(b);
                              setIsDetailOpen(true);
                            }}
                            className="font-mono text-xs font-bold text-amber-900 hover:text-amber-700 hover:underline flex items-center gap-1 text-left cursor-pointer"
                          >
                            <span>{b.booking_code}</span>
                            <Eye className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                          </button>
                          <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-600 border border-stone-200">
                            {b.booking_source_name || 'Trực tiếp'}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-stone-900">
                            {b.customer?.full_name || 'Khách vãng lai'}
                          </p>
                          <p className="font-mono text-[11px] text-stone-500 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-stone-400" />
                            {b.customer?.phone || '—'}
                          </p>
                        </div>
                      </td>

                      {/* Branch & Rooms */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className="text-[11px] text-stone-500 font-medium block">
                            {b.branch_name || `Chi nhánh #${b.branch}`}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {b.details && b.details.length > 0 ? (
                              b.details.map((d) => (
                                <span
                                  key={d.id}
                                  className="inline-flex items-center gap-1 rounded-md bg-stone-900 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300"
                                >
                                  P.{d.room_number || d.room}
                                </span>
                              ))
                            ) : (
                              <span className="text-stone-400 text-[11px]">Chưa gán phòng</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Schedule (Check-in / Check-out) */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="flex items-center gap-1 text-stone-700">
                            <span className="text-stone-400 w-7">Vào:</span>
                            <strong>{formatShortDateTime(firstDetail?.check_in_planned)}</strong>
                          </div>
                          <div className="flex items-center gap-1 text-stone-700">
                            <span className="text-stone-400 w-7">Ra:</span>
                            <strong>{formatShortDateTime(firstDetail?.check_out_planned)}</strong>
                          </div>
                        </div>
                      </td>

                      {/* Room Price */}
                      <td className="px-5 py-4">
                        <span className="font-mono font-bold text-xs text-stone-900">
                          {formatCurrency(firstDetail?.unit_price)}
                        </span>
                        <span className="block text-[10px] text-stone-400">
                          {firstDetail?.rate_type === 'hourly' ? '/ giờ' : '/ ngày'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-start gap-1">
                          {getStatusBadge(b.status)}
                          {b.checkin_requested && (b.status === 'pending' || b.status === 'confirmed') && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800 border border-purple-300 animate-pulse">
                              <Bell className="h-2.5 w-2.5" />
                              Yêu cầu Check-in
                            </span>
                          )}
                          {b.checkout_requested && b.status === 'checked_in' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300 animate-pulse">
                              <Bell className="h-2.5 w-2.5" />
                              Yêu cầu Check-out
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Check-in button */}
                          {(b.status === 'pending' || b.status === 'confirmed') && (
                            <button
                              type="button"
                              disabled={isLoadingAction}
                              onClick={() => handleCheckIn(b.id)}
                              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-2xs transition-all disabled:opacity-50 cursor-pointer ${
                                b.checkin_requested
                                  ? 'bg-purple-700 hover:bg-purple-800 ring-2 ring-purple-400 ring-offset-1 font-bold'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                              title={b.checkin_requested ? 'Khách đã gửi yêu cầu check-in online: Bấm để duyệt ngay' : 'Làm thủ tục nhận phòng'}
                            >
                              {isLoadingAction ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              <span>{b.checkin_requested ? 'Duyệt Check-in' : 'Nhận phòng'}</span>
                            </button>
                          )}

                          {/* Check-out & Add service button */}
                          {b.status === 'checked_in' && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setServiceBooking(b);
                                  setIsServiceOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2 py-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Thêm đồ uống / giặt ủi"
                              >
                                <Coffee className="h-3 w-3 text-amber-700" />
                                <span className="hidden sm:inline">Gọi dịch vụ</span>
                              </button>
                              <button
                                type="button"
                                disabled={isLoadingAction}
                                onClick={() => handleCheckOut(b.id)}
                                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer ${
                                  b.checkout_requested
                                    ? 'bg-amber-700 hover:bg-amber-800 text-white ring-2 ring-amber-400 ring-offset-1 font-bold'
                                    : 'bg-stone-900 text-stone-100 hover:bg-stone-800'
                                }`}
                                title={b.checkout_requested ? 'Khách đã gửi yêu cầu check-out online: Bấm để duyệt ngay' : 'Làm thủ tục trả phòng'}
                              >
                                {isLoadingAction ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Clock className="h-3 w-3" />
                                )}
                                <span>{b.checkout_requested ? 'Duyệt Trả phòng' : 'Trả phòng'}</span>
                              </button>
                            </>
                          )}

                          {/* View details */}
                          <button
                            type="button"
                            onClick={() => {
                              setDetailBooking(b);
                              setIsDetailOpen(true);
                            }}
                            className="rounded-xl border border-stone-200 bg-white p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                            title="Xem chi tiết đơn"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Cancel button */}
                          {b.status !== 'checked_out' && b.status !== 'cancelled' && (
                            <button
                              type="button"
                              disabled={isLoadingAction}
                              onClick={() => {
                                if (window.confirm(`Xác nhận hủy đơn đặt phòng #${b.booking_code}?`)) {
                                  handleCancelBooking(b.id);
                                }
                              }}
                              className="rounded-xl border border-rose-200 bg-white p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Hủy đơn"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <WalkInBookingModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        branches={branches}
        onSuccess={() => {
          showNotification('Tạo đơn đặt phòng tại quầy thành công!');
          reloadBookings();
        }}
      />

      <BookingDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        booking={detailBooking}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
        onCancel={handleCancelBooking}
        onOpenAddService={(b) => {
          setServiceBooking(b);
          setIsServiceOpen(true);
        }}
        onRefresh={reloadBookings}
      />

      <AddServiceModal
        isOpen={isServiceOpen}
        onClose={() => setIsServiceOpen(false)}
        booking={serviceBooking}
        onSuccess={() => {
          showNotification('Đã thêm dịch vụ vào đơn đặt phòng thành công!');
          reloadBookings();
        }}
      />
    </div>
  );
};
