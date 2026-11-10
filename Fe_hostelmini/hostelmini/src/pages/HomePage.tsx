import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  Sparkles,
  CheckCircle2,
  Wine,
  Utensils,
  Wifi,
  Car,
  ShieldCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { QuickSearchBar, RoomCard, BranchCard } from '../components/hotel';
import type { RoomItem, BranchItem, QuickBranchOption } from '../components/hotel';
import { roomsApi, branchesApi } from '../api';
import type { RoomType, Branch, RoomPrice } from '../types';
import { RoomDetailModal, PublicBookingModal } from '../components/modals';

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

const FALLBACK_ROOM_TYPES: RoomType[] = [
  {
    id: 1,
    name: 'Royal Heritage Suite',
    bed_type: 'Phòng Tổng Thống • Private',
    description: 'Không gian thượng lưu với ban công panorama nhìn toàn cảnh phố đi bộ, phòng tắm cẩm thạch và bồn sục jacuzzi.',
    max_occupancy: 3,
    area_sqm: 55,
    images: [
      { id: 1, room_type: 1, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0 },
      { id: 2, room_type: 1, image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 1 },
      { id: 3, room_type: 1, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 2 },
      { id: 4, room_type: 1, image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 3 },
      { id: 5, room_type: 1, image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 4 },
      { id: 6, room_type: 1, image_url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 5 },
    ],
  },
  {
    id: 2,
    name: 'Executive Boutique Room',
    bed_type: 'Phòng Đơn Cao Cấp • Private',
    description: 'Thiết kế tinh tế theo phong cách Indochine ấm cúng, bàn làm việc sang trọng và hệ thống cách âm tuyệt đối.',
    max_occupancy: 2,
    area_sqm: 32,
    images: [
      { id: 7, room_type: 2, image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0 },
      { id: 8, room_type: 2, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 1 },
      { id: 9, room_type: 2, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 2 },
      { id: 10, room_type: 2, image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 3 },
      { id: 11, room_type: 2, image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 4 },
      { id: 12, room_type: 2, image_url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 5 },
    ],
  },
  {
    id: 3,
    name: 'Luxury Capsule Pod Dorm',
    bed_type: 'Khoang Ngủ Riêng Tư • Pod Social',
    description: 'Khoang ngủ capsule thông minh chuẩn Nhật Bản, rèm nhung cách âm riêng tư, khóa vân tay và tủ đồ an toàn.',
    max_occupancy: 1,
    area_sqm: 10,
    images: [
      { id: 13, room_type: 3, image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0 },
      { id: 14, room_type: 3, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 1 },
      { id: 15, room_type: 3, image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 2 },
      { id: 16, room_type: 3, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 3 },
      { id: 17, room_type: 3, image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 4 },
      { id: 18, room_type: 3, image_url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 5 },
    ],
  },
  {
    id: 4,
    name: 'Family Garden Suite',
    bed_type: 'Căn Hộ Gia Đình • Penthouse',
    description: 'Hai phòng ngủ liên thông với phòng khách rộng rãi, bếp nhỏ tiện nghi và view sân vườn xanh mát tĩnh lặng.',
    max_occupancy: 5,
    area_sqm: 78,
    images: [
      { id: 19, room_type: 4, image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80', is_primary: true, sort_order: 0 },
      { id: 20, room_type: 4, image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 1 },
      { id: 21, room_type: 4, image_url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 2 },
      { id: 22, room_type: 4, image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 3 },
      { id: 23, room_type: 4, image_url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 4 },
      { id: 24, room_type: 4, image_url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80', is_primary: false, sort_order: 5 },
    ],
  },
];

const DEFAULT_BRANCHES: BranchItem[] = [
  {
    id: 'hn',
    name: 'AH Boutique Hoàn Kiếm',
    city: 'Hà Nội',
    address: '36 Hàng Bè, Phường Hàng Bạc, Quận Hoàn Kiếm',
    description: 'Trung tâm Phố Cổ, cách Hồ Hoàn Kiếm 3 phút đi bộ. Kiến trúc Indochine cổ kính kết hợp quầy bar sân thượng ngắm tháp Rùa.',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    roomsCount: 42,
    rating: '4.9',
  },
  {
    id: 'hcm',
    name: 'AH Signature Sài Gòn',
    city: 'TP. Hồ Chí Minh',
    address: '88 Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    description: 'Tọa lạc tại đại lộ Nguyễn Huệ sầm uất. Không gian hiện đại, co-working space 24/7 và bể bơi vô cực ngắm hoàng hôn.',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    roomsCount: 56,
    rating: '4.9',
  },
  {
    id: 'dn',
    name: 'AH Beachfront Retreat',
    city: 'Đà Nẵng',
    address: '120 Võ Nguyên Giáp, Bãi Biển Mỹ Khê, Quận Sơn Trà',
    description: 'Chỉ 50m ra bãi biển Mỹ Khê. Thiết kế mở đón trọn gió biển, tổ chức tiệc nướng BBQ bãi biển và tour khám phá bán đảo Sơn Trà.',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    roomsCount: 48,
    rating: '4.95',
  },
];

export const HomePage = () => {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roomPrices, setRoomPrices] = useState<RoomPrice[]>([]);

  // Modals state
  const [selectedDetailRoomType, setSelectedDetailRoomType] = useState<RoomType | null>(null);
  const [selectedBookingRoomType, setSelectedBookingRoomType] = useState<RoomType | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Fetch dynamic catalog from API
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [typesRes, branchesRes, pricesRes] = await Promise.all([
          roomsApi.getRoomTypes(),
          branchesApi.getAll(),
          roomsApi.getRoomPrices(),
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

        setRoomTypes(tData);
        setBranches(bData);
        setRoomPrices(pData);
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ:', err);
      }
    };

    fetchCatalog();
  }, []);

  // Helper: get price for a room type
  const getRoomPrice = (typeId: number) => {
    const found = roomPrices.find((p) => p.room_type === typeId && p.rate_type === 'daily');
    if (found) return Number(found.price);

    switch (typeId) {
      case 1:
        return 2450000;
      case 2:
        return 1250000;
      case 3:
        return 320000;
      case 4:
        return 3100000;
      default:
        return 850000;
    }
  };

  // Build RoomCards items synced with RoomType objects for modal display
  const displayRoomItems = useMemo(() => {
    const sourceTypes = roomTypes.length > 0 ? roomTypes.slice(0, 4) : FALLBACK_ROOM_TYPES;

    return sourceTypes.map((type) => {
      const priceDaily = getRoomPrice(type.id);

      const primaryImgObj = type.images?.find((img) => img.is_primary);
      const roomImage =
        primaryImgObj?.image_url ||
        type.images?.[0]?.image_url ||
        ROOM_IMAGES[type.name] ||
        DEFAULT_ROOM_IMAGE;

      const roomItem: RoomItem = {
        id: type.id,
        name: type.name,
        category: type.bed_type || 'Boutique Stay',
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

      return { roomItem, originalType: type };
    });
  }, [roomTypes, roomPrices]);

  // Map branches for QuickSearchBar
  const branchOptions: QuickBranchOption[] = useMemo(() => {
    if (branches.length > 0) {
      return [
        { id: 'all', label: `Tất cả chi nhánh (${branches.length} cơ sở)` },
        ...branches.map((b) => ({
          id: String(b.id),
          label: `${b.name} (${b.province || b.code})`,
        })),
      ];
    }
    return [
      { id: 'all', label: 'Tất cả chi nhánh' },
      { id: '1', label: 'AH Boutique Hoàn Kiếm (Hà Nội)' },
      { id: '2', label: 'AH Signature Sài Gòn (Quận 1)' },
      { id: '3', label: 'AH Beachfront Retreat (Đà Nẵng)' },
    ];
  }, [branches]);

  // Display branches for grid
  const displayBranches: BranchItem[] = useMemo(() => {
    if (branches.length > 0) {
      return branches.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.province || b.district || 'Việt Nam',
        address: b.address,
        description: `Chi nhánh ${b.name} tọa lạc tại vị trí đắc địa ${b.address}. Tiện nghi chuẩn boutique cao cấp.`,
        image: b.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        roomsCount: b.total_floors ? b.total_floors * 10 : 40,
        rating: '4.95',
      }));
    }
    return DEFAULT_BRANCHES;
  }, [branches]);

  const handleOpenBooking = (type: RoomType) => {
    setSelectedBookingRoomType(type);
    setIsBookingModalOpen(true);
  };

  const services = [
    {
      icon: Wine,
      title: 'Rooftop Lounge & Cafe',
      desc: 'Thưởng thức cocktail thủ công & cafe hảo hạng cùng âm nhạc Acoustic lãng mạn ngắm hoàng hôn thành phố.',
    },
    {
      icon: Utensils,
      title: 'Ẩm Thực Tinh Hoa Á - Âu',
      desc: 'Bữa sáng buffet thịnh soạn chuẩn 5 sao với nguyên liệu hữu cơ tươi ngon mỗi sớm.',
    },
    {
      icon: Wifi,
      title: 'Internet Tốc Độ Cao 500Mbps',
      desc: 'Hệ thống cáp quang mesh chuyên dụng, hoàn hảo cho làm việc từ xa, họp video call và giải trí.',
    },
    {
      icon: Car,
      title: 'Đưa Đón Sân Bay Riêng',
      desc: 'Đội xe Limousine sang trọng đưa đón tận nơi chu đáo, an toàn và đúng giờ.',
    },
    {
      icon: ShieldCheck,
      title: 'An Ninh & Lễ Tân 24/7',
      desc: 'Đội ngũ hỗ trợ chuyên nghiệp, kiểm soát thẻ từ thông minh và hỗ trợ thủ tục nhận phòng linh hoạt.',
    },
    {
      icon: Clock,
      title: 'Giặt Sấy Lấy Nhanh Trong Ngày',
      desc: 'Dịch vụ giặt là công nghệ hơi nước cao cấp, giúp trang phục của quý khách luôn phẳng phiu.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F7F5F0] text-stone-900 font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-stone-950 text-white">
        {/* Background Image with Deep Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('/images/hotel_lobby.jpg')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/75 to-stone-950/80 backdrop-blur-[1.5px]" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CHUỖI LƯU TRÚ BOUTIQUE CAO CẤP HÀNG ĐẦU</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.15] max-w-4xl mb-6">
            Nơi Tận Hưởng Kỳ Nghỉ <span className="italic text-amber-300 font-normal">Tinh Tế</span> & Kết Nối Bạn Bè
          </h1>

          <p className="text-stone-300 text-base sm:text-lg md:text-xl font-light max-w-2xl leading-relaxed mb-12">
            Không gian nghỉ dưỡng sang trọng kết hợp phòng ký túc xá capsule cao cấp,
            mang đến hành trình trải nghiệm bản địa khó quên tại Việt Nam.
          </p>

          {/* REUSABLE QUICK SEARCH / BOOKING BAR */}
          <QuickSearchBar branches={branchOptions} className="w-full max-w-5xl" />

          {/* Fast perks below hero */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-stone-300 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Giá tốt nhất trực tiếp trên website
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Miễn phí hủy phòng trước 24h
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              Giảm thêm 10% cho thành viên
            </span>
          </div>
        </div>
      </section>

      {/* ROOMS SHOWCASE SECTION */}
      <section id="rooms" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">
              <Award className="w-4 h-4" />
              Không Gian Lưu Trú
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
              Bộ Sưu Tập Phòng & Khoang Ngủ
            </h2>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:items-end gap-2">
            <p className="text-stone-500 text-sm max-w-md leading-relaxed font-light">
              Từ những phòng Suite sang trọng ngắm nhìn phố phường đến khoang ngủ Pod riêng tư ấm áp,
              chúng tôi có không gian lý tưởng cho mọi phong cách du lịch.
            </p>
            <Link
              to="/rooms"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-700 uppercase tracking-wider group/link"
            >
              <span>Khám phá toàn bộ phòng</span>
              <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* REUSABLE ROOM CARDS GRID - 100% UNIFIED WITH PUBLICROOMSPAGE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayRoomItems.map(({ roomItem, originalType }) => (
            <RoomCard
              key={roomItem.id}
              room={roomItem}
              onViewDetail={() => setSelectedDetailRoomType(originalType)}
              onBook={() => handleOpenBooking(originalType)}
            />
          ))}
        </div>
      </section>

      {/* BRANCHES PREVIEW SECTION */}
      <section id="branches" className="py-20 bg-[#EDE9E1] border-y border-[#E2DDD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
              Vị Trí Vàng
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1 mb-3">
              Mạng Lưới Chi Nhánh Khách Sạn
            </h2>
            <p className="text-stone-600 text-sm font-light">
              Tọa lạc tại những vị trí đắc địa nhất của các thủ phủ du lịch: gần các di tích lịch sử,
              bãi biển thơ mộng và các phố ẩm thực nhộn nhịp.
            </p>
          </div>

          {/* REUSABLE BRANCH CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {displayBranches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700">
            Dịch Vụ Đi Kèm
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1 mb-3">
            Tiện Nghi & Dịch Vụ Đẳng Cấp
          </h2>
          <p className="text-stone-500 text-sm font-light">
            Chúng tôi chăm chút từng trải nghiệm nhỏ nhất để quý khách có một kỳ lưu trú trọn vẹn và thư thái.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white border border-[#E8E2D7] shadow-xs hover:shadow-lg hover:border-amber-400/60 transition-all duration-300 flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#FAF4EA] border border-amber-300/40 flex items-center justify-center text-amber-800 mb-6">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-stone-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden bg-stone-950 text-white p-8 sm:p-14 text-center">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{
              backgroundImage: `url('/images/hotel_lobby.jpg')`,
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-4">
              Sẵn Sàng Cho Chuyến Đi Tuyệt Vời Của Bạn?
            </h2>
            <p className="text-stone-300 text-sm font-light leading-relaxed mb-8">
              Đăng ký tài khoản hoặc đặt phòng ngay hôm nay để nhận ưu đãi đặc biệt 10% và trải nghiệm sự hiếu khách chuẩn mực của AH Hotel.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="px-8 py-3.5 rounded-full bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg"
              >
                Đăng Ký Thành Viên Ngay
              </Link>
              <Link
                to="/branches"
                className="px-8 py-3.5 rounded-full border border-white/30 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
              >
                Khám Phá Chi Nhánh
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ROOM DETAIL MODAL (1 BIG COVER IMAGE + 5 DETAIL GALLERY THUMBNAILS) */}
      <RoomDetailModal
        isOpen={!!selectedDetailRoomType}
        onClose={() => setSelectedDetailRoomType(null)}
        roomType={selectedDetailRoomType}
        priceDaily={selectedDetailRoomType ? getRoomPrice(selectedDetailRoomType.id) : undefined}
        onBookNow={(type) => {
          setSelectedDetailRoomType(null);
          handleOpenBooking(type);
        }}
      />

      {/* PUBLIC ONLINE BOOKING MODAL */}
      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedRoomType={selectedBookingRoomType}
        branches={branches}
        roomPrices={roomPrices}
      />
    </div>
  );
};
