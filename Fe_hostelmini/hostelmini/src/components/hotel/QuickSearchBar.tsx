import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Users, ArrowRight } from 'lucide-react';

export interface QuickSearchParams {
  branchId: string;
  checkIn: string;
  checkOut: string;
  guests: string;
}

export interface QuickBranchOption {
  id: string;
  label: string;
}

export interface QuickSearchBarProps {
  onSearch?: (params: QuickSearchParams) => void;
  initialParams?: Partial<QuickSearchParams>;
  branches?: QuickBranchOption[];
  className?: string;
  buttonLabel?: string;
  compact?: boolean;
}

const DEFAULT_BRANCHES: QuickBranchOption[] = [
  { id: 'all', label: 'Tất cả chi nhánh' },
  { id: '1', label: 'AH Boutique Hoàn Kiếm (Hà Nội)' },
  { id: '2', label: 'AH Signature Sài Gòn (Quận 1)' },
  { id: '3', label: 'AH Beachfront Resort (Đà Nẵng)' },
];

export const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  onSearch,
  initialParams,
  branches = DEFAULT_BRANCHES,
  className = '',
  buttonLabel = 'Tìm Kiếm',
  compact = false,
}) => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [branchId, setBranchId] = useState(initialParams?.branchId || 'all');
  const [checkIn, setCheckIn] = useState(initialParams?.checkIn || '');
  const [checkOut, setCheckOut] = useState(initialParams?.checkOut || '');
  const [guests, setGuests] = useState(initialParams?.guests || 'all');

  const checkInRef = useRef<HTMLInputElement>(null);
  const checkOutRef = useRef<HTMLInputElement>(null);
  const branchRef = useRef<HTMLSelectElement>(null);
  const guestsRef = useRef<HTMLSelectElement>(null);

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

  const openSelectPicker = (select: HTMLSelectElement | null) => {
    if (!select) return;
    try {
      if (typeof select.showPicker === 'function') {
        select.showPicker();
      } else {
        select.focus();
      }
    } catch {
      select.focus();
    }
  };

  useEffect(() => {
    if (initialParams?.branchId !== undefined) setBranchId(initialParams.branchId);
    if (initialParams?.checkIn !== undefined) setCheckIn(initialParams.checkIn);
    if (initialParams?.checkOut !== undefined) setCheckOut(initialParams.checkOut);
    if (initialParams?.guests !== undefined) setGuests(initialParams.guests);
  }, [initialParams?.branchId, initialParams?.checkIn, initialParams?.checkOut, initialParams?.guests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const searchData: QuickSearchParams = {
      branchId,
      checkIn,
      checkOut,
      guests,
    };

    if (onSearch) {
      onSearch(searchData);
    } else {
      // Default: navigate to public rooms page with search params
      const queryParams = new URLSearchParams();
      if (branchId !== 'all') queryParams.set('branch', branchId);
      if (checkIn) queryParams.set('checkIn', checkIn);
      if (checkOut) queryParams.set('checkOut', checkOut);
      if (guests !== 'all') queryParams.set('guests', guests);
      navigate(`/rooms?${queryParams.toString()}`);
    }
  };

  const handleCheckInChange = (val: string) => {
    setCheckIn(val);
    if (checkOut && val && checkOut < val) {
      setCheckOut('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white/95 backdrop-blur-xl p-3 sm:p-4 lg:p-4 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl border border-stone-200/90 text-stone-900 transition-shadow duration-300 ${
        compact
          ? 'flex flex-col gap-2.5'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row lg:items-stretch gap-2.5 sm:gap-3'
      } text-left ${className}`}
    >
      {/* 1. Destination / Branch */}
      <div
        onClick={(e) => {
          if (e.target !== branchRef.current) openSelectPicker(branchRef.current);
        }}
        className={`flex flex-col justify-center px-3.5 py-2 rounded-xl sm:rounded-2xl bg-stone-50/90 hover:bg-stone-100/90 border border-stone-200/80 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all duration-200 min-w-0 cursor-pointer ${
          compact ? 'w-full' : 'sm:col-span-2 lg:flex-[1.3]'
        }`}
      >
        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pointer-events-none select-none mb-0.5">
          <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">Điểm đến / Chi nhánh</span>
        </label>
        <select
          ref={branchRef}
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-900 outline-none cursor-pointer py-0.5 truncate"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id} className="text-stone-900 bg-white">
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Check-in Date */}
      <div
        onClick={() => openInputPicker(checkInRef.current)}
        className={`flex flex-col justify-center px-3.5 py-2 rounded-xl sm:rounded-2xl bg-stone-50/90 hover:bg-stone-100/90 border border-stone-200/80 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all duration-200 min-w-0 cursor-pointer ${
          compact ? 'w-full' : 'sm:col-span-1 lg:flex-1'
        }`}
      >
        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pointer-events-none select-none mb-0.5">
          <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">Ngày nhận phòng</span>
        </label>
        <input
          ref={checkInRef}
          type="date"
          min={today}
          value={checkIn}
          onClick={(e) => {
            e.stopPropagation();
            openInputPicker(checkInRef.current);
          }}
          onChange={(e) => handleCheckInChange(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-900 outline-none py-0.5 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
        />
      </div>

      {/* 3. Check-out Date */}
      <div
        onClick={() => openInputPicker(checkOutRef.current)}
        className={`flex flex-col justify-center px-3.5 py-2 rounded-xl sm:rounded-2xl bg-stone-50/90 hover:bg-stone-100/90 border border-stone-200/80 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all duration-200 min-w-0 cursor-pointer ${
          compact ? 'w-full' : 'sm:col-span-1 lg:flex-1'
        }`}
      >
        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pointer-events-none select-none mb-0.5">
          <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">Ngày trả phòng</span>
        </label>
        <input
          ref={checkOutRef}
          type="date"
          min={checkIn || today}
          value={checkOut}
          onClick={(e) => {
            e.stopPropagation();
            openInputPicker(checkOutRef.current);
          }}
          onChange={(e) => setCheckOut(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-900 outline-none py-0.5 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
        />
      </div>

      {/* 4. Guests */}
      <div
        onClick={(e) => {
          if (e.target !== guestsRef.current) openSelectPicker(guestsRef.current);
        }}
        className={`flex flex-col justify-center px-3.5 py-2 rounded-xl sm:rounded-2xl bg-stone-50/90 hover:bg-stone-100/90 border border-stone-200/80 hover:border-amber-400 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:bg-white transition-all duration-200 min-w-0 cursor-pointer ${
          compact ? 'w-full' : 'sm:col-span-1 lg:flex-1'
        }`}
      >
        <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 pointer-events-none select-none mb-0.5">
          <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate">Số lượng khách</span>
        </label>
        <select
          ref={guestsRef}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-stone-900 outline-none cursor-pointer py-0.5 truncate"
        >
          <option value="all" className="text-stone-900 bg-white">Mọi sức chứa</option>
          <option value="1" className="text-stone-900 bg-white">1 Khách (Solo Pod)</option>
          <option value="2" className="text-stone-900 bg-white">2 Khách (Phòng Đôi)</option>
          <option value="4" className="text-stone-900 bg-white">4+ Khách (Penthouse / Suite)</option>
        </select>
      </div>

      {/* 5. Submit Button */}
      <button
        type="submit"
        className={`min-h-[50px] sm:min-h-[54px] px-6 py-2.5 rounded-xl sm:rounded-2xl bg-stone-950 text-amber-300 hover:bg-amber-400 hover:text-stone-950 active:scale-[0.98] font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 shadow-md hover:shadow-xl group shrink-0 cursor-pointer ${
          compact
            ? 'w-full mt-1'
            : 'w-full sm:col-span-1 lg:w-auto lg:px-7'
        }`}
      >
        <span className="whitespace-nowrap">{buttonLabel}</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
      </button>
    </form>
  );
};
