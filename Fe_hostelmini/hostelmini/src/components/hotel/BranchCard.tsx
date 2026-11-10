import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Building2, Phone } from 'lucide-react';

export interface BranchItem {
  id: string | number;
  name: string;
  city?: string;
  address: string;
  description?: string;
  image?: string;
  roomsCount?: number;
  rating?: string | number;
  phone?: string;
  email?: string;
  total_rooms?: number;
  status?: string;
}

export interface BranchCardProps {
  branch: BranchItem;
  onSelect?: (branch: BranchItem) => void;
  actionLink?: string;
  className?: string;
}

export const BranchCard: React.FC<BranchCardProps> = ({
  branch,
  onSelect,
  actionLink = '/branches',
  className = '',
}) => {
  const handleSelectClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(branch);
    }
  };

  const defaultImage =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
  const displayImage = branch.image || defaultImage;
  const availableRooms = branch.roomsCount ?? branch.total_rooms ?? 40;

  return (
    <div
      className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-[#E0D9CC] flex flex-col group ${className}`}
    >
      <div className="relative aspect-16/10 overflow-hidden bg-stone-100">
        <img
          src={displayImage}
          alt={branch.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {branch.city && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-amber-300 text-xs font-bold shadow-xs">
            {branch.city}
          </div>
        )}
        {/* {branch.rating && (
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-stone-900 text-xs font-bold shadow-xs">
            ★ {branch.rating}
          </div>
        )} */}
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900 mb-2 group-hover:text-amber-800 transition-colors">
            {branch.name}
          </h3>

          <p className="text-xs text-amber-900/80 font-medium flex items-start gap-1.5 mb-3">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-700 mt-0.5" />
            <span>{branch.address}</span>
          </p>

          {branch.description && (
            <p className="text-xs text-stone-600 leading-relaxed font-light mb-6 line-clamp-3">
              {branch.description}
            </p>
          )}

          {branch.phone && (
            <p className="text-xs text-stone-500 flex items-center gap-1.5 mb-3">
              <Phone className="w-3 h-3 text-stone-400" />
              <span>{branch.phone}</span>
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-stone-100">
          {onSelect ? (
            <button
              type="button"
              onClick={handleSelectClick}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Xem {availableRooms} phòng khả dụng
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <Link
              to={actionLink}
              className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-600" />
                Xem {availableRooms} phòng khả dụng
              </span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
