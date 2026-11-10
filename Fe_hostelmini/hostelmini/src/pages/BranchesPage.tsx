import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Layers,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle,
  BedDouble,
  UserCheck,
  ExternalLink,
  X,
  XCircle,
} from 'lucide-react';
import { branchesApi } from '../api';
import type { Branch } from '../types';
import { BranchModal } from '../components/modals';

export const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const navigate = useNavigate();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await branchesApi.getAll();
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBranches(data);
    } catch (err: any) {
      setError('Không thể tải danh sách chi nhánh. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chi nhánh "${branch.name}" (${branch.code})?`)) {
      return;
    }

    try {
      await branchesApi.delete(branch.id);
      setSuccessMsg(`Đã xóa thành công chi nhánh ${branch.name}.`);
      fetchBranches();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Không thể xóa chi nhánh do đã có phòng, nhân viên hoặc giao dịch ràng buộc.');
    }
  };

  const handleViewRoomsInBranch = (branch: Branch) => {
    navigate(`/admin/rooms?branch=${branch.id}`);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = branches.length;
    const active = branches.filter((b) => b.is_active).length;
    const inactive = total - active;
    const totalRooms = branches.reduce((acc, b) => acc + (b.rooms_count || 0), 0);
    const provinces = new Set(branches.map((b) => b.province).filter(Boolean)).size;
    return { total, active, inactive, totalRooms, provinces };
  }, [branches]);

  // Filtered branches
  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (statusFilter === 'active' && !b.is_active) return false;
      if (statusFilter === 'inactive' && b.is_active) return false;

      const term = searchTerm.toLowerCase();
      if (!term.trim()) return true;

      return (
        b.code.toLowerCase().includes(term) ||
        b.name.toLowerCase().includes(term) ||
        (b.province && b.province.toLowerCase().includes(term)) ||
        b.address.toLowerCase().includes(term)
      );
    });
  }, [branches, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Header & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Quản lý Chi nhánh
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
            Hệ thống chuỗi cơ sở lưu trú và điểm phục vụ cao cấp của Aurelia Hostels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-amber-300" />
          <span>Thêm chi nhánh</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Tổng chi nhánh</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">{metrics.total}</span>
            <span className="text-xs text-stone-400 font-light">cơ sở</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 uppercase tracking-wider">Đang hoạt động</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-900">{metrics.active}</span>
            <span className="text-xs text-emerald-700/70 font-light">mở cửa</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">Tổng số phòng</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <BedDouble className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-amber-900">{metrics.totalRooms}</span>
            <span className="text-xs text-amber-700/70 font-light">phòng lưu trú</span>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200/90 bg-blue-50/30 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 uppercase tracking-wider">Tỉnh / Thành phố</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-blue-900">{metrics.provinces}</span>
            <span className="text-xs text-blue-700/70 font-light">địa phương</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-white p-3.5 border border-[#E3DDD2] shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo mã chi nhánh, tên, quận hoặc địa chỉ..."
            className="w-full rounded-xl bg-[#F8F6F2] py-2 pl-9 pr-4 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 border border-transparent focus:border-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-700 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Tạm dừng hoạt động</option>
          </select>

          <div className="text-xs font-semibold text-stone-600 whitespace-nowrap px-2">
            Tìm thấy: <span className="text-amber-900 font-bold">{filteredBranches.length}</span> chi nhánh
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
            <span className="text-xs font-medium text-stone-500">Đang tải dữ liệu chi nhánh...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center text-amber-900">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-800 mb-2" />
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchBranches}
            className="mt-3 text-xs font-bold text-stone-900 underline"
          >
            Thử lại
          </button>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF6EE] text-amber-800 mb-3 border border-[#EBE1D0]">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">Không tìm thấy chi nhánh nào</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto font-light">
            {searchTerm ? 'Không tìm thấy chi nhánh phù hợp với từ khóa.' : 'Bắt đầu bằng cách bấm "Thêm chi nhánh" để tạo cơ sở đầu tiên.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="flex flex-col justify-between rounded-3xl border border-[#E3DDD2] bg-white p-5 shadow-xs hover:shadow-xl transition-all duration-300 group overflow-hidden"
            >
              <div>
                {/* ẢNH ĐẠI DIỆN BOX CHI NHÁNH */}
                <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-stone-900 mb-4 border border-stone-200/80 shadow-2xs">
                  <img
                    src={branch.image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'}
                    alt={branch.name}
                    className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="rounded-lg bg-stone-950/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-amber-300 tracking-wider shadow-xs">
                      {branch.code}
                    </span>
                    {branch.is_active ? (
                      <span className="flex items-center gap-1 rounded-md bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <CheckCircle className="h-3 w-3" /> Hoạt động
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-md bg-stone-800/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-stone-200 shadow-xs">
                        <XCircle className="h-3 w-3 text-rose-400" /> Tạm dừng
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5">
                    <span className="flex items-center gap-1 rounded-md bg-stone-950/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-amber-200 shadow-xs">
                      <BedDouble className="h-3 w-3 text-amber-400" />
                      {branch.rooms_count ?? 0} phòng
                    </span>
                    {branch.total_floors && (
                      <span className="flex items-center gap-1 rounded-md bg-stone-950/85 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-stone-200 shadow-xs">
                        <Layers className="h-3 w-3 text-amber-400" />
                        {branch.total_floors} tầng
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-1">
                  {branch.name}
                </h3>

                {/* Details */}
                <div className="mt-4 space-y-2 text-xs text-stone-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                    <span className="line-clamp-2">
                      {branch.address}
                      {branch.district ? `, ${branch.district}` : ''}
                      {branch.province ? `, ${branch.province}` : ''}
                    </span>
                  </div>

                  {branch.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-4 w-4 shrink-0 text-amber-700" />
                      <span>{branch.phone}</span>
                    </div>
                  )}

                  {branch.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-4 w-4 shrink-0 text-amber-700" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}

                  {/* Manager Name */}
                  <div className="flex items-center gap-2.5 pt-1 text-stone-500">
                    <UserCheck className="h-4 w-4 shrink-0 text-blue-600" />
                    <span>Quản lý: <strong className="text-stone-800 font-semibold">{branch.manager_name || 'Chưa phân công'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-5 flex items-center justify-between border-t border-[#F0ECE4] pt-3.5">
                <button
                  type="button"
                  onClick={() => handleViewRoomsInBranch(branch)}
                  className="flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700 cursor-pointer"
                  title="Xem phòng tại chi nhánh này"
                >
                  <span>Sơ đồ phòng</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(branch)}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBranch(branch)}
                    className="flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa Chi nhánh */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBranch={editingBranch}
        onSuccess={fetchBranches}
      />
    </div>
  );
};
