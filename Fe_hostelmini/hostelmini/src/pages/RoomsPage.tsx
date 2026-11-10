import React, { useState, useEffect, useMemo } from 'react';
import {
  BedDouble,
  Plus,
  Search,
  Sparkles,
  Wrench,
  CheckCircle2,
  Users,
  Building2,
  Grid,
  List,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
  DollarSign,
  Maximize2,
  Lock,
  Check,
} from 'lucide-react';
import { roomsApi, branchesApi } from '../api';
import type { Room, RoomType, RoomPrice, Branch, RoomStatus } from '../types';
import { RoomModal, RoomTypeModal, QuickStatusModal } from '../components/modals';

type ActiveTab = 'rack' | 'table' | 'pricing';

export const RoomsPage: React.FC = () => {
  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roomPrices, setRoomPrices] = useState<RoomPrice[]>([]);

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('rack');

  // Filter states
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<RoomType | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetRoom, setStatusTargetRoom] = useState<Room | null>(null);

  // Load all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [branchesRes, typesRes, roomsRes, pricesRes] = await Promise.all([
        branchesApi.getAll(),
        roomsApi.getRoomTypes(),
        roomsApi.getRooms(),
        roomsApi.getRoomPrices(),
      ]);

      const branchesData = Array.isArray(branchesRes.data)
        ? branchesRes.data
        : (branchesRes.data as any).results || [];
      const typesData = Array.isArray(typesRes.data)
        ? typesRes.data
        : (typesRes.data as any).results || [];
      const roomsData = Array.isArray(roomsRes.data)
        ? roomsRes.data
        : (roomsRes.data as any).results || [];
      const pricesData = Array.isArray(pricesRes.data)
        ? pricesRes.data
        : (pricesRes.data as any).results || [];

      setBranches(branchesData);
      setRoomTypes(typesData);
      setRooms(roomsData);
      setRoomPrices(pricesData);

      // Default select first branch if present and not already selected
      if (branchesData.length > 0 && selectedBranchId === 'all') {
        setSelectedBranchId(String(branchesData[0].id));
      }
    } catch (err: any) {
      setError('Không thể kết nối đến máy chủ lấy dữ liệu phòng. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Show auto-dismiss message
  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Quick 1-click status change (e.g. from cleaning to available)
  const handleQuickStatusChange = async (roomId: number, newStatus: RoomStatus) => {
    try {
      setActionLoading(true);
      await roomsApi.patchRoom(roomId, { status: newStatus });
      setRooms((prev) =>
        prev.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
      );
      showNotification('Đã cập nhật trạng thái phòng thành công!');
    } catch (err: any) {
      alert('Không thể đổi trạng thái phòng. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedBranchId !== 'all' && String(r.branch) !== selectedBranchId) {
        return false;
      }
      if (selectedFloor !== 'all' && String(r.floor) !== selectedFloor) {
        return false;
      }
      if (selectedStatus !== 'all' && r.status !== selectedStatus) {
        return false;
      }
      if (selectedType !== 'all' && String(r.room_type) !== selectedType) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchNumber = r.room_number.toLowerCase().includes(term);
        const matchType = r.room_type_name?.toLowerCase().includes(term);
        if (!matchNumber && !matchType) return false;
      }
      return true;
    });
  }, [rooms, selectedBranchId, selectedFloor, selectedStatus, selectedType, searchTerm]);

  // Distinct floors for the selected branch
  const availableFloors = useMemo(() => {
    const relevantRooms =
      selectedBranchId === 'all'
        ? rooms
        : rooms.filter((r) => String(r.branch) === selectedBranchId);
    const floorsSet = new Set<number>();
    relevantRooms.forEach((r) => {
      if (r.floor !== null && r.floor !== undefined) {
        floorsSet.add(r.floor);
      }
    });
    return Array.from(floorsSet).sort((a, b) => a - b);
  }, [rooms, selectedBranchId]);

  // Group rooms by floor for Room Rack
  const roomsByFloor = useMemo(() => {
    const grouped: { [floor: number]: Room[] } = {};
    filteredRooms.forEach((r) => {
      const f = r.floor || 1;
      if (!grouped[f]) grouped[f] = [];
      grouped[f].push(r);
    });
    // Sort room numbers in floor
    Object.keys(grouped).forEach((f) => {
      grouped[Number(f)].sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }));
    });
    return grouped;
  }, [filteredRooms]);

  // Room statistics for current branch
  const stats = useMemo(() => {
    const branchRooms =
      selectedBranchId === 'all'
        ? rooms
        : rooms.filter((r) => String(r.branch) === selectedBranchId);

    const total = branchRooms.length;
    const available = branchRooms.filter((r) => r.status === 'available').length;
    const occupied = branchRooms.filter((r) => r.status === 'occupied').length;
    const cleaning = branchRooms.filter((r) => r.status === 'cleaning').length;
    const maintenance = branchRooms.filter((r) => r.status === 'maintenance' || r.status === 'blocked').length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;

    return { total, available, occupied, cleaning, maintenance, occupancyRate };
  }, [rooms, selectedBranchId]);

  // Handle open Room Modal
  const handleOpenAddRoomModal = () => {
    setEditingRoom(null);
    setIsRoomModalOpen(true);
  };

  const handleOpenEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setIsRoomModalOpen(true);
  };

  // Delete Room
  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phòng ${room.room_number} (${room.branch_name})?`)) {
      return;
    }
    try {
      await roomsApi.deleteRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
      showNotification(`Đã xóa phòng ${room.room_number}.`);
    } catch (err: any) {
      alert('Không thể xóa phòng đang có ràng buộc dữ liệu đơn đặt hoặc thanh toán.');
    }
  };

  // Room Type Form modal opener
  const handleOpenAddTypeModal = () => {
    setEditingType(null);
    setIsTypeModalOpen(true);
  };

  // Helper for Status Badge & Colors
  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case 'available':
        return {
          label: 'Trống sẵn sàng',
          badgeClass: 'bg-emerald-500/10 text-emerald-700 border-emerald-300/60',
          dotClass: 'bg-emerald-500',
          cardBorder: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/20',
          icon: CheckCircle2,
        };
      case 'occupied':
        return {
          label: 'Đang có khách',
          badgeClass: 'bg-rose-500/10 text-rose-700 border-rose-300/60',
          dotClass: 'bg-rose-500',
          cardBorder: 'border-rose-200 hover:border-rose-400 bg-rose-50/20',
          icon: Users,
        };
      case 'cleaning':
        return {
          label: 'Đang dọn dẹp',
          badgeClass: 'bg-amber-500/10 text-amber-800 border-amber-300/70',
          dotClass: 'bg-amber-500 animate-pulse',
          cardBorder: 'border-amber-300 hover:border-amber-500 bg-amber-50/30',
          icon: Sparkles,
        };
      case 'maintenance':
        return {
          label: 'Đang bảo trì',
          badgeClass: 'bg-stone-500/10 text-stone-700 border-stone-300',
          dotClass: 'bg-stone-500',
          cardBorder: 'border-stone-300 hover:border-stone-400 bg-stone-100/40',
          icon: Wrench,
        };
      case 'blocked':
        return {
          label: 'Tạm khóa',
          badgeClass: 'bg-slate-500/10 text-slate-700 border-slate-300',
          dotClass: 'bg-slate-500',
          cardBorder: 'border-slate-300 bg-slate-100/40',
          icon: Lock,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* SUCCESS NOTIFICATION TOAST */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-stone-950 px-5 py-3.5 text-xs font-semibold text-amber-200 shadow-2xl border border-amber-400/40 animate-slide-up">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
              Quản lý Phòng & Sơ đồ Trạng thái
            </h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300 uppercase tracking-widest">
              Room Rack
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
            Sơ đồ phòng trực quan thời gian thực, điều phối buồng phòng và thiết lập bảng giá chuỗi.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            title="Làm mới dữ liệu"
            className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Tải lại</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddTypeModal}
            className="flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-800 hover:bg-stone-50 transition-all cursor-pointer shadow-xs"
          >
            <BedDouble className="h-4 w-4 text-amber-700" />
            <span>Thêm loại phòng</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddRoomModal}
            className="flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4 text-amber-300" />
            <span>Thêm phòng mới</span>
          </button>
        </div>
      </div>

      {/* KPI STATUS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Rooms */}
        <div className="rounded-2xl bg-white p-4 border border-[#E3DDD2] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tổng số phòng</span>
            <Building2 className="h-4 w-4 text-stone-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">{stats.total}</span>
            <span className="text-[11px] text-stone-400 font-medium">phòng</span>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Phòng trống</span>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-950">{stats.available}</span>
            <span className="text-[11px] font-bold text-emerald-700">Sẵn sàng</span>
          </div>
        </div>

        {/* Occupied Rooms */}
        <div className="rounded-2xl bg-rose-50/60 p-4 border border-rose-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đang có khách</span>
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-rose-950">{stats.occupied}</span>
            <span className="text-[11px] font-bold text-rose-700">Đang ở</span>
          </div>
        </div>

        {/* Cleaning Rooms */}
        <div className="rounded-2xl bg-amber-50/80 p-4 border border-amber-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-900">
            <span className="text-[11px] font-bold uppercase tracking-wider">Đang dọn dẹp</span>
            <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-950">{stats.cleaning}</span>
            <span className="text-[11px] font-bold text-amber-800">Buồng phòng</span>
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-2xl bg-stone-100 p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-600">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bảo trì / Khóa</span>
            <Wrench className="h-3.5 w-3.5 text-stone-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-800">{stats.maintenance}</span>
            <span className="text-[11px] font-bold text-stone-500">Tạm dừng</span>
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="rounded-2xl bg-gradient-to-br from-[#1C1A18] to-[#121110] p-4 text-white shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">Tỷ lệ lấp đầy</span>
            <Maximize2 className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">
              {stats.occupancyRate}%
            </span>
            <span className="text-[11px] text-stone-400 font-medium">hiện tại</span>
          </div>
        </div>
      </div>

      {/* FILTER BAR & VIEW TOGGLE */}
      <div className="rounded-2xl bg-white p-4 border border-[#E3DDD2] shadow-xs space-y-4">
        {/* Top line of filters: Branch select & View Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          {/* Branch Picker */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-[#FAF4EA] px-3 py-2 rounded-xl border border-[#E7DAC4]">
              <Building2 className="h-4 w-4 text-amber-700" />
              <span>Cơ sở Chi nhánh:</span>
            </div>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 focus:outline-hidden focus:border-stone-900 cursor-pointer shadow-2xs"
            >
              <option value="all">Tất cả chi nhánh ({branches.length})</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center rounded-xl bg-[#F4F1EA] p-1 border border-stone-200 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('rack')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'rack'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Sơ đồ phòng (Rack)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Danh sách bảng</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pricing'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              <span>Bảng giá</span>
            </button>
          </div>
        </div>

        {/* Second line of filters: Floors, Status, Search (applicable for rack and table) */}
        {(activeTab === 'rack' || activeTab === 'table') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 h-4 w-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm số phòng (VD: 101, 204)..."
                className="w-full rounded-xl bg-[#F8F6F2] py-2 pl-9 pr-3 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden border border-stone-200 focus:border-stone-900"
              />
            </div>

            {/* Floor filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                Tầng:
              </span>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-stone-900 cursor-pointer"
              >
                <option value="all">Tất cả các tầng</option>
                {availableFloors.map((fl) => (
                  <option key={fl} value={fl}>
                    Tầng {fl}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                Trạng thái:
              </span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-stone-900 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">🟢 Trống sẵn sàng</option>
                <option value="occupied">🔴 Đang có khách</option>
                <option value="cleaning">🟡 Đang dọn dẹp</option>
                <option value="maintenance">⚪ Đang bảo trì</option>
                <option value="blocked">🔒 Khóa phòng</option>
              </select>
            </div>

            {/* Room Type filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider whitespace-nowrap">
                Loại phòng:
              </span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-stone-900 cursor-pointer truncate"
              >
                <option value="all">Tất cả loại phòng</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 text-center text-amber-900">
          <AlertCircle className="mx-auto h-7 w-7 text-amber-800 mb-2" />
          <p className="text-xs sm:text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="mt-3 text-xs font-bold text-stone-900 underline cursor-pointer"
          >
            Thử tải lại
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
            <span className="text-xs font-medium text-stone-500">Đang đồng bộ sơ đồ phòng...</span>
          </div>
        </div>
      ) : (
        <>
          {/* TAB 1: ROOM RACK (MATRIX VIEW BY FLOORS) */}
          {activeTab === 'rack' && (
            <div className="space-y-8">
              {Object.keys(roomsByFloor).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-12 text-center">
                  <BedDouble className="mx-auto h-12 w-12 text-stone-400 mb-3" />
                  <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy phòng nào</h3>
                  <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto font-light">
                    {searchTerm || selectedStatus !== 'all' || selectedFloor !== 'all'
                      ? 'Không có phòng nào phù hợp với bộ lọc hiện tại. Hãy thử chọn điều kiện lọc khác.'
                      : 'Cơ sở này chưa được cấu hình phòng. Hãy bấm "+ Thêm phòng mới" phía trên.'}
                  </p>
                </div>
              ) : (
                Object.keys(roomsByFloor)
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((floorNum) => {
                    const floorRooms = roomsByFloor[floorNum];
                    return (
                      <div key={floorNum} className="space-y-3.5">
                        {/* Floor Header */}
                        <div className="flex items-center justify-between border-b border-[#E3DDD2] pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FAF4EA] text-amber-900 font-serif font-bold text-xs border border-[#E7DAC4]">
                              {floorNum}
                            </span>
                            <h3 className="font-serif text-base font-bold text-stone-900">
                              Tầng {floorNum}
                            </h3>
                            <span className="text-xs font-semibold text-stone-400">
                              • {floorRooms.length} phòng
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 font-medium">
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              {floorRooms.filter((r) => r.status === 'available').length} trống
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-rose-500" />
                              {floorRooms.filter((r) => r.status === 'occupied').length} ở
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-amber-500" />
                              {floorRooms.filter((r) => r.status === 'cleaning').length} dọn
                            </span>
                          </div>
                        </div>

                        {/* Room Cards Grid for this Floor */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {floorRooms.map((room) => {
                            const badge = getStatusBadge(room.status);
                            const StatusIcon = badge.icon;

                            return (
                              <div
                                key={room.id}
                                className={`rounded-2xl border ${badge.cardBorder} p-4.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group relative bg-white`}
                              >
                                {/* Card Top: Room Number & Status Badge */}
                                <div>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-baseline gap-2">
                                      <span className="font-serif text-2xl font-bold tracking-tight text-stone-900 group-hover:text-amber-900 transition-colors">
                                        P.{room.room_number}
                                      </span>
                                      <span className="text-[10px] font-semibold text-stone-400">
                                        Tầng {room.floor || 1}
                                      </span>
                                    </div>

                                    {/* Status Pill */}
                                    <span
                                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${badge.badgeClass}`}
                                    >
                                      <StatusIcon className="h-3 w-3" />
                                      <span>{badge.label}</span>
                                    </span>
                                  </div>

                                  {/* Room Type Info */}
                                  <div className="space-y-1 mt-1 text-xs">
                                    <div className="font-semibold text-stone-800 line-clamp-1">
                                      {room.room_type_name || 'Phòng Tiêu Chuẩn'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                                      <span className="flex items-center gap-1">
                                        <Users className="h-3 w-3 text-amber-700" />
                                        Tối đa {room.max_occupancy || 2} khách
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Bottom Actions */}
                                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                                  {/* Quick Status Action Button */}
                                  {room.status === 'cleaning' ? (
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      onClick={() => handleQuickStatusChange(room.id, 'available')}
                                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 border border-amber-400/50 py-1.5 px-2 text-[11px] font-bold transition-all cursor-pointer"
                                      title="Bấm để xác nhận buồng phòng đã dọn xong"
                                    >
                                      <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                                      <span>Đã dọn xong</span>
                                    </button>
                                  ) : room.status === 'available' ? (
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setStatusTargetRoom(room);
                                          setIsStatusModalOpen(true);
                                        }}
                                        className="flex-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-2 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                                      >
                                        Đổi trạng thái
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 flex-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setStatusTargetRoom(room);
                                          setIsStatusModalOpen(true);
                                        }}
                                        className="flex-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 py-1.5 px-2 text-[11px] font-semibold transition-colors cursor-pointer text-center"
                                      >
                                        Đổi trạng thái
                                      </button>
                                    </div>
                                  )}

                                  {/* Edit & Delete Mini Buttons */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditRoomModal(room)}
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                                      title="Sửa phòng"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteRoom(room)}
                                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                      title="Xóa phòng"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}

          {/* TAB 2: DETAILED TABLE VIEW */}
          {activeTab === 'table' && (
            <div className="overflow-hidden rounded-3xl border border-[#E3DDD2] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#FAF8F5] border-b border-[#EDE7DD] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <tr>
                      <th className="px-6 py-4">Số phòng</th>
                      <th className="px-6 py-4">Chi nhánh & Tầng</th>
                      <th className="px-6 py-4">Loại phòng</th>
                      <th className="px-6 py-4">Sức chứa</th>
                      <th className="px-6 py-4">Trạng thái</th>
                      <th className="px-6 py-4">Hoạt động</th>
                      <th className="px-6 py-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE4] text-stone-700">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-stone-400 italic">
                          Không có phòng nào thỏa mãn điều kiện tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map((r) => {
                        const badge = getStatusBadge(r.status);
                        return (
                          <tr key={r.id} className="hover:bg-[#FCFAF7] transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-serif font-bold text-base text-stone-900">
                                P.{r.room_number}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-stone-800">{r.branch_name}</div>
                              <div className="text-[11px] text-stone-400">Tầng {r.floor || 1}</div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-stone-800">
                              {r.room_type_name || 'Standard'}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1 text-xs text-stone-600 font-medium">
                                <Users className="h-3 w-3 text-amber-700" />
                                {r.max_occupancy || 2} khách
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold border ${badge.badgeClass}`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${badge.dotClass}`} />
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {r.is_active ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  Hoạt động
                                </span>
                              ) : (
                                <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                                  Tạm ẩn
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {r.status === 'cleaning' && (
                                  <button
                                    type="button"
                                    onClick={() => handleQuickStatusChange(r.id, 'available')}
                                    className="rounded-xl border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
                                    title="Dọn xong"
                                  >
                                    Đã dọn xong
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setStatusTargetRoom(r);
                                    setIsStatusModalOpen(true);
                                  }}
                                  className="rounded-xl border border-stone-200 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                                >
                                  Đổi trạng thái
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditRoomModal(r)}
                                  className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 transition-colors"
                                  title="Sửa phòng"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRoom(r)}
                                  className="rounded-xl border border-stone-200 p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                  title="Xóa phòng"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROOM PRICING MANAGEMENT */}
          {activeTab === 'pricing' && (
            <div className="rounded-3xl border border-[#E3DDD2] bg-white p-6 shadow-xs space-y-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-900">
                  Bảng giá Niêm Yết Theo Loại Phòng
                </h3>
                <p className="text-xs text-stone-500 font-light mt-0.5">
                  Đơn giá theo giờ, theo ngày được áp dụng tự động khi khách đặt phòng hoặc nhận phòng.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-[#FAF8F5] border-b border-[#EDE7DD] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <tr>
                      <th className="px-6 py-4">Chi nhánh</th>
                      <th className="px-6 py-4">Loại phòng</th>
                      <th className="px-6 py-4">Hình thức thuê</th>
                      <th className="px-6 py-4">Mùa giá</th>
                      <th className="px-6 py-4">Đơn giá niêm yết</th>
                      <th className="px-6 py-4">Phụ trội / giờ</th>
                      <th className="px-6 py-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0ECE4] text-stone-700">
                    {roomPrices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-stone-400 italic">
                          Chưa có bảng giá được cấu hình.
                        </td>
                      </tr>
                    ) : (
                      roomPrices.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FCFAF7]">
                          <td className="px-6 py-4 font-bold text-stone-900">
                            {p.branch_code} - {p.branch_name}
                          </td>
                          <td className="px-6 py-4 font-semibold text-stone-800">
                            {p.room_type_name}
                          </td>
                          <td className="px-6 py-4">
                            <span className="capitalize font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {p.rate_type === 'daily'
                                ? 'Theo ngày (đêm)'
                                : p.rate_type === 'hourly'
                                ? 'Theo giờ'
                                : 'Theo tháng'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-stone-500">
                            {p.season_name || 'Giá mặc định'}
                          </td>
                          <td className="px-6 py-4 font-serif font-bold text-base text-amber-900">
                            {Number(p.price).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="px-6 py-4 text-stone-500">
                            {p.extra_hour_price
                              ? `${Number(p.extra_hour_price).toLocaleString('vi-VN')} đ`
                              : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Áp dụng
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: THÊM / SỬA PHÒNG (TẤT CẢ TRONG 1 MODAL: THÔNG TIN, MÔ TẢ & BỘ ẢNH) */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        editingRoom={editingRoom}
        branches={branches}
        roomTypes={roomTypes}
        defaultBranchId={selectedBranchId}
        onSuccess={(_room, isNew) => {
          showNotification(isNew ? 'Đã tạo phòng mới thành công.' : 'Đã cập nhật phòng thành công.');
          fetchData();
        }}
      />

      {/* MODAL 2: THÊM / SỬA LOẠI PHÒNG */}
      <RoomTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        editingType={editingType}
        onSuccess={(type, isNew) => {
          showNotification(isNew ? `Đã tạo hạng phòng ${type.name} mới.` : `Đã cập nhật hạng phòng ${type.name}.`);
          fetchData();
        }}
      />

      {/* MODAL 3: ĐỔI TRẠNG THÁI PHÒNG NHANH */}
      <QuickStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        room={statusTargetRoom}
        onSelectStatus={handleQuickStatusChange}
      />
    </div>
  );
};
