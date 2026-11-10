import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Layers,
  BedDouble,
  Search,
  ArrowRight,
  Sparkles,
  Wifi,
  Coffee,
  ShieldCheck,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { branchesApi } from '../api';
import type { Branch } from '../types';

// High quality default cover images per province
const DEFAULT_BRANCH_IMAGES: { [code: string]: string } = {
  HN01: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  SG01: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  DN01: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  HN1: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
};

const GENERIC_COVER =
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80';

export const PublicBranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const res = await branchesApi.getAll();
        const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
        setBranches(data);
      } catch (err) {
        console.error('Lỗi tải danh sách chi nhánh:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // List unique provinces for filter buttons
  const provinces = useMemo(() => {
    const set = new Set<string>();
    branches.forEach((b) => {
      if (b.province) set.add(b.province);
    });
    return Array.from(set);
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (selectedProvince !== 'all' && b.province !== selectedProvince) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = b.name.toLowerCase().includes(query);
        const matchAddress = b.address.toLowerCase().includes(query);
        const matchProvince = b.province?.toLowerCase().includes(query);
        const matchCode = b.code.toLowerCase().includes(query);
        if (!matchName && !matchAddress && !matchProvince && !matchCode) {
          return false;
        }
      }
      return true;
    });
  }, [branches, selectedProvince, searchTerm]);

  // Navigate to rooms page with selected branch
  const handleViewRooms = (branchId: number) => {
    navigate(`/rooms?branch=${branchId}`);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* HERO BANNER SECTION */}
      <section className="relative bg-[#141312] text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#262320] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141312] via-[#141312]/80 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold uppercase tracking-widest mb-5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MẠNG LƯỚI KHÁCH SẠN BOUTIQUE TOÀN QUỐC</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
            Hệ Thống Chi Nhánh & Điểm Lưu Trú
          </h1>

          <p className="text-stone-300 text-sm sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed">
            Mỗi chi nhánh AH Hotel là một không gian nghỉ dưỡng kết hợp giữa nét tinh hoa văn hóa địa phương, kiến trúc Indochine sang trọng và công nghệ tiện nghi hiện đại.
          </p>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-7 sm:-mt-9 relative z-20 w-full">
        <div className="rounded-3xl bg-white p-4 sm:p-5 shadow-xl border border-stone-200/90 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400 h-4 w-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm theo tên chi nhánh, phố, quận hoặc tỉnh thành..."
              className="w-full rounded-2xl bg-[#F8F6F2] py-3 pl-11 pr-4 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 border border-transparent focus:border-stone-400 transition-all"
            />
          </div>

          {/* Province Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto shrink-0 pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setSelectedProvince('all')}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                selectedProvince === 'all'
                  ? 'bg-stone-950 text-amber-300 shadow-xs'
                  : 'bg-[#F2EFE9] text-stone-700 hover:bg-[#EBE7DF]'
              }`}
            >
              Tất cả ({branches.length})
            </button>
            {provinces.map((prov) => (
              <button
                key={prov}
                type="button"
                onClick={() => setSelectedProvince(prov)}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedProvince === 'prov' || selectedProvince === prov
                    ? 'bg-stone-950 text-amber-300 shadow-xs'
                    : 'bg-[#F2EFE9] text-stone-700 hover:bg-[#EBE7DF]'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* BRANCHES LIST SHOWCASE */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#E3DDD2]">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              Danh Sách Các Cơ Sở Phục Vụ
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
              Đầy đủ các tiện ích tiêu chuẩn: Wifi 500Mbps, Bữa sáng buffet, minibar miễn phí và phục vụ 24/7.
            </p>
          </div>
          <div className="text-xs font-semibold text-stone-600 bg-[#EBE7DF] px-3.5 py-1.5 rounded-full border border-stone-300 shrink-0 self-start sm:self-auto">
            Hiện có: <strong className="text-amber-900">{filteredBranches.length}</strong> cơ sở
          </div>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
              <span className="text-xs font-medium text-stone-500">Đang tải danh sách chi nhánh...</span>
            </div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-stone-400 mb-3" />
            <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy chi nhánh phù hợp</h3>
            <p className="mt-1 text-xs text-stone-500 font-light">
              Vui lòng kiểm tra lại từ khóa tìm kiếm hoặc bấm chọn "Tất cả" tỉnh thành.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBranches.map((branch) => {
              const coverImage =
                branch.image_url ||
                DEFAULT_BRANCH_IMAGES[branch.code] ||
                GENERIC_COVER;

              return (
                <div
                  key={branch.id}
                  className="flex flex-col justify-between rounded-3xl border border-[#E3DDD2] bg-white overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1"
                >
                  <div>
                    {/* COVER IMAGE WITH BADGES */}
                    <div className="relative aspect-16/10 w-full overflow-hidden bg-stone-900">
                      <img
                        src={coverImage}
                        alt={branch.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="rounded-lg bg-stone-950/85 backdrop-blur-md px-2.5 py-1 text-xs font-bold text-amber-300 border border-amber-400/30 shadow-md">
                          {branch.code}
                        </span>
                        {branch.province && (
                          <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-xs font-semibold text-stone-200">
                            {branch.province}
                          </span>
                        )}
                      </div>

                      {/* Bottom Info Badges */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 rounded-md bg-stone-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-medium text-amber-200">
                            <BedDouble className="h-3 w-3 text-amber-400" />
                            {branch.rooms_count ?? 0} phòng nghỉ
                          </span>
                          {branch.total_floors && (
                            <span className="flex items-center gap-1 rounded-md bg-stone-950/80 backdrop-blur-md px-2 py-0.5 text-[11px] font-medium text-stone-300">
                              <Layers className="h-3 w-3 text-amber-400" />
                              {branch.total_floors} tầng
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CONTENT DETAILS */}
                    <div className="p-6">
                      <h3 className="font-serif text-xl font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                        {branch.name}
                      </h3>

                      <div className="mt-3.5 space-y-2.5 text-xs text-stone-600">
                        {/* Address */}
                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 shrink-0 text-amber-800 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">
                            {branch.address}
                            {branch.ward ? `, ${branch.ward}` : ''}
                            {branch.district ? `, ${branch.district}` : ''}
                            {branch.province ? `, ${branch.province}` : ''}
                          </span>
                        </div>

                        {/* Phone */}
                        {branch.phone && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="h-4 w-4 shrink-0 text-amber-800" />
                            <a
                              href={`tel:${branch.phone}`}
                              className="font-semibold text-stone-800 hover:text-amber-800 transition-colors"
                            >
                              {branch.phone}
                            </a>
                          </div>
                        )}

                        {/* Email */}
                        {branch.email && (
                          <div className="flex items-center gap-2.5">
                            <Mail className="h-4 w-4 shrink-0 text-amber-800" />
                            <span className="truncate">{branch.email}</span>
                          </div>
                        )}
                      </div>

                      {/* Amenities Pills */}
                      <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap gap-2 text-[11px] text-stone-600">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-stone-200">
                          <Wifi className="h-3 w-3 text-amber-700" /> Wifi 500M
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-stone-200">
                          <Coffee className="h-3 w-3 text-amber-700" /> Buffet sáng
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-stone-200">
                          <ShieldCheck className="h-3 w-3 text-amber-700" /> An ninh 24/7
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="p-6 pt-0">
                    <button
                      type="button"
                      onClick={() => handleViewRooms(branch.id)}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-stone-950 hover:bg-stone-800 text-white px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all shadow-md group/btn cursor-pointer"
                    >
                      <span>Xem phòng tại cơ sở này</span>
                      <ArrowRight className="h-3.5 w-3.5 text-amber-300 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA SUPPORT SECTION */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-stone-950 via-[#221F1B] to-stone-950 text-white p-8 sm:p-12 border border-[#3E3831] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Dịch Vụ Khách Hàng Chu Đáo
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-1 mb-2">
              Bạn Cần Đặt Phòng Cho Đoàn Lớn Hoặc Sự Kiện?
            </h3>
            <p className="text-stone-300 text-xs sm:text-sm font-light max-w-xl leading-relaxed">
              Chúng tôi cung cấp chính sách giá ưu đãi đặc biệt cho đối tác doanh nghiệp, khách đoàn du lịch và tour văn hóa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:19006886"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-all shadow-md"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Hotline 1900 6886</span>
            </a>
            <Link
              to="/rooms"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-stone-600 hover:border-amber-400/60 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/5 transition-all"
            >
              <span>Xem Tất Cả Phòng</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
