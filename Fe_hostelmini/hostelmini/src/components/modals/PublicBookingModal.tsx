import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Clock,
  AlertCircle,
  Loader2,
  Check,
  Moon,
  Plus,
  Minus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../common/Modal';
import { roomsApi, bookingsApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import type { RoomType, Branch, RoomPrice, Room } from '../../types';

export interface PublicBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoomType: RoomType | null;
  branches: Branch[];
  roomPrices: RoomPrice[];
  allRooms?: Room[];
  initialBranchId?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
}

// Helper to add days to a YYYY-MM-DD date string safely without timezone offset issues
const addDaysToDate = (dateStr: string, days: number): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const ny = date.getFullYear();
  const nm = String(date.getMonth() + 1).padStart(2, '0');
  const nd = String(date.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
};

const getDiffDays = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 1;
  const [y1, m1, d1] = startStr.split('-').map(Number);
  const [y2, m2, d2] = endStr.split('-').map(Number);
  const dt1 = new Date(y1, m1 - 1, d1);
  const dt2 = new Date(y2, m2 - 1, d2);
  const diff = Math.round((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
};

export const PublicBookingModal: React.FC<PublicBookingModalProps> = ({
  isOpen,
  onClose,
  selectedRoomType,
  branches,
  roomPrices,
  allRooms,
  initialBranchId,
  initialCheckIn,
  initialCheckOut,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const checkInInputRef = useRef<HTMLInputElement>(null);
  const checkOutInputRef = useRef<HTMLInputElement>(null);

  const openInputPicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  };

  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [nights, setNights] = useState<number>(2);

  const [internalRooms, setInternalRooms] = useState<Room[]>(allRooms || []);

  useEffect(() => {
    if (allRooms && allRooms.length > 0) {
      setInternalRooms(allRooms);
      return;
    }
    roomsApi
      .getRooms({ no_page: 'true', page_size: 'all' } as any)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
        setInternalRooms(data);
      })
      .catch(() => {});
  }, [allRooms]);

  const [form, setForm] = useState({
    branchId: '',
    fullName: '',
    phone: '',
    email: '',
    checkIn: '',
    checkInTime: '14:00',
    checkOut: '',
    checkOutTime: '12:00',
    adults: 2,
    children: 0,
    note: '',
  });

  useEffect(() => {
    if (isOpen) {
      setBookingSuccess(null);
      setError('');

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultCheckIn = initialCheckIn || tomorrow.toISOString().split('T')[0];

      let initialNights = 2;
      let defaultCheckOut = '';
      if (initialCheckIn && initialCheckOut) {
        initialNights = getDiffDays(initialCheckIn, initialCheckOut);
        defaultCheckOut = initialCheckOut;
      } else {
        defaultCheckOut = addDaysToDate(defaultCheckIn, initialNights);
      }

      // Smart branch selection: pick initialBranchId or the first branch with rooms for this type
      let chosenBranchId = initialBranchId && initialBranchId !== 'all' ? initialBranchId : '';
      if (!chosenBranchId && selectedRoomType && internalRooms.length > 0) {
        const supportingBranch = branches.find((b) =>
          internalRooms.some(
            (r) => String(r.branch) === String(b.id) && r.room_type === selectedRoomType.id && r.is_active
          )
        );
        if (supportingBranch) {
          chosenBranchId = String(supportingBranch.id);
        }
      }
      if (!chosenBranchId && branches[0]?.id) {
        chosenBranchId = String(branches[0].id);
      }

      setNights(initialNights);
      setForm({
        branchId: chosenBranchId,
        fullName: user?.employee?.full_name || user?.first_name || user?.username || '',
        phone: user?.employee?.phone || '',
        email: user?.email || '',
        checkIn: defaultCheckIn,
        checkInTime: '14:00',
        checkOut: defaultCheckOut,
        checkOutTime: '12:00',
        adults: selectedRoomType ? Math.min(2, selectedRoomType.max_occupancy) : 2,
        children: 0,
        note: '',
      });
    }
  }, [isOpen, selectedRoomType, branches, internalRooms, initialBranchId, initialCheckIn, initialCheckOut, user]);

  // Check if currently selected branch actually has rooms of this room type
  const branchHasRoomType = useMemo(() => {
    if (!selectedRoomType || !form.branchId || internalRooms.length === 0) return true;
    return internalRooms.some(
      (r) => String(r.branch) === form.branchId && r.room_type === selectedRoomType.id && r.is_active
    );
  }, [internalRooms, selectedRoomType, form.branchId]);

  // Handler when user edits number of nights directly (via +/- buttons, quick pills, or input)
  const handleNightsChange = (newNights: number) => {
    const validNights = Math.max(1, Math.min(90, newNights));
    setNights(validNights);
    if (form.checkIn) {
      const newCheckOut = addDaysToDate(form.checkIn, validNights);
      setForm((prev) => ({ ...prev, checkOut: newCheckOut }));
    }
  };

  // Handler when user edits checkIn date
  const handleCheckInChange = (newCheckIn: string) => {
    const newCheckOut = addDaysToDate(newCheckIn, nights);
    setForm((prev) => ({ ...prev, checkIn: newCheckIn, checkOut: newCheckOut }));
  };

  // Handler when user edits checkOut date directly
  const handleCheckOutChange = (newCheckOut: string) => {
    const calculatedNights = getDiffDays(form.checkIn, newCheckOut);
    setNights(calculatedNights);
    setForm((prev) => ({ ...prev, checkOut: newCheckOut }));
  };

  // Price helper
  const unitPrice = useMemo(() => {
    if (!selectedRoomType) return 0;
    const found = roomPrices.find((p) => {
      const matchType = p.room_type === selectedRoomType.id;
      const matchBranch = form.branchId ? String(p.branch) === form.branchId : true;
      return matchType && matchBranch && p.rate_type === 'daily';
    });

    if (found) return Number(found.price);

    switch (selectedRoomType.id) {
      case 1:
        return 750000;
      case 2:
        return 1350000;
      case 3:
        return 320000;
      case 4:
        return 2850000;
      default:
        return 850000;
    }
  }, [selectedRoomType, form.branchId, roomPrices]);

  const totalPrice = unitPrice * nights;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!branchHasRoomType) {
      setError('Hạng phòng này vẫn chưa có ở cơ sở đó. Quý khách vui lòng chọn cơ sở khác.');
      return;
    }

    if (!form.fullName.trim() || !form.phone.trim()) {
      setError('Vui lòng điền đầy đủ Họ và tên và Số điện thoại.');
      return;
    }

    if (!form.checkIn || !form.checkOut) {
      setError('Vui lòng chọn ngày nhận phòng và trả phòng.');
      return;
    }

    const checkInDateTime = new Date(`${form.checkIn}T${form.checkInTime || '14:00'}:00`);
    const checkOutDateTime = new Date(`${form.checkOut}T${form.checkOutTime || '12:00'}:00`);
    if (checkOutDateTime <= checkInDateTime) {
      setError('Thời gian trả phòng phải sau thời gian nhận phòng.');
      return;
    }

    try {
      setSubmitting(true);
      const branchId = parseInt(form.branchId || (branches[0]?.id ? String(branches[0].id) : '1'), 10);
      const checkInISO = `${form.checkIn}T${form.checkInTime || '14:00'}:00+07:00`;
      const checkOutISO = `${form.checkOut}T${form.checkOutTime || '12:00'}:00+07:00`;

      // Find available room
      let targetRoomId: number | null = null;
      try {
        const availRes = await roomsApi.getAvailableRooms({
          branch: branchId,
          check_in: checkInISO,
          check_out: checkOutISO,
          room_type: selectedRoomType?.id,
        });
        const availRooms = Array.isArray(availRes.data)
          ? availRes.data
          : (availRes.data as any)?.results || [];
        if (availRooms.length > 0) {
          targetRoomId = availRooms[0].id;
        }
      } catch (err) {
        // Fallback
      }

      if (!targetRoomId) {
        const allRoomsRes = await roomsApi.getRooms({
          branch: branchId,
          room_type: selectedRoomType?.id,
        });
        const allRoomsInBranch = Array.isArray(allRoomsRes.data) ? allRoomsRes.data : (allRoomsRes.data as any).results || [];
        if (allRoomsInBranch.length === 0) {
          setError('Hạng phòng này vẫn chưa có ở cơ sở đó. Quý khách vui lòng chọn cơ sở khác.');
          setSubmitting(false);
          return;
        }
        targetRoomId = allRoomsInBranch[0].id;
      }

      if (!targetRoomId) {
        setError('Rất tiếc! Hiện không còn phòng trống cho hạng phòng này tại cơ sở đã chọn. Vui lòng chọn ngày khác hoặc chi nhánh khác.');
        setSubmitting(false);
        return;
      }

      // Booking source
      const sourcesRes = await bookingsApi.getBookingSources();
      const sources = Array.isArray(sourcesRes.data) ? sourcesRes.data : (sourcesRes.data as any).results || [];
      const webSource = sources.find((s: any) => s.name?.includes('Website')) || sources[0] || { id: 1 };

      const payload = {
        branch: branchId,
        booking_source: webSource.id,
        customer_data: {
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
        },
        note: form.note.trim() || 'Khách đặt trực tuyến qua Website',
        details: [
          {
            room: targetRoomId,
            rate_type: 'daily',
            check_in_planned: checkInISO,
            check_out_planned: checkOutISO,
            unit_price: unitPrice,
            adults: form.adults,
            children: form.children,
          },
        ],
      };

      const res = await bookingsApi.createBooking(payload);
      setBookingSuccess(res.data);
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Có lỗi xảy ra khi tạo đơn đặt phòng. Vui lòng thử lại hoặc gọi hotline 1900 6886.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={bookingSuccess ? 'Xác Nhận Đặt Phòng Thành Công' : `Đặt Phòng: ${selectedRoomType?.name || 'AH Hotel'}`}
    >
      {bookingSuccess ? (
        <div className="space-y-6 text-center py-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300">
            <Check className="h-8 w-8" />
          </div>

          <div>
            <h3 className="font-serif text-2xl font-bold text-stone-900">
              Chúc Mừng Bạn Đã Đặt Phòng Thành Công!
            </h3>
            <p className="text-xs text-stone-500 font-light mt-1">
              Yêu cầu giữ phòng của quý khách đã được hệ thống ghi nhận.
            </p>
          </div>

          <div className="rounded-2xl bg-[#FAF8F5] p-5 border border-amber-300/80 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-xs text-stone-500 font-medium">Mã đặt phòng (Booking Code):</span>
              <span className="font-mono text-base font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-lg border border-amber-300">
                {bookingSuccess.booking_code}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Khách hàng:</span>
              <strong className="text-stone-900">{bookingSuccess.customer?.full_name}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Số điện thoại:</span>
              <strong className="text-stone-900">{bookingSuccess.customer?.phone}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Cơ sở chi nhánh:</span>
              <strong className="text-stone-900">{bookingSuccess.branch_name}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Thời gian lưu trú:</span>
              <strong className="text-stone-900">
                {form.checkIn} ({form.checkInTime}) → {form.checkOut} ({form.checkOutTime}) • {nights} đêm
              </strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-500">Trạng thái:</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {bookingSuccess.status === 'confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận'}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 font-light">
            Lễ tân AH Hotel sẽ sớm liên hệ qua số điện thoại để hỗ trợ thủ tục nhận phòng chu đáo nhất.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/profile');
              }}
              className="w-full py-3 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <span>Vào Trang Cá Nhân Xem Phòng</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-stone-950 text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-stone-800 transition-all cursor-pointer shadow-md"
            >
              Hoàn Tất & Đóng
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Chi nhánh nhận phòng <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={form.branchId}
              onChange={(e) => setForm({ ...form, branchId: e.target.value })}
              className={`w-full rounded-xl border px-3.5 py-2 text-sm bg-white focus:outline-hidden ${
                !branchHasRoomType
                  ? 'border-amber-400 bg-amber-50/30 text-amber-950 focus:border-amber-600'
                  : 'border-stone-300 focus:border-stone-900'
              }`}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.address}, {b.province || b.code})
                </option>
              ))}
            </select>

            {!branchHasRoomType && (
              <div className="mt-2.5 flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-300 p-3 text-xs text-amber-950 shadow-2xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <strong className="block font-bold">Hạng phòng này vẫn chưa có ở cơ sở đó</strong>
                  <span className="font-light text-stone-600">
                    Cơ sở "{branches.find((b) => String(b.id) === form.branchId)?.name || 'này'}" hiện tại chưa có phòng thuộc hạng "{selectedRoomType?.name}". Quý khách vui lòng chọn chi nhánh khác ở trên.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Họ và tên của bạn <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="VD: Nguyễn Văn Nam"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Số điện thoại liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0912 345 678"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Email nhận xác nhận (tùy chọn)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="nam.nguyen@gmail.com"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Check-in Group: Date & Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 cursor-pointer" onClick={() => openInputPicker(checkInInputRef.current)}>
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    Nhận phòng (Check-in)
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    {form.checkInTime || '14:00'}
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    ref={checkInInputRef}
                    type="date"
                    required
                    value={form.checkIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openInputPicker(checkInInputRef.current);
                    }}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden cursor-pointer bg-white"
                  />
                  <input
                    type="time"
                    required
                    value={form.checkInTime}
                    onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
                    title="Giờ nhận phòng"
                    className="w-24 rounded-xl border border-stone-300 px-2 py-2 text-xs font-bold text-stone-900 focus:border-stone-900 focus:outline-hidden text-center bg-white cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-stone-400 font-light mt-1 block">
                  Giờ nhận phòng tiêu chuẩn từ 14:00
                </span>
              </div>

              {/* Check-out Group: Date & Time */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 cursor-pointer" onClick={() => openInputPicker(checkOutInputRef.current)}>
                    <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    Trả phòng (Check-out)
                  </span>
                  <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-700" />
                    {form.checkOutTime || '12:00'}
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    ref={checkOutInputRef}
                    type="date"
                    required
                    value={form.checkOut}
                    onClick={(e) => {
                      e.stopPropagation();
                      openInputPicker(checkOutInputRef.current);
                    }}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden cursor-pointer bg-white"
                  />
                  <input
                    type="time"
                    required
                    value={form.checkOutTime}
                    onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
                    title="Giờ trả phòng"
                    className="w-24 rounded-xl border border-stone-300 px-2 py-2 text-xs font-bold text-stone-900 focus:border-stone-900 focus:outline-hidden text-center bg-white cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-stone-400 font-light mt-1 block">
                  Giờ trả phòng tiêu chuẩn trước 12:00 trưa
                </span>
              </div>
            </div>

            {/* Custom Số đêm lưu trú Controller */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-50/90 to-orange-50/60 border border-amber-200/90 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-900 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    Số đêm lưu trú:
                    <span className="text-amber-900 font-extrabold bg-amber-200/70 px-2 py-0.5 rounded-full text-[11px]">
                      {nights} đêm
                    </span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-light">
                    Chỉnh số đêm để tự động cập nhật ngày trả phòng
                  </span>
                </div>
              </div>

              {/* Stepper + Input */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <div className="flex items-center rounded-xl border border-stone-300 bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleNightsChange(nights - 1)}
                    disabled={nights <= 1}
                    className="p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Giảm 1 đêm"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={nights}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) handleNightsChange(val);
                    }}
                    className="w-12 text-center font-bold text-xs text-stone-900 py-1.5 focus:outline-hidden [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-xs font-medium text-stone-500 pr-2 select-none">đêm</span>
                  <button
                    type="button"
                    onClick={() => handleNightsChange(nights + 1)}
                    disabled={nights >= 90}
                    className="p-2 text-stone-600 hover:bg-stone-100 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Tăng 1 đêm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Ghi chú hoặc yêu cầu đặc biệt
            </label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="VD: Cần phòng yên tĩnh, nhận phòng khoảng 14h..."
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>

          {selectedRoomType && (
            <div className="rounded-2xl bg-[#FAF8F5] p-4 border border-stone-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Hạng phòng:</span>
                <strong className="text-stone-900">{selectedRoomType.name}</strong>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Thời gian lưu trú:</span>
                <span className="font-semibold text-stone-800">{nights} đêm</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Đơn giá niêm yết:</span>
                <span>{unitPrice.toLocaleString('vi-VN')} đ / đêm</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
                <span className="font-bold text-stone-900">Tổng tiền dự kiến:</span>
                <strong className="font-serif text-lg font-bold text-amber-900">
                  {totalPrice.toLocaleString('vi-VN')} đ
                </strong>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EDE7DD]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !branchHasRoomType}
              className="flex items-center gap-2 rounded-xl bg-stone-950 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-400 hover:text-stone-950 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin text-amber-300" />}
              <span>{!branchHasRoomType ? 'Chưa Có Phòng Tại Cơ Sở Này' : 'Xác Nhận Giữ Phòng'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
