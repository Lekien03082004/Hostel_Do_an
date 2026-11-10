import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, MessageSquare } from 'lucide-react';

export const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-[#141312] text-stone-400 border-t border-[#262320] pt-16 pb-12 text-xs font-light mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* Col 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="AH Hotel Logo"
              className="w-12 h-12 rounded-full border border-amber-400/60 object-cover shadow-lg"
            />
            <div>
              <span className="font-serif font-bold text-base text-amber-200 uppercase tracking-wider block">
                AH Hotel
              </span>
              <span className="text-[10px] tracking-widest text-stone-400 uppercase font-medium">
                Hospitality & Stays
              </span>
            </div>
          </div>
          <p className="text-stone-400 text-xs leading-relaxed">
            Hệ thống khách sạn và hostel nghỉ dưỡng boutique cao cấp hàng đầu Việt Nam. Tận hưởng không gian sang trọng và kết nối cộng đồng văn hóa.
          </p>
        </div>

        {/* Col 2: Navigation */}
        <div>
          <h4 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-4">
            Khám Phá
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/" className="hover:text-amber-300 transition-colors">
                Trang Chủ (Home)
              </Link>
            </li>
            <li>
              <Link to="/rooms" className="hover:text-amber-300 transition-colors">
                Phòng & Khoang Ngủ (Rooms)
              </Link>
            </li>
            <li>
              <Link to="/branches" className="hover:text-amber-300 transition-colors">
                Danh Sách Chi Nhánh (Branches)
              </Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-amber-300 transition-colors">
                Dịch Vụ & Tiện Ích (Services)
              </Link>
            </li>
            <li>
              <Link to="/profile" className="hover:text-amber-300 transition-colors">
                Tra Cứu Phòng Đã Đặt (My Bookings)
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-amber-300 transition-colors">
                Đăng Nhập Quản Trị
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 3: Branches */}
        <div>
          <h4 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-4">
            Chi Nhánh Nổi Bật
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link to="/branches" className="hover:text-amber-300 transition-colors block">
                AH Boutique Hoàn Kiếm • Hà Nội
              </Link>
            </li>
            <li>
              <Link to="/branches" className="hover:text-amber-300 transition-colors block">
                AH Signature Sài Gòn • TP. HCM
              </Link>
            </li>
            <li>
              <Link to="/branches" className="hover:text-amber-300 transition-colors block">
                AH Beachfront Retreat • Đà Nẵng
              </Link>
            </li>
            <li>
              <Link to="/branches" className="hover:text-amber-300 transition-colors block">
                Chi nhánh Gia Ngư • Hà Nội
              </Link>
            </li>
          </ul>
        </div>

        {/* Col 4: Contact */}
        <div>
          <h4 className="font-serif font-bold text-white uppercase text-xs tracking-wider mb-4">
            Liên Hệ 24/7
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Hotline: <strong className="text-white font-bold">1900 6886</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>contact@ahhotel.com</span>
            </li>
            <li className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Zalo / WhatsApp: (+84) 988 888 888</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>Trụ sở: 36 Hàng Bè, Hoàn Kiếm, Hà Nội</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-500 gap-4">
        <p>© 2026 AH Hotel & Hospitality Group. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span className="hover:text-stone-300 cursor-pointer">Điều khoản sử dụng</span>
          <span className="hover:text-stone-300 cursor-pointer">Chính sách bảo mật</span>
          <span className="hover:text-stone-300 cursor-pointer">Quy định đặt phòng</span>
        </div>
      </div>
    </footer>
  );
};