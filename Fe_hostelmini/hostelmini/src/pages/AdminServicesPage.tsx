import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils,
  Shirt,
  HeartHandshake,
  Car,
  BedDouble,
  MoreHorizontal,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  X,
} from 'lucide-react';
import { bookingsApi, branchesApi } from '../api';
import type { Service, Branch, ServiceCategory } from '../types';
import { ServiceModal } from '../components/modals';

const CATEGORY_MAP: Record<
  ServiceCategory,
  { label: string; icon: React.FC<{ className?: string }>; colorClass: string; bgClass: string }
> = {
  food_beverage: {
    label: 'Ẩm thực & Đồ uống',
    icon: Utensils,
    colorClass: 'text-amber-700 border-amber-300',
    bgClass: 'bg-amber-50',
  },
  laundry: {
    label: 'Giặt là & Giặt sấy',
    icon: Shirt,
    colorClass: 'text-sky-700 border-sky-300',
    bgClass: 'bg-sky-50',
  },
  spa_wellness: {
    label: 'Spa & Trị liệu',
    icon: HeartHandshake,
    colorClass: 'text-emerald-700 border-emerald-300',
    bgClass: 'bg-emerald-50',
  },
  transport: {
    label: 'Xe đưa đón & Di chuyển',
    icon: Car,
    colorClass: 'text-purple-700 border-purple-300',
    bgClass: 'bg-purple-50',
  },
  room_amenities: {
    label: 'Tiện ích buồng phòng',
    icon: BedDouble,
    colorClass: 'text-rose-700 border-rose-300',
    bgClass: 'bg-rose-50',
  },
  other: {
    label: 'Dịch vụ khác',
    icon: MoreHorizontal,
    colorClass: 'text-stone-700 border-stone-300',
    bgClass: 'bg-stone-100',
  },
};

