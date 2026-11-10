import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Shirt,
  HeartHandshake,
  Car,
  BedDouble,
  Search,
  Sparkles,
  Phone,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Minus,
  Coffee,
  Receipt,
  X,
  Building2,
  ArrowRight,
  Send,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { bookingsApi, branchesApi } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Service, Branch, ServiceCategory, Booking } from '../types';

const CATEGORIES: {
  code: 'all' | ServiceCategory;
  label: string;
  icon: React.FC<{ className?: string }>;
  tagline: string;
}[] = [
    { code: 'all', label: 'Tất Cả Dịch Vụ', icon: Sparkles, tagline: 'Đầy đủ các tiện ích nghỉ dưỡng' },
    { code: 'food_beverage', label: 'Ẩm Thực Tại Phòng', icon: Utensils, tagline: 'Món nóng giao tận cửa phòng' },
    { code: 'laundry', label: 'Giặt Sấy & Giặt Hấp', icon: Shirt, tagline: 'Chăm sóc trang phục chuyên sâu' },
    { code: 'spa_wellness', label: 'Spa & Trị Liệu', icon: HeartHandshake, tagline: 'Thư giãn cơ thể & tinh thần' },
    { code: 'transport', label: 'Xe Đưa Đón & Tour', icon: Car, tagline: 'Di chuyển an toàn, tiện lợi' },
    { code: 'room_amenities', label: 'Tiện Ích Buồng Phòng', icon: BedDouble, tagline: 'Nâng tầm không gian sống' },
  ];

