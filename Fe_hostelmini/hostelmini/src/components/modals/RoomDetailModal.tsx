import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  Users,
  Bed,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Coffee,
  Tv,
  Shield,
  Bath,
  Wind,
} from 'lucide-react';
import type { RoomType } from '../../types';

export interface RoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: RoomType | null;
  priceDaily?: number;
  onBookNow: (roomType: RoomType) => void;
}

// Fallback high-quality images if not seeded
const FALLBACK_GALLERY = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
];

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  isOpen,
  onClose,
  roomType,
  priceDaily = 850000,
  onBookNow,
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Prepare images: Primary image + 5 detail gallery images
  const allImages = React.useMemo(() => {
    if (!roomType) return FALLBACK_GALLERY;

    const list: string[] = [];
    if (roomType.images && roomType.images.length > 0) {
      // Sort: primary first, then by sort_order
      const sorted = [...roomType.images].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      });
      sorted.forEach((img) => {
        if (img.image_url) list.push(img.image_url);
      });
    }

    // If less than 6 images, supplement from fallbacks so user always has 1 main + 5 gallery photos
    if (list.length < 6) {
      for (let i = list.length; i < 6; i++) {
        list.push(FALLBACK_GALLERY[i % FALLBACK_GALLERY.length]);
      }
    }

    return list;
  }, [roomType]);

  useEffect(() => {
    if (isOpen) {
      setActiveImageIndex(0);
    }
  }, [isOpen, roomType]);

  if (!isOpen || !roomType) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-stone-200/90 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-[11px] font-bold uppercase tracking-wider border border-amber-300">
              {roomType.bed_type || 'Boutique Stay'}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span className="text-stone-800">4.96 (148 đánh giá)</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200/70 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="overflow-y-auto p-5 sm:p-6 lg:p-8 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* LEFT: 1 BIG PHOTO + 5 SMALL THUMBNAILS GALLERY */}
            <div className="lg:col-span-7 flex flex-col space-y-3">
              {/* 1 Big Featured Image */}
              <div className="relative aspect-16/10 rounded-2xl overflow-hidden bg-stone-100 shadow-md group">
                <img
                  src={allImages[activeImageIndex]}
                  alt={`Phòng ${roomType.name} - Ảnh ${activeImageIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                />

                {/* Tag Primary / Detail */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                  {activeImageIndex === 0 ? 'Ảnh đại diện chính' : `Ảnh chi tiết ${activeImageIndex}`}
                </div>

                {/* Indicator badge */}
                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-900 text-xs font-bold shadow-xs">
                  {activeImageIndex + 1} / {allImages.length}
                </div>

                {/* Prev / Next navigation buttons */}
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-stone-900 shadow-md transition-all cursor-pointer hover:scale-110"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-stone-900 shadow-md transition-all cursor-pointer hover:scale-110"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 5 Small Thumbnails Gallery Strip */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
                  Bộ sưu tập chi tiết (Nhấn vào để xem ảnh phóng to):
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {allImages.slice(0, 6).map((imgUrl, idx) => {
                    const isSelected = activeImageIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${isSelected
                            ? 'border-amber-500 ring-2 ring-amber-500/40 scale-105 shadow-md'
                            : 'border-stone-200 opacity-70 hover:opacity-100 hover:border-amber-300'
                          }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute bottom-0 inset-x-0 bg-stone-950/80 text-[8px] text-amber-300 text-center font-bold uppercase py-0.5">
                            Bìa
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: ROOM DETAILS & BOOKING SPECS */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                  {roomType.name}
                </h2>

                <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed mb-6">
                  {roomType.description ||
                    'Không gian nghỉ dưỡng được thiết kế theo phong cách Indochine hoài niệm kết hợp công nghệ tiện nghi hiện đại. Đem lại sự riêng tư, thư thái tuyệt đối cho quý khách.'}
                </p>

                {/* Key specs */}
                <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs text-stone-700">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">Sức chứa</span>
                      <strong className="text-stone-900">{roomType.max_occupancy} khách</strong>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center gap-2">
                    <Bed className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">Loại giường</span>
                      <strong className="text-stone-900">{roomType.bed_type || 'King Size'}</strong>
                    </div>
                  </div>

                  {roomType.area_sqm && (
                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                      <div>
                        <span className="text-[10px] text-stone-400 block font-medium">Diện tích phòng</span>
                        <strong className="text-stone-900">{roomType.area_sqm} m²</strong>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-[10px] text-stone-400 block font-medium">Chính sách hủy</span>
                      <strong className="text-emerald-800">Miễn phí trước 24h</strong>
                    </div>
                  </div>
                </div>

                {/* Included Amenities */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    Tiện nghi phòng & Dịch vụ đi kèm
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                    <span className="flex items-center gap-2">
                      <Wifi className="w-3.5 h-3.5 text-amber-700" /> Wifi mesh 500Mbps
                    </span>
                    <span className="flex items-center gap-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-700" /> Buffet sáng & Cafe
                    </span>
                    <span className="flex items-center gap-2">
                      <Tv className="w-3.5 h-3.5 text-amber-700" /> Smart TV 55 inch 4K
                    </span>
                    <span className="flex items-center gap-2">
                      <Bath className="w-3.5 h-3.5 text-amber-700" /> Bồn tắm cẩm thạch
                    </span>
                    <span className="flex items-center gap-2">
                      <Wind className="w-3.5 h-3.5 text-amber-700" /> Điều hòa lọc bụi mịn
                    </span>
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-700" /> Két sắt an toàn
                    </span>
                  </div>
                </div>
              </div>

              {/* Price & Action Button */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-[11px] text-stone-400 font-medium block">Giá phòng trực tiếp</span>
                    <p className="font-serif text-2xl font-bold text-amber-900 leading-tight">
                      {priceDaily.toLocaleString('vi-VN')} đ{' '}
                      <span className="text-xs font-normal text-stone-500">/ đêm</span>
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Đã gồm thuế & phí
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBookNow(roomType);
                  }}
                  className="w-full py-3.5 rounded-xl bg-stone-950 text-amber-300 hover:bg-amber-400 hover:text-stone-950 active:scale-[0.98] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-xl cursor-pointer group/btn"
                >
                  <span>Đặt Phòng Này Ngay</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