export const AdminServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [servicesRes, branchesRes] = await Promise.all([
        bookingsApi.getServices(),
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
      setError('Không thể tải danh sách dịch vụ. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handleOpenAddModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      setActionLoadingId(service.id);
      const updatedStatus = !service.is_active;
      const res = await bookingsApi.patchService(service.id, {
        is_active: updatedStatus,
      });

      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: res.data.is_active } : s))
      );
      showNotification(
        updatedStatus
          ? `Đã kích hoạt dịch vụ "${service.name}".`
          : `Đã tạm ngưng dịch vụ "${service.name}".`
      );
    } catch {
      alert('Không thể thay đổi trạng thái dịch vụ.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteService = async (service: Service) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa dịch vụ "${service.name}"? Dịch vụ đã phát sinh giao dịch trong đơn đặt phòng sẽ không thể xóa.`
      )
    ) {
      return;
    }

    try {
      setActionLoadingId(service.id);
      await bookingsApi.deleteService(service.id);
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      showNotification(`Đã xóa thành công dịch vụ "${service.name}".`);
    } catch {
      alert('Không thể xóa dịch vụ này vì đã có đơn đặt phòng hoặc lịch sử hóa đơn sử dụng.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = services.length;
    const food = services.filter((s) => s.category === 'food_beverage').length;
    const laundry = services.filter((s) => s.category === 'laundry').length;
    const spa = services.filter((s) => s.category === 'spa_wellness').length;
    const transport = services.filter((s) => s.category === 'transport').length;
    const activeCount = services.filter((s) => s.is_active).length;

    return { total, food, laundry, spa, transport, activeCount };
  }, [services]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Category filter
      if (selectedCategory !== 'all' && s.category !== selectedCategory) {
        return false;
      }

      // Branch filter
      if (selectedBranchId !== 'all') {
        if (s.branch && String(s.branch) !== selectedBranchId) {
          return false;
        }
      }

      // Status filter
      if (selectedStatus === 'active' && !s.is_active) return false;
      if (selectedStatus === 'inactive' && s.is_active) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchName = s.name.toLowerCase().includes(term);
        const matchDesc = s.description?.toLowerCase().includes(term);
        const matchUnit = s.unit.toLowerCase().includes(term);
        if (!matchName && !matchDesc && !matchUnit) return false;
      }

      return true;
    });
  }, [services, selectedCategory, selectedBranchId, selectedStatus, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Quản lý Dịch vụ & Menu Tiện ích
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
            Thiết lập danh mục đồ ăn, thức uống, giặt sấy, spa trị liệu và xe đưa đón phục vụ khách lưu trú.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 transition-all cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4 text-amber-300" />
          <span>Thêm dịch vụ mới</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium text-emerald-800 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="p-1 hover:text-emerald-950">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-[#E3DDD2] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Tổng dịch vụ</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-2">{metrics.total}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">{metrics.activeCount} đang phục vụ</p>
        </div>

        <div className="rounded-2xl border border-[#E3DDD2] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Ẩm thực tại phòng</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-800">
              <Utensils className="h-4 w-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-2">{metrics.food}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Món ăn & Đồ uống</p>
        </div>

        <div className="rounded-2xl border border-[#E3DDD2] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Giặt sấy & Hấp</span>
            <span className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <Shirt className="h-4 w-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-2">{metrics.laundry}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Chăm sóc trang phục</p>
        </div>

        <div className="rounded-2xl border border-[#E3DDD2] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Spa & Trị liệu</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <HeartHandshake className="h-4 w-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-2">{metrics.spa}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Sức khỏe & Thư giãn</p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-[#E3DDD2] bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Xe đưa đón</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
              <Car className="h-4 w-4" />
            </span>
          </div>
          <p className="font-serif text-2xl font-bold text-stone-900 mt-2">{metrics.transport}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">Sân bay & Thuê xe</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-[#E3DDD2] bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên dịch vụ, món ăn..."
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 pl-10 pr-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-800 focus:border-amber-600 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả danh mục dịch vụ</option>
              <option value="food_beverage">Ẩm thực & Đồ uống</option>
              <option value="laundry">Giặt là & Giặt sấy</option>
              <option value="spa_wellness">Spa & Trị liệu</option>
              <option value="transport">Xe đưa đón & Di chuyển</option>
              <option value="room_amenities">Tiện ích buồng phòng</option>
              <option value="other">Dịch vụ khác</option>
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-800 focus:border-amber-600 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả chi nhánh áp dụng</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50/60 px-3.5 py-2.5 text-xs text-stone-800 focus:border-amber-600 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang phục vụ / Mở bán</option>
              <option value="inactive">Tạm ngưng / Hết món</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Services Table */}
      <div className="rounded-3xl border border-[#E3DDD2] bg-white shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-stone-500">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-600 mb-3" />
            <p>Đang tải danh mục dịch vụ...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center text-stone-400">
            <Utensils className="h-10 w-10 mx-auto text-stone-300 mb-2" />
            <p className="text-sm font-medium text-stone-700">Không tìm thấy dịch vụ nào</p>
            <p className="text-xs text-stone-400 mt-1">Thử thay đổi bộ lọc hoặc thêm dịch vụ mới.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#EDE7DD] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-5 py-4">Món / Dịch vụ</th>
                  <th className="px-5 py-4">Phân loại</th>
                  <th className="px-5 py-4">Đơn vị & Đơn giá</th>
                  <th className="px-5 py-4">Chi nhánh</th>
                  <th className="px-5 py-4">Trạng thái</th>
                  <th className="px-5 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-stone-700">
                {filteredServices.map((service) => {
                  const catInfo =
                    CATEGORY_MAP[service.category as ServiceCategory] || CATEGORY_MAP.other;
                  const Icon = catInfo.icon;

                  return (
                    <tr key={service.id} className="hover:bg-[#FCFAF7] transition-colors">
                      {/* Name & Image */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl border border-stone-200 overflow-hidden bg-stone-100 shrink-0">
                            {service.image_url ? (
                              <img
                                src={service.image_url}
                                alt={service.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-amber-700 bg-amber-50">
                                <Icon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-stone-900 truncate">{service.name}</p>
                            {service.description && (
                              <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                                {service.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${catInfo.bgClass} ${catInfo.colorClass}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{service.category_display || catInfo.label}</span>
                        </span>
                      </td>

                      {/* Price & Unit */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-amber-900 text-sm">
                          {Number(service.price).toLocaleString('vi-VN')} đ
                        </div>
                        <span className="text-[11px] text-stone-400">/ {service.unit}</span>
                      </td>

                      {/* Branch */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {service.branch_name ? (
                          <span className="inline-flex items-center gap-1 text-xs text-stone-800 font-medium">
                            <Building2 className="h-3 w-3 text-amber-600" />
                            {service.branch_name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500 italic">Toàn bộ chuỗi</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          disabled={actionLoadingId === service.id}
                          onClick={() => handleToggleStatus(service)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            service.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                          }`}
                          title="Nhấp để bật / tắt trạng thái phục vụ"
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              service.is_active ? 'bg-emerald-500' : 'bg-stone-400'
                            }`}
                          />
                          <span>{service.is_active ? 'Đang phục vụ' : 'Tạm ngưng'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(service)}
                            className="p-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                            title="Chỉnh sửa dịch vụ"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={actionLoadingId === service.id}
                            onClick={() => handleDeleteService(service)}
                            className="p-2 rounded-xl border border-stone-200 text-stone-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                            title="Xóa dịch vụ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SERVICE MODAL */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingService={editingService}
        branches={branches}
        onSuccess={(_service, isNew) => {
          showNotification(
            isNew ? 'Đã thêm dịch vụ mới thành công.' : 'Đã cập nhật dịch vụ thành công.'
          );
          fetchData();
        }}
      />
    </div>
  );
};
