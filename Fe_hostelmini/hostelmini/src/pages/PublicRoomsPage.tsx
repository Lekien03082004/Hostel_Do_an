import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bed,
  Loader2,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { QuickSearchBar, RoomCard } from '../components/hotel';
import type { QuickSearchParams, QuickBranchOption, RoomItem } from '../components/hotel';
import { roomsApi, branchesApi } from '../api';
import type { RoomType, Room, Branch, RoomPrice } from '../types';
import { PublicBookingModal, RoomDetailModal } from '../components/modals';
import { Modal } from '../components/common/Modal';


// High-quality imagery mapping for room types
const ROOM_IMAGES: { [name: string]: string } = {
  'Standard Cozy Room':
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
  'Deluxe Heritage Suite':
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
  'Luxury Capsule Pod':
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1000&q=80',
  'Family Garden Penthouse':
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
};

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80';

export const PublicRoomsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Catalog Master Lookup State (all room types, branches, prices, all rooms)
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roomPrices, setRoomPrices] = useState<RoomPrice[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Notice modal state when room type not available at branch
  const [unavailableNotice, setUnavailableNotice] = useState<{
    roomTypeName: string;
    branchName: string;
  } | null>(null);

  // Paginated Results State from Backend
  const [displayedRooms, setDisplayedRooms] = useState<Room[]>([]);
  const [displayedRoomTypes, setDisplayedRoomTypes] = useState<RoomType[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingRooms, setLoadingRooms] = useState<boolean>(true);

  // View Mode: default to 'rooms' to display all rooms as requested by user
  const [viewMode, setViewMode] = useState<'rooms' | 'types'>('rooms');

  // Filters initialized from URL search params
  const [selectedBranchId, setSelectedBranchId] = useState<string>(searchParams.get('branch') || 'all');
  const [selectedGuestCount, setSelectedGuestCount] = useState<string>(searchParams.get('guests') || 'all');
  const [searchCheckIn, setSearchCheckIn] = useState<string>(searchParams.get('checkIn') || '');
  const [searchCheckOut, setSearchCheckOut] = useState<string>(searchParams.get('checkOut') || '');

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  // Room Detail Modal State (1 Big Cover + 5 Detail Gallery Images)
  const [selectedDetailRoomType, setSelectedDetailRoomType] = useState<RoomType | null>(null);

  // Professional Pagination State (Server-side)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;
  const roomsSectionRef = useRef<HTMLElement>(null);

  // Synchronize when URL search params change
  useEffect(() => {
    const b = searchParams.get('branch');
    const g = searchParams.get('guests');
    const cin = searchParams.get('checkIn');
    const cout = searchParams.get('checkOut');

    if (b !== null) setSelectedBranchId(b);
    if (g !== null) setSelectedGuestCount(g);
    if (cin !== null) setSearchCheckIn(cin);
    if (cout !== null) setSearchCheckOut(cout);
  }, [searchParams]);

  // Fetch initial master lookup data (room types, branches, room prices, all rooms)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingInitial(true);
        const [typesRes, branchesRes, pricesRes, roomsRes] = await Promise.all([
          roomsApi.getRoomTypes({ no_page: 'true', page_size: 'all' } as any),
          branchesApi.getAll(),
          roomsApi.getRoomPrices(),
          roomsApi.getRooms({ no_page: 'true', page_size: 'all' } as any),
        ]);

        const tData = Array.isArray(typesRes.data)
          ? typesRes.data
          : (typesRes.data as any).results || [];
        const bData = Array.isArray(branchesRes.data)
          ? branchesRes.data
          : (branchesRes.data as any).results || [];
        const pData = Array.isArray(pricesRes.data)
          ? pricesRes.data
          : (pricesRes.data as any).results || [];
        const rData = Array.isArray(roomsRes.data)
          ? roomsRes.data
          : (roomsRes.data as any).results || [];

        setRoomTypes(tData);
        setBranches(bData);
        setRoomPrices(pData);
        setAllRooms(rData);
      } catch (err) {
        console.error('Lỗi tải dữ liệu metadata ban đầu:', err);
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchMetadata();
  }, []);

  // Reset pagination to page 1 whenever filters or view mode change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBranchId, selectedGuestCount, searchCheckIn, searchCheckOut, viewMode]);

  // Fetch paginated rooms or room types from backend (Server-side Pagination)
  useEffect(() => {
    let isCurrent = true;
    const fetchPaginatedData = async () => {
      try {
        setLoadingRooms(true);
        if (viewMode === 'rooms') {
          let res;
          const hasDateFilter = Boolean(
            searchCheckIn &&
            searchCheckOut &&
            searchCheckIn.trim() !== '' &&
            searchCheckOut.trim() !== ''
          );

          if (hasDateFilter) {
            const availParams: Record<string, any> = {
              check_in: searchCheckIn,
              check_out: searchCheckOut,
              page: currentPage,
              page_size: pageSize,
            };
            if (selectedBranchId !== 'all') {
              availParams.branch = selectedBranchId;
            }
            if (selectedGuestCount !== 'all') {
              availParams.guests = selectedGuestCount;
            }
            res = await roomsApi.getAvailableRooms(availParams as any);
          } else {
            const params: Record<string, any> = {
              status: 'available',
              is_active: 'true',
              page: currentPage,
              page_size: pageSize,
            };
            if (selectedBranchId !== 'all') {
              params.branch = selectedBranchId;
            }
            if (selectedGuestCount !== 'all') {
              params.guests = selectedGuestCount;
            }
            res = await roomsApi.getRooms(params);
          }

          if (!isCurrent) return;

          const results = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
          const count = typeof (res.data as any)?.count === 'number' ? (res.data as any).count : results.length;
          const pages = (res.data as any)?.total_pages || Math.max(1, Math.ceil(count / pageSize));

          setDisplayedRooms(results);
          setTotalCount(count);
          setTotalPages(pages);
        } else {
          const params: Record<string, any> = {
            page: currentPage,
            page_size: pageSize,
          };
          if (selectedGuestCount !== 'all') {
            params.guests = selectedGuestCount;
          }

          const res = await roomsApi.getRoomTypes(params);
          if (!isCurrent) return;

          const results = Array.isArray(res.data) ? res.data : ((res.data as any)?.results || []);
          const count = typeof (res.data as any)?.count === 'number' ? (res.data as any).count : results.length;
          const pages = (res.data as any)?.total_pages || Math.max(1, Math.ceil(count / pageSize));

          setDisplayedRoomTypes(results);
          setTotalCount(count);
          setTotalPages(pages);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu phân trang từ backend:', err);
        if (isCurrent) {
          if (viewMode === 'rooms') setDisplayedRooms([]);
          else setDisplayedRoomTypes([]);
          setTotalCount(0);
          setTotalPages(1);
        }
      } finally {
        if (isCurrent) {
          setLoadingRooms(false);
        }
      }
    };

    fetchPaginatedData();
    return () => {
      isCurrent = false;
    };
  }, [viewMode, selectedBranchId, selectedGuestCount, searchCheckIn, searchCheckOut, currentPage]);

  // Helper: get price for a room type
  const getRoomPrice = (typeId: number, branchId?: string) => {
    const found = roomPrices.find((p) => {
      const matchType = p.room_type === typeId;
      const matchBranch = branchId && branchId !== 'all' ? String(p.branch) === branchId : true;
      return matchType && matchBranch && p.rate_type === 'daily';
    });

    if (found) {
      return Number(found.price);
    }

    // Fallback estimates if pricing not yet seeded
    switch (typeId) {
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
  };

  // Page navigation helper with smooth scroll
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Smart page number pills calculation
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  // Map branches to QuickSearchBar options
  const branchOptions: QuickBranchOption[] = useMemo(() => [
    { id: 'all', label: `Tất cả chi nhánh (${branches.length} cơ sở)` },
    ...branches.map((b) => ({
      id: String(b.id),
      label: `${b.name} (${b.province || b.code})`,
    })),
  ], [branches]);

  // Handle search when user clicks "Lọc Phòng"
  const handleQuickSearch = (params: QuickSearchParams) => {
    setSelectedBranchId(params.branchId);
    setSelectedGuestCount(params.guests);
    setSearchCheckIn(params.checkIn);
    setSearchCheckOut(params.checkOut);

    // Update URL query parameters
    const newParams = new URLSearchParams();
    if (params.branchId !== 'all') newParams.set('branch', params.branchId);
    if (params.guests !== 'all') newParams.set('guests', params.guests);
    if (params.checkIn) newParams.set('checkIn', params.checkIn);
    if (params.checkOut) newParams.set('checkOut', params.checkOut);
    setSearchParams(newParams);
  };

  // Open booking modal for room type
  const handleOpenBooking = (type: RoomType) => {
    // If a specific branch is currently selected in search filter
    if (selectedBranchId !== 'all') {
      const hasRoomInBranch = allRooms.some(
        (r) => String(r.branch) === selectedBranchId && r.room_type === type.id && r.is_active
      );
      if (!hasRoomInBranch) {
        const branchObj = branches.find((b) => String(b.id) === selectedBranchId);
        setUnavailableNotice({
          roomTypeName: type.name,
          branchName: branchObj ? branchObj.name : 'cơ sở đó',
        });
        return;
      }
    } else {
      // If 'all' branches, check if this room type has any rooms anywhere in system
      const hasAnyRoom = allRooms.some((r) => r.room_type === type.id && r.is_active);
      if (!hasAnyRoom && allRooms.length > 0) {
        setUnavailableNotice({
          roomTypeName: type.name,
          branchName: 'toàn bộ hệ thống cơ sở',
        });
        return;
      }
    }

    setSelectedRoomType(type);
    setIsBookingModalOpen(true);
  };

  // Open booking modal for a specific individual room
  const handleOpenBookingForRoom = (room: Room) => {
    const type = roomTypes.find((t) => t.id === room.room_type) || null;
    setSelectedRoomType(type);
    setSelectedBranchId(String(room.branch));
    setIsBookingModalOpen(true);
  };

  const handleOpenDetailForRoom = (room: Room) => {
    const type = roomTypes.find((t) => t.id === room.room_type) || null;
    setSelectedDetailRoomType(type);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO BANNER SECTION */}
      <section className="relative bg-[#141312] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#262320] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/80 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KHÔNG GIAN LƯU TRÚ BOUTIQUE CAO CẤP</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
            Bộ Sưu Tập Phòng & Khoang Ngủ
          </h1>

          <p className="text-stone-300 text-sm sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Mỗi căn phòng tại AH Hotel là một sự kết hợp hài hòa giữa nét thẩm mỹ Indochine tinh tế, tiện nghi công nghệ hiện đại và sự riêng tư tuyệt đối.
          </p>
        </div>
      </section>

      {/* REUSABLE QUICK SEARCH BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 lg:-mt-12 relative z-20 w-full">
        <QuickSearchBar
          branches={branchOptions}
          initialParams={{
            branchId: selectedBranchId,
            guests: selectedGuestCount,
            checkIn: searchCheckIn,
            checkOut: searchCheckOut,
          }}
          buttonLabel="Lọc Phòng"
          onSearch={handleQuickSearch}
          className="max-w-5xl mx-auto shadow-2xl border border-stone-200/90"
        />
      </section>

      {/* ROOMS CATALOG SHOWCASE */}
      <section ref={roomsSectionRef} className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-[#E3DDD2]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {viewMode === 'rooms' ? 'Danh Sách Tất Cả Các Phòng Nghỉ' : 'Danh Sách Hạng Phòng Chuỗi'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
              Giá niêm yết minh bạch, tiêu chuẩn phòng sạch sẽ, đã bao gồm bữa sáng buffet và minibar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: All Rooms vs By Room Type */}
            <div className="flex items-center rounded-xl bg-[#EBE7DF] p-1 border border-stone-300">
              <button
                type="button"
                onClick={() => setViewMode('rooms')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'rooms'
                    ? 'bg-stone-950 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Bed className="h-3.5 w-3.5" />
                <span>Tất cả phòng ({viewMode === 'rooms' ? totalCount : '...'})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('types')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'types'
                    ? 'bg-stone-950 text-amber-300 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Hạng phòng ({viewMode === 'types' ? totalCount : roomTypes.length})</span>
              </button>
            </div>

            {/* Badge indicating only available rooms are displayed */}
            {viewMode === 'rooms' && (
              <div className="flex items-center gap-1.5 rounded-xl border border-emerald-300/80 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-2xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>
                  {searchCheckIn && searchCheckOut
                    ? `Khả dụng từ ${searchCheckIn} đến ${searchCheckOut} (${totalCount} phòng)`
                    : `Trống sẵn sàng đón khách (${totalCount})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {loadingRooms || loadingInitial ? (
          <div className="flex h-72 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
              <span className="text-xs font-medium text-stone-500">Đang tải danh sách phòng...</span>
            </div>
          </div>
        ) : viewMode === 'rooms' ? (
          /* VIEW 1: DISPLAY ALL INDIVIDUAL ROOMS (P.101, P.102, P.201...) */
          displayedRooms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-16 text-center">
              <Bed className="mx-auto h-12 w-12 text-stone-400 mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy phòng phù hợp</h3>
              <p className="mt-1 text-xs text-stone-500 font-light">
                Vui lòng chọn lại tiêu chí lọc số khách hoặc chi nhánh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedRooms.map((room) => {
                const type = roomTypes.find((t) => t.id === room.room_type);
                const priceDaily = getRoomPrice(room.room_type, String(room.branch));

                const primaryImgObj = type?.images?.find((img) => img.is_primary);
                const roomImage =
                  primaryImgObj?.image_url ||
                  type?.images?.[0]?.image_url ||
                  ROOM_IMAGES[type?.name || ''] ||
                  DEFAULT_ROOM_IMAGE;

                const roomItem: RoomItem = {
                  id: room.id,
                  name: `Phòng ${room.room_number} - ${room.room_type_name || 'Phòng nghỉ'}`,
                  category: `${room.branch_name || 'AH Hotel'} • Tầng ${room.floor || 1}`,
                  description:
                    type?.description ||
                    room.room_type_description ||
                    `Phòng ${room.room_number} tại tầng ${room.floor || 1}, không gian yên tĩnh, trang bị nội thất cao cấp và đệm êm ái.`,
                  price: priceDaily,
                  period: 'đêm',
                  capacity: `Tối đa ${room.max_occupancy || 2} khách`,
                  size: room.bed_type || type?.bed_type || 'Giường King Size',
                  area: (room.area_sqm || type?.area_sqm) ? `${room.area_sqm || type?.area_sqm} m²` : undefined,
                  image: roomImage,
                  rating: '4.98',
                  reviews: 120 + room.id * 2,
                };

                return (
                  <RoomCard
                    key={room.id}
                    room={roomItem}
                    onViewDetail={() => handleOpenDetailForRoom(room)}
                    onBook={() => handleOpenBookingForRoom(room)}
                  />
                );
              })}
            </div>
          )
        ) : (
          /* VIEW 2: DISPLAY BY ROOM TYPES */
          displayedRoomTypes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-16 text-center">
              <Bed className="mx-auto h-12 w-12 text-stone-400 mb-3" />
              <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy hạng phòng phù hợp</h3>
              <p className="mt-1 text-xs text-stone-500 font-light">
                Vui lòng chọn lại tiêu chí lọc số khách hoặc chi nhánh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedRoomTypes.map((type) => {
                const priceDaily = getRoomPrice(type.id, selectedBranchId);

                const primaryImgObj = type.images?.find((img) => img.is_primary);
                const roomImage =
                  primaryImgObj?.image_url ||
                  type.images?.[0]?.image_url ||
                  ROOM_IMAGES[type.name] ||
                  DEFAULT_ROOM_IMAGE;

                const hasRoomInBranch = selectedBranchId === 'all'
                  ? allRooms.some((r) => r.room_type === type.id && r.is_active)
                  : allRooms.some((r) => String(r.branch) === selectedBranchId && r.room_type === type.id && r.is_active);

                const roomItem: RoomItem = {
                  id: type.id,
                  name: type.name,
                  category: !hasRoomInBranch && selectedBranchId !== 'all'
                    ? 'Chưa có tại cơ sở này'
                    : (type.bed_type || 'Boutique Stay'),
                  description:
                    type.description ||
                    'Thiết kế kiến trúc thanh lịch với không gian ánh sáng tự nhiên ngập tràn, nội thất cao cấp và đệm êm ái.',
                  price: priceDaily,
                  period: 'đêm',
                  capacity: `Tối đa ${type.max_occupancy} khách`,
                  size: type.bed_type || 'Giường King Size',
                  area: type.area_sqm ? `${type.area_sqm} m²` : undefined,
                  image: roomImage,
                  rating: '4.96',
                  reviews: 148,
                };

                return (
                  <RoomCard
                    key={type.id}
                    room={roomItem}
                    bookLabel={!hasRoomInBranch && selectedBranchId !== 'all' ? 'Chưa có phòng' : 'Đặt Ngay'}
                    onViewDetail={() => setSelectedDetailRoomType(type)}
                    onBook={() => handleOpenBooking(type)}
                  />
                );
              })}
            </div>
          )
        )}

        {/* PROFESSIONAL PAGINATION BAR */}
        {!loadingRooms && totalPages > 1 && (
          <div className="mt-12 pt-6 border-t border-[#E3DDD2] flex items-center justify-center">
            {/* Page Navigation Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Trang trước"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {/* Page Number Pills */}
              {pageNumbers.map((pageNum, idx) => {
                if (pageNum === '...') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-xs text-stone-400 select-none font-bold"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrent = currentPage === pageNum;
                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    onClick={() => goToPage(Number(pageNum))}
                    className={`h-8 min-w-[2rem] px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-stone-950 text-amber-300 shadow-sm scale-105'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ROOM DETAIL MODAL (1 BIG COVER IMAGE + 5 DETAIL GALLERY THUMBNAILS) */}
      <RoomDetailModal
        isOpen={!!selectedDetailRoomType}
        onClose={() => setSelectedDetailRoomType(null)}
        roomType={selectedDetailRoomType}
        priceDaily={selectedDetailRoomType ? getRoomPrice(selectedDetailRoomType.id, selectedBranchId) : undefined}
        onBookNow={(type) => {
          setSelectedDetailRoomType(null);
          handleOpenBooking(type);
        }}
      />

      {/* MODAL THÔNG BÁO HẠNG PHÒNG CHƯA CÓ TẠI CƠ SỞ */}
      <Modal
        isOpen={!!unavailableNotice}
        onClose={() => setUnavailableNotice(null)}
        title="Thông Báo Đặt Phòng"
        maxWidth="max-w-md"
      >
        <div className="text-center py-3 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="h-7 w-7 text-amber-700" />
          </div>

          <div className="space-y-1.5">
            <h3 className="font-serif text-lg font-bold text-stone-900">
              Hạng phòng này vẫn chưa có ở cơ sở đó
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-light">
              Hạng phòng <strong className="text-stone-900 font-bold">{unavailableNotice?.roomTypeName}</strong> hiện tại chưa có phòng tại{' '}
              <strong className="text-amber-900 font-bold">{unavailableNotice?.branchName}</strong>.
            </p>
          </div>

          <div className="rounded-xl bg-[#FAF8F5] border border-amber-200/80 p-3.5 text-xs text-left text-stone-600 space-y-1.5">
            <span className="font-semibold text-stone-800 block">💡 Gợi ý dành cho bạn:</span>
            <ul className="list-disc pl-4 space-y-1 text-stone-500 font-light">
              <li>Đổi bộ lọc sang <strong>"Tất cả chi nhánh"</strong> để xem các cơ sở đang có hạng phòng này.</li>
              <li>Hoặc chọn các hạng phòng khác đang có sẵn tại cơ sở này.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setUnavailableNotice(null);
                setSelectedBranchId('all');
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('branch');
                setSearchParams(newParams);
              }}
              className="py-2.5 px-4 rounded-xl bg-amber-800 text-white font-bold text-xs hover:bg-amber-900 transition-colors shadow-xs cursor-pointer"
            >
              Xem Tất Cả Chi Nhánh
            </button>
            <button
              type="button"
              onClick={() => setUnavailableNotice(null)}
              className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-50 transition-colors cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </Modal>

      {/* PUBLIC ONLINE BOOKING MODAL */}
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedRoomType={selectedRoomType}
        branches={branches}
        roomPrices={roomPrices}
        allRooms={allRooms}
        initialBranchId={selectedBranchId !== 'all' ? selectedBranchId : undefined}
        initialCheckIn={searchCheckIn}
        initialCheckOut={searchCheckOut}
      />
    </div>
  );
};
