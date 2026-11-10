import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  BedDouble,
  AlertCircle,
  Loader2,
  Check,
  Search,
  Moon,
  Plus,
  Minus,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { bookingsApi, customersApi, roomsApi } from '../../api';
import type { Branch, Room, Customer, BookingSource } from '../../types';

// Helper to add days to 'YYYY-MM-DD' cleanly
const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to get number of days between two 'YYYY-MM-DD' dates
const getDiffDays = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 1;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  const diffTime = dt2.getTime() - dt1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

export interface WalkInBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  onSuccess: () => void;
}

export const WalkInBookingModal: React.FC<WalkInBookingModalProps> = ({
  isOpen,
  onClose,
  branches,
  onSuccess,
}) => {
  const [branchId, setBranchId] = useState<string>('');
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new');
  
  // Existing customer search
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // New customer form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');

  // Booking fields
  const [rateType, setRateType] = useState<'daily' | 'hourly'>('daily');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [nights, setNights] = useState<number>(1);

  // Rooms available
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('450000');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [note, setNote] = useState('Khách nhận phòng trực tiếp tại quầy');
  const [autoCheckIn, setAutoCheckIn] = useState(true);

  // Sources
  const [sources, setSources] = useState<BookingSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);

      const inStr = today.toISOString().split('T')[0];
      const outStr = tomorrow.toISOString().split('T')[0];
      setCheckInDate(inStr);
      setCheckOutDate(outStr);
      setNights(1);

      const initialBranch = branches[0]?.id ? String(branches[0].id) : '1';
      setBranchId(initialBranch);

      fetchSources();
      fetchCustomers();
    }
  }, [isOpen, branches]);

  const handleNightsChange = (newNights: number) => {
    const validNights = Math.max(1, Math.min(90, newNights));
    setNights(validNights);
    if (checkInDate) {
      setCheckOutDate(addDaysToDate(checkInDate, validNights));
    }
  };

  const handleCheckInChange = (newCheckIn: string) => {
    setCheckInDate(newCheckIn);
    if (rateType === 'daily' && newCheckIn) {
      setCheckOutDate(addDaysToDate(newCheckIn, nights));
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    setCheckOutDate(newCheckOut);
    if (rateType === 'daily' && checkInDate && newCheckOut) {
      const d = getDiffDays(checkInDate, newCheckOut);
      setNights(d);
    }
  };

  const fetchSources = async () => {
    try {
      const res = await bookingsApi.getBookingSources();
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setSources(data);
      const walkIn = data.find((s: any) => s.source_type === 'walk_in' || s.name.includes('vãng lai')) || data[0];
      if (walkIn) setSelectedSourceId(String(walkIn.id));
    } catch {
      // Fallback
    }
  };

  const fetchCustomers = async (search = '') => {
    try {
      setLoadingCustomers(true);
      const res = await customersApi.getAll(search ? { search } : undefined);
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setCustomers(data);
      if (data.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(String(data[0].id));
      }
    } catch {
      // Fallback
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Fetch available rooms whenever branch or dates change
  useEffect(() => {
    if (branchId && checkInDate && checkOutDate) {
      fetchAvailableRooms();
    }
  }, [branchId, checkInDate, checkInTime, checkOutDate, checkOutTime]);

  const fetchAvailableRooms = async () => {
    try {
      setLoadingRooms(true);
      const checkInISO = `${checkInDate}T${checkInTime}:00+07:00`;
      const checkOutISO = `${checkOutDate}T${checkOutTime}:00+07:00`;

      const res = await roomsApi.getAvailableRooms({
        branch: branchId,
        check_in: checkInISO,
        check_out: checkOutISO,
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setAvailableRooms(data);
      if (data.length > 0) {
        setSelectedRoomId(String(data[0].id));
      } else {
        // Fallback to all branch rooms if none returned
        const allRes = await roomsApi.getRooms({
          branch: branchId,
          status: 'available',
        });
        const allData = Array.isArray(allRes.data) ? allRes.data : (allRes.data as any).results || [];
        setAvailableRooms(allData);
        if (allData.length > 0) setSelectedRoomId(String(allData[0].id));
        else setSelectedRoomId('');
      }
    } catch {
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (customerMode === 'new' && (!fullName.trim() || !phone.trim())) {
      setError('Vui lòng nhập Họ tên và Số điện thoại khách hàng.');
      return;
    }

    if (customerMode === 'existing' && !selectedCustomerId) {
      setError('Vui lòng chọn khách hàng trong danh sách.');
      return;
    }

    if (!selectedRoomId) {
      setError('Vui lòng chọn phòng trống để xếp khách.');
      return;
    }

    const checkInISO = `${checkInDate}T${checkInTime}:00+07:00`;
    const checkOutISO = `${checkOutDate}T${checkOutTime}:00+07:00`;

    if (new Date(checkOutISO) <= new Date(checkInISO)) {
      setError('Thời gian trả phòng phải sau thời gian nhận phòng.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        branch: Number(branchId),
        booking_source: Number(selectedSourceId || 1),
        note: note.trim(),
        details: [
          {
            room: Number(selectedRoomId),
            rate_type: rateType,
            check_in_planned: checkInISO,
            check_out_planned: checkOutISO,
            unit_price: Number(unitPrice) || 0,
            adults: adults,
            children: children,
          },
        ],
      };

      if (customerMode === 'existing') {
        payload.customer_id = Number(selectedCustomerId);
      } else {
        payload.customer_data = {
          full_name: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || null,
          id_card_number: idCardNumber.trim() || null,
        };
      }

      const res = await bookingsApi.createBooking(payload);
      const newBooking = res.data;

      // If receptionist selected autoCheckIn, trigger immediate check-in
      if (autoCheckIn && newBooking?.id) {
        try {
          await bookingsApi.checkIn(newBooking.id);
        } catch {
          // Non-blocking if check_in action fails
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Có lỗi xảy ra khi tạo đơn đặt phòng tại quầy.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Đơn Đặt Phòng / Nhận Phòng Tại Quầy (Walk-in)"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Branch Selection */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Cơ sở / Chi nhánh tiếp nhận: <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code}) — {b.province || b.address}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Toggle: New vs Existing */}
        <div className="rounded-2xl border border-stone-200 bg-[#FAF9F7] p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <User className="h-4 w-4 text-amber-600" />
              Thông tin Khách thuê
            </span>
            <div className="flex rounded-lg bg-stone-200/70 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setCustomerMode('new')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  customerMode === 'new'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Khách mới
              </button>
              <button
                type="button"
                onClick={() => setCustomerMode('existing')}
                className={`px-3 py-1 rounded-md font-medium transition-all ${
                  customerMode === 'existing'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Khách đã có
              </button>
            </div>
          </div>

          {customerMode === 'new' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Họ và tên khách: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Số điện thoại: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0987654321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Số CCCD / Hộ chiếu:
                </label>
                <input
                  type="text"
                  placeholder="VD: 001202008899"
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                  Email (nếu có):
                </label>
                <input
                  type="email"
                  placeholder="khachhang@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3.5 py-2 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Tìm khách theo tên hoặc SĐT..."
                  value={searchCustomer}
                  onChange={(e) => {
                    setSearchCustomer(e.target.value);
                    fetchCustomers(e.target.value);
                  }}
                  className="w-full rounded-xl border border-[#D8D2C5] bg-white pl-9 pr-9 py-2 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
                />
                {loadingCustomers && (
                  <Loader2 className="absolute right-3 top-2.5 h-3.5 w-3.5 animate-spin text-stone-400" />
                )}
              </div>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.phone} {c.id_card_number ? `(${c.id_card_number})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Room Selection & Time */}
        <div className="rounded-2xl border border-stone-200 bg-[#FAF9F7] p-4 space-y-3.5">
          <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5 border-b border-stone-200 pb-2">
            <BedDouble className="h-4 w-4 text-amber-600" />
            Thời gian & Chọn Phòng
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Ngày & Giờ nhận phòng:
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => handleCheckInChange(e.target.value)}
                  className="flex-1 rounded-xl border border-[#D8D2C5] bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
                <input
                  type="time"
                  required
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-24 rounded-xl border border-[#D8D2C5] bg-white px-2 py-2 text-xs text-stone-900 focus:outline-none text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Ngày & Giờ trả phòng:
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => handleCheckOutChange(e.target.value)}
                  className="flex-1 rounded-xl border border-[#D8D2C5] bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
                <input
                  type="time"
                  required
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-24 rounded-xl border border-[#D8D2C5] bg-white px-2 py-2 text-xs text-stone-900 focus:outline-none text-center"
                />
              </div>
            </div>
          </div>

          {/* Nights Adjuster (when daily rate) */}
          {rateType === 'daily' && (
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/50 p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-950">
                <Moon className="h-3.5 w-3.5 text-amber-700" />
                <span>Số đêm lưu trú:</span>
              </div>
              <div className="flex items-center gap-1 bg-white rounded-lg border border-amber-300 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleNightsChange(nights - 1)}
                  disabled={nights <= 1}
                  className="h-6 w-6 flex items-center justify-center rounded text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={nights}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) handleNightsChange(val);
                  }}
                  className="w-10 text-center text-xs font-bold text-amber-950 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-[11px] text-stone-500 font-medium pr-1">đêm</span>
                <button
                  type="button"
                  onClick={() => handleNightsChange(nights + 1)}
                  disabled={nights >= 90}
                  className="h-6 w-6 flex items-center justify-center rounded text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Phòng trống có thể xếp ({availableRooms.length}): <span className="text-rose-500">*</span>
              </label>
              {loadingRooms ? (
                <div className="py-2.5 text-xs text-stone-400 flex items-center">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Đang kiểm tra phòng trống...
                </div>
              ) : availableRooms.length > 0 ? (
                <select
                  required
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3.5 py-2 text-xs font-medium text-stone-900 focus:border-amber-500 focus:outline-none"
                >
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Phòng {r.room_number} — {r.room_type_name || 'Phòng'} (Tầng {r.floor || 1})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                  Không còn phòng trống trong khoảng thời gian này!
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Hình thức thuê:
              </label>
              <select
                value={rateType}
                onChange={(e) => setRateType(e.target.value as any)}
                className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none"
              >
                <option value="daily">Theo ngày</option>
                <option value="hourly">Theo giờ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Đơn giá phòng (VNĐ):
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3 py-2 text-xs font-mono font-bold text-amber-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Người lớn:</label>
              <input
                type="number"
                min="1"
                max="10"
                value={adults}
                onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3 py-2 text-xs text-center font-bold text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Trẻ em:</label>
              <input
                type="number"
                min="0"
                max="10"
                value={children}
                onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                className="w-full rounded-xl border border-[#D8D2C5] bg-white px-3 py-2 text-xs text-center font-bold text-stone-900 focus:outline-none"
              />
            </div>

            {rateType === 'daily' && (
              <div className="sm:col-span-3 flex items-center justify-between bg-amber-100/70 rounded-xl px-3.5 py-2.5 border border-amber-300/70">
                <span className="text-xs text-amber-950 font-semibold flex items-center gap-1.5">
                  <Moon className="h-3.5 w-3.5 text-amber-700" />
                  Tổng tiền phòng dự kiến ({nights} đêm):
                </span>
                <span className="font-mono text-sm font-bold text-amber-900">
                  {((Number(unitPrice) || 0) * nights).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Source & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nguồn khách:
            </label>
            <select
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Ghi chú nội bộ:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Khách lấy phòng ngay, cọc trước 500k..."
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Immediate Check-in Checkbox */}
        <label className="flex items-center gap-3 rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 cursor-pointer">
          <input
            type="checkbox"
            checked={autoCheckIn}
            onChange={(e) => setAutoCheckIn(e.target.checked)}
            className="h-4 w-4 rounded-sm border-emerald-400 text-emerald-600 focus:ring-emerald-500"
          />
          <div className="text-xs">
            <strong className="text-emerald-900 block font-bold">
              Check-in nhận phòng ngay lập tức
            </strong>
            <span className="text-emerald-700 font-light">
              Tự động đổi đơn sang "Đang ở" và phòng sang màu đỏ "occupied" sau khi tạo.
            </span>
          </div>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting || availableRooms.length === 0}
            className="flex items-center gap-2 rounded-xl bg-amber-800 px-6 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-900 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Tạo Đơn & Nhận Phòng</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