export const PublicServicesPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active bookings of current user (to enable in-room ordering)
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);

  // Filters
  const [activeCategory, setActiveCategory] = useState<'all' | ServiceCategory>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // In-Room Ordering Modal State
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [selectedServiceForOrder, setSelectedServiceForOrder] = useState<Service | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [selectedDetailId, setSelectedDetailId] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderNote, setOrderNote] = useState('');
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Lookup state for in-house guests
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [foundBookings, setFoundBookings] = useState<Booking[]>([]);
  const [showLookupBox, setShowLookupBox] = useState(false);

  const availableBookings = useMemo(() => {
    if (activeBookings.length > 0) return activeBookings;
    return foundBookings;
  }, [activeBookings, foundBookings]);

  const roomOptions = useMemo(() => {
    return availableBookings.flatMap((b) =>
      (b.details || []).map((d) => ({
        key: `${b.id}:${d.id}`,
        bookingId: String(b.id),
        detailId: String(d.id),
        roomNumber: d.room_number || `#${d.room}`,
        roomTypeName: d.room_type_name || 'Phòng nghỉ',
        branchName: b.branch_name,
        bookingCode: b.booking_code,
        customerName: b.customer?.full_name,
      }))
    );
  }, [availableBookings]);

  // Fetch initial services & branches
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        setError('');
        const [servicesRes, branchesRes] = await Promise.all([
          bookingsApi.getServices({ is_active: true }),
          branchesApi.getAll(),
        ]);

        const sData = Array.isArray(servicesRes.data)
          ? servicesRes.data
          : (servicesRes.data as any).results || [];
        const bData = Array.isArray(branchesRes.data)
          ? branchesRes.data
          : (branchesRes.data as any).results || [];

        setServices(sData);
        setBranches(bData);
      } catch {
        setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Fetch user's active bookings if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserActiveBookings();
    }
  }, [isAuthenticated]);

  const fetchUserActiveBookings = async () => {
    try {
      const res = await bookingsApi.getMyBookings();
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      // Only keep bookings that are currently checked_in or confirmed/pending
      const current = data.filter((b: Booking) => b.status === 'checked_in' || b.status === 'confirmed');
      setActiveBookings(current);
      if (current.length > 0) {
        setSelectedBookingId(String(current[0].id));
        if (current[0].details && current[0].details.length > 0) {
          setSelectedDetailId(String(current[0].details[0].id));
        }
      }
    } catch {
      setActiveBookings([]);
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 5000);
  };

  // Open In-Room Order Modal
  const handleOpenOrderModal = (service: Service) => {
    setSelectedServiceForOrder(service);
    setOrderQuantity(1);
    setOrderNote('');
    setOrderError('');
    setLookupError('');

    const currentBookings = activeBookings.length > 0 ? activeBookings : foundBookings;
    if (currentBookings.length > 0) {
      const first = currentBookings[0];
      setSelectedBookingId(String(first.id));
      if (first.details && first.details.length > 0) {
        setSelectedDetailId(String(first.details[0].id));
      }
      setShowLookupBox(false);
    } else {
      setShowLookupBox(true);
    }
    setOrderModalOpen(true);
  };

  const handleLookup = async () => {
    const q = lookupQuery.trim();
    if (!q) return;
    try {
      setLookupLoading(true);
      setLookupError('');
      const res = await bookingsApi.lookup({ q });
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      const current = data.filter((b: Booking) => b.status === 'checked_in' || b.status === 'confirmed');
      if (data.length === 0) {
        setLookupError('Không tìm thấy đơn đặt phòng hoặc hóa đơn phù hợp với thông tin đã nhập.');
        setFoundBookings([]);
      } else if (current.length === 0) {
        setLookupError('Đơn đặt phòng này đã hoàn tất (trả phòng) hoặc đã bị hủy, không thể gọi thêm dịch vụ.');
        setFoundBookings([]);
      } else {
        setFoundBookings(current);
        setSelectedBookingId(String(current[0].id));
        if (current[0].details && current[0].details.length > 0) {
          setSelectedDetailId(String(current[0].details[0].id));
        }
        setShowLookupBox(false);
      }
    } catch {
      setLookupError('Không thể tra cứu đơn đặt phòng lúc này. Vui lòng thử lại sau.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleRoomChange = (combinedKey: string) => {
    const [bId, dId] = combinedKey.split(':');
    setSelectedBookingId(bId || '');
    setSelectedDetailId(dId || '');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (!selectedServiceForOrder) return;

    if (!selectedBookingId || !selectedDetailId) {
      setOrderError('Vui lòng chọn phòng đang lưu trú để nhân viên giao dịch vụ tới.');
      return;
    }

    try {
      setOrdering(true);
      const payload = {
        detail_id: Number(selectedDetailId),
        service_id: selectedServiceForOrder.id,
        quantity: orderQuantity,
        unit_price: Number(selectedServiceForOrder.price),
        note: orderNote.trim() || undefined,
      };

      await bookingsApi.addService(selectedBookingId, payload);

      setOrderModalOpen(false);
      showToast(
        `Đã đặt thành công ${orderQuantity}x "${selectedServiceForOrder.name}". Nhân viên sẽ phục vụ lên phòng trong ít phút và cộng vào hóa đơn của bạn!`
      );
    } catch (err: any) {
      setOrderError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Không thể đặt dịch vụ. Vui lòng liên hệ lễ tân để được hỗ trợ.'
      );
    } finally {
      setOrdering(false);
    }
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Category
      if (activeCategory !== 'all' && s.category !== activeCategory) {
        return false;
      }

      // Branch
      if (selectedBranchId !== 'all') {
        if (s.branch && String(s.branch) !== selectedBranchId) {
          return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(term);
        const matchDesc = s.description?.toLowerCase().includes(term);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [services, activeCategory, selectedBranchId, searchTerm]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: services.length };
    CATEGORIES.forEach((cat) => {
      if (cat.code !== 'all') {
        counts[cat.code] = services.filter((s) => s.category === cat.code).length;
      }
    });
    return counts;
  }, [services]);

  return (
    <div className="flex-1 flex flex-col">
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-24 right-5 z-50 max-w-md rounded-2xl bg-stone-950 p-4 text-white shadow-2xl border border-amber-400/40 animate-slide-in-right flex items-start gap-3">
          <div className="p-1 rounded-full bg-amber-400 text-stone-950 shrink-0 mt-0.5">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-300">Yêu cầu dịch vụ thành công</p>
            <p className="text-stone-300 mt-0.5 leading-relaxed">{toastMsg}</p>
          </div>
          <button type="button" onClick={() => setToastMsg('')} className="text-stone-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* HERO BANNER SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#141312] via-[#1E1C1A] to-[#141312] text-white py-16 sm:py-24 border-b border-[#262320]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(217,119,6,0.15),transparent_60%)] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Tiện Ích & Trải Nghiệm Thượng Lưu</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-stone-100 max-w-3xl mx-auto leading-tight">
            Ẩm Thực, Spa Thư Giãn & Tiện Nghi Chuẩn <span className="italic text-amber-300">Boutique</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xs sm:text-sm text-stone-400 font-light leading-relaxed">
            Thưởng thức tô phở bò tái lăn nóng hổi phục vụ tận phòng, thư giãn cùng liệu pháp massage đá núi lửa, giặt ủi siêu tốc 2 giờ và xe đưa đón riêng chu đáo tại AH Hotel.
          </p>

          {/* Quick Features Highlight */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-stone-300 font-medium">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Giao phòng nhanh 15 - 30 phút</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              <span>Nguyên liệu tươi sạch hữu cơ</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-amber-400" />
              <span>Cộng dồn hóa đơn thanh toán lúc trả phòng</span>
            </span>
          </div>
        </div>
      </section>

      {/* FILTER & CATEGORY NAVIGATION BAR */}
      <section className="sticky top-20 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E3DDD2] shadow-xs py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.code;
              const count = categoryCounts[cat.code] ?? 0;

              return (
                <button
                  key={cat.code}
                  type="button"
                  onClick={() => setActiveCategory(cat.code)}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${isActive
                    ? 'bg-stone-950 text-amber-300 shadow-md scale-102'
                    : 'bg-white text-stone-600 border border-[#E3DDD2] hover:bg-stone-100 hover:text-stone-900'
                    }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-300' : 'text-amber-700'}`} />
                  <span>{cat.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-amber-400/20 text-amber-200' : 'bg-stone-100 text-stone-500'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Branch Selectors */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm món ăn, gói spa, giặt là theo tên..."
                className="w-full rounded-xl border border-[#E3DDD2] bg-white pl-10 pr-4 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden shadow-2xs"
              />
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="w-full rounded-xl border border-[#E3DDD2] bg-white px-3.5 py-2.5 text-xs text-stone-800 focus:border-amber-600 focus:outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="all">Tất cả chi nhánh AH Hotel</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* ACTIVE GUEST NOTICE BANNER */}
      {isAuthenticated && activeBookings.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/90 p-4 text-xs text-amber-950 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-200 text-amber-800 shrink-0">
                <BedDouble className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-amber-950 text-sm">
                  Xin chào {user?.employee?.full_name || user?.first_name || user?.username}!
                </p>
                <p className="text-amber-900 mt-0.5">
                  Bạn đang lưu trú tại phòng{' '}
                  <strong className="font-bold text-amber-950">
                    {activeBookings[0].details?.[0]?.room_number || '#Phòng'}
                  </strong>{' '}
                  ({activeBookings[0].branch_name}). Bạn có thể bấm <strong>"Gọi lên phòng"</strong> ở bất kỳ món nào để nhân viên phục vụ tận nơi!
                </p>
              </div>
            </div>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-800 px-4 py-2 font-bold text-white hover:bg-amber-900 transition-colors shrink-0"
            >
              <span>Xem phòng của tôi</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* MAIN SERVICE CARDS GRID */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {loading ? (
          <div className="py-24 text-center text-xs text-stone-500">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-amber-600 mb-3" />
            <p className="text-sm font-medium text-stone-700">Đang chuẩn bị thực đơn dịch vụ...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E3DDD2] p-8 shadow-xs max-w-md mx-auto">
            <Utensils className="h-12 w-12 mx-auto text-amber-700/60 mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-900">Không tìm thấy dịch vụ phù hợp</h3>
            <p className="text-xs text-stone-500 mt-1">
              Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục khác.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchTerm('');
                setSelectedBranchId('all');
              }}
              className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Xem tất cả dịch vụ
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredServices.map((service) => {
              return (
                <div
                  key={service.id}
                  className="group flex flex-col rounded-3xl border border-[#E3DDD2] bg-white overflow-hidden shadow-xs hover:shadow-xl hover:border-amber-300 transition-all duration-300"
                >
                  {/* Card Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-stone-100">
                    <img
                      src={
                        service.image_url ||
                        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={service.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                    {/* Unit Pill */}
                    <div className="absolute top-3 right-3 rounded-full bg-stone-950/80 backdrop-blur-xs px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                      {service.unit}
                    </div>

                    {/* Branch Badge if specific */}
                    {service.branch_name && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-stone-800">
                        <Building2 className="h-3 w-3 text-amber-700" />
                        <span>{service.branch_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-serif font-bold text-base text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-xs text-stone-500 font-light line-clamp-3 leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>

                    {/* Price & CTA Action */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                          Đơn giá
                        </span>
                        <div className="font-serif font-bold text-lg text-amber-900">
                          {Number(service.price).toLocaleString('vi-VN')} đ
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenOrderModal(service)}
                          className="flex items-center gap-1.5 rounded-xl bg-stone-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-amber-700 transition-all cursor-pointer"
                        >
                          <Send className="h-3.5 w-3.5 text-amber-400" />
                          <span>Đặt ngay</span>
                        </button>
                        <a
                          href="tel:19006886"
                          title="Hotline lễ tân"
                          className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-amber-700 hover:bg-stone-50 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* COMMITMENT / SERVICE GUARANTEE BANNER */}
      <section className="bg-white border-t border-[#E3DDD2] py-12 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Phục Vụ Nhanh Chóng 24/7</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Đội ngũ phục vụ buồng phòng và lễ tân luôn sẵn sàng tiếp nhận yêu cầu bất kể ngày đêm.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-sky-50 text-sky-800 flex items-center justify-center shrink-0 border border-sky-200">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Chất Lượng Đạt Chuẩn</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Nguyên liệu món ăn tươi mới mỗi ngày, mỹ phẩm spa thảo dược tự nhiên dịu nhẹ cho làn da.
                </p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                <Coffee className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-sm">Gộp Hóa Đơn Tiện Lợi</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Mọi chi phí dịch vụ được ghi nhận minh bạch và quyết toán cùng lúc khi bạn làm thủ tục check-out.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL: ĐẶT DỊCH VỤ / GỌI MÓN LÊN PHÒNG CHO KHÁCH LƯU TRÚ */}
      <Modal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        title="Đặt Dịch Vụ Phục Vụ Lên Phòng"
        maxWidth="max-w-md"
      >
        {selectedServiceForOrder && (
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            {orderError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Service Summary Card */}
            <div className="flex items-center gap-3 rounded-2xl bg-[#FAF8F5] p-3.5 border border-[#EDE7DD]">
              <div className="h-14 w-14 rounded-xl border border-stone-200 overflow-hidden bg-stone-100 shrink-0">
                <img
                  src={selectedServiceForOrder.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80'}
                  alt={selectedServiceForOrder.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs text-stone-900 truncate">
                  {selectedServiceForOrder.name}
                </h4>
                <p className="text-[11px] text-stone-500">Đơn vị: {selectedServiceForOrder.unit}</p>
                <p className="font-mono font-bold text-xs text-amber-900">
                  {Number(selectedServiceForOrder.price).toLocaleString('vi-VN')} đ
                </p>
              </div>
            </div>

            {/* Room Select or Lookup Section */}
            {roomOptions.length > 0 && !showLookupBox ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700">
                    Giao tới phòng của bạn: <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowLookupBox(true);
                      setLookupError('');
                    }}
                    className="text-[11px] text-amber-700 hover:text-amber-900 hover:underline font-medium cursor-pointer"
                  >
                    Tìm phòng khác / Nhập mã
                  </button>
                </div>
                <select
                  required
                  value={`${selectedBookingId}:${selectedDetailId}`}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden cursor-pointer font-medium"
                >
                  {roomOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      Phòng {opt.roomNumber} ({opt.roomTypeName}) — {opt.branchName} [#{opt.bookingCode}]
                      {opt.customerName ? ` (${opt.customerName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-amber-950 flex items-center gap-1.5">
                    <Search className="h-3.5 w-3.5 text-amber-700" />
                    Xác định phòng lưu trú của bạn
                  </span>
                  {roomOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowLookupBox(false)}
                      className="text-[11px] text-stone-500 hover:text-stone-800 underline cursor-pointer"
                    >
                      Hủy tìm kiếm
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Nhập <strong>Mã đơn (BK...)</strong>, <strong>Mã hóa đơn (INV...)</strong> hoặc <strong>Số điện thoại</strong> để xác định phòng và tự động ghi nhận vào hóa đơn:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLookup();
                      }
                    }}
                    placeholder="Mã đơn (BK...), Mã hóa đơn (INV...) hoặc Số ĐT..."
                    className="flex-1 rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-amber-600 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleLookup}
                    disabled={lookupLoading || !lookupQuery.trim()}
                    className="px-4 py-2 rounded-xl bg-amber-700 text-white font-bold text-xs hover:bg-amber-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    <span>Tìm phòng</span>
                  </button>
                </div>
                {lookupError && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{lookupError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Số lượng ({selectedServiceForOrder.unit}):
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-stone-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOrderQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-12 text-center font-bold text-xs text-stone-900">
                    {orderQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderQuantity((q) => Math.min(20, q + 1))}
                    className="p-2.5 text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="text-right flex-1">
                  <span className="text-[10px] text-stone-400 block uppercase font-bold">Thành tiền dự kiến</span>
                  <span className="font-serif font-bold text-sm text-amber-900">
                    {(Number(selectedServiceForOrder.price) * orderQuantity).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Ghi chú thêm cho nhân viên:
              </label>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="VD: Ít cay, mang lên lúc 19h30, cần thêm đũa..."
                className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden"
              />
            </div>

            {/* BILLING / CHECKOUT NOTICE */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 flex items-start gap-2.5">
              <Receipt className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900">Thanh toán khi làm thủ tục Check-out:</span>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  Dịch vụ sẽ được nhân viên chuẩn bị và phục vụ lên phòng. Số tiền{' '}
                  <strong className="text-amber-950">
                    {(Number(selectedServiceForOrder.price) * orderQuantity).toLocaleString('vi-VN')} đ
                  </strong>{' '}
                  sẽ được tự động cộng vào hóa đơn phòng và thanh toán khi quý khách trả phòng.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setOrderModalOpen(false)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={ordering}
                className="flex items-center gap-1.5 rounded-xl bg-stone-950 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {ordering ? (
                  <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                ) : (
                  <Send className="h-3.5 w-3.5 text-amber-400" />
                )}
                <span>Xác Nhận Đặt Dịch Vụ</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
