import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Bed, Eye, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export interface RoomItem {
  id: number | string;
  name: string;
  category?: string;
  description?: string;
  price: string | number;
  period?: string;
  capacity?: string;
  size?: string;
  area?: string;
  image: string;
  amenities?: string[];
  rating?: string | number;
  reviews?: number;
}

export interface RoomCardProps {
  room: RoomItem;
  onBook?: (room: RoomItem) => void;
  onViewDetail?: (room: RoomItem) => void;
  bookLink?: string;
  detailLink?: string;
  bookLabel?: string;
  detailLabel?: string;
  showFreeCancellation?: boolean;
  className?: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onBook,
  onViewDetail,
  bookLink = '/rooms',
  detailLink = '/rooms',
  bookLabel = 'Đặt Ngay',
  detailLabel = 'Chi tiết',
  showFreeCancellation = true,
  className = '',
}) => {
  const handleBookClick = (e: React.MouseEvent) => {
    if (onBook) {
      e.preventDefault();
      onBook(room);
    }
  };

  const handleDetailClick = (e: React.MouseEvent) => {
    if (onViewDetail) {
      e.preventDefault();
      onViewDetail(room);
    }
  };

  // Format price
  const formattedPrice =
    typeof room.price === 'number'
      ? `${room.price.toLocaleString('vi-VN')} đ`
      : room.price.includes('đ')
      ? room.price
      : `${room.price} đ`;

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden border border-[#E3DDD2] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group ${className}`}
    >
      {/* 1. KHUNG ẢNH ĐẠI DIỆN ROOM CARD */}
      <div
        onClick={handleDetailClick}
        className="relative aspect-4/3 overflow-hidden bg-stone-100 cursor-pointer"
      >
        <img
          src={room.image}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Category tag */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-xs">
          {room.category || 'Boutique Stay'}
        </div>

        {/* Rating badge */}
        {/* <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-900 text-xs font-bold shadow-xs">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>{room.rating || '4.96'}</span>
          {room.reviews ? (
            <span className="text-[10px] text-stone-400 font-normal">({room.reviews})</span>
          ) : null}
        </div> */}

        {/* Hover overlay: Xem chi tiết */}
        <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-stone-900 text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5 text-amber-700" />
            <span>Xem chi tiết 6 ảnh</span>
          </span>
        </div>
      </div>

      {/* 2. NỘI DUNG THÔNG TIN PHÒNG */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3
            onClick={handleDetailClick}
            className="font-serif text-lg font-bold text-stone-900 mb-1.5 transition-colors line-clamp-1 cursor-pointer hover:text-amber-900"
          >
            {room.name}
          </h3>

          <p className="text-xs text-stone-500 font-light leading-relaxed line-clamp-2 mb-4">
            {room.description ||
              'Thiết kế kiến trúc thanh lịch với không gian ánh sáng tự nhiên ngập tràn, nội thất cao cấp và đệm êm ái.'}
          </p>

          {/* Thông số phòng: Sức chứa, Loại giường, Diện tích */}
          <div className="space-y-1.5 mb-4 pb-4 border-b border-stone-100 text-xs text-stone-600">
            {room.capacity && (
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{room.capacity}</span>
              </div>
            )}
            {room.size && (
              <div className="flex items-center gap-2">
                <Bed className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>{room.size}</span>
              </div>
            )}
            {room.area && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Diện tích: {room.area}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. BẢNG GIÁ & NÚT THAO TÁC ĐỒNG BỘ */}
        <div>
          {showFreeCancellation && (
            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mb-2">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>Miễn phí hủy trước 24h</span>
            </div>
          )}

          <div className="flex items-baseline justify-between mb-3.5">
            <div>
              <span className="text-[10px] text-stone-400 font-medium uppercase tracking-wider block">
                Giá chỉ từ
              </span>
              <p className="font-serif text-xl font-bold text-amber-900 leading-tight">
                {formattedPrice}{' '}
                <span className="text-xs font-normal text-stone-500">
                  /{room.period || 'đêm'}
                </span>
              </p>
            </div>
          </div>

          {/* Cặp nút bấm chuẩn đồng bộ trên cả Home và trang Rooms */}
          <div className="flex items-center gap-2">
            {onViewDetail ? (
              <button
                type="button"
                onClick={handleDetailClick}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-900 bg-stone-50 hover:bg-amber-50/50 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
                title="Xem ảnh chi tiết & tiện nghi"
              >
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                <span>{detailLabel}</span>
              </button>
            ) : (
              <Link
                to={detailLink}
                className="px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:border-amber-400 hover:text-amber-900 bg-stone-50 hover:bg-amber-50/50 font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs shrink-0"
                title="Xem ảnh chi tiết & tiện nghi"
              >
                <Eye className="w-3.5 h-3.5 text-amber-700" />
                <span>{detailLabel}</span>
              </Link>
            )}

            {onBook ? (
              <button
                type="button"
                onClick={handleBookClick}
                className="flex-1 py-2.5 rounded-xl bg-stone-950 text-amber-300 hover:bg-amber-400 hover:text-stone-950 active:scale-[0.98] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer group/btn"
              >
                <span>{bookLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            ) : (
              <Link
                to={bookLink}
                className="flex-1 py-2.5 rounded-xl bg-stone-950 text-amber-300 hover:bg-amber-400 hover:text-stone-950 active:scale-[0.98] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs group/btn"
              >
                <span>{bookLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
