import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import apiClient from '../api/client';
import type { Branch } from '../types';
import { Modal } from '../components/common/Modal';

export const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    ward: '',
    district: '',
    province: '',
    phone: '',
    email: '',
    total_floors: '',
    is_active: true,
  });

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiClient.get<Branch[]>('/branches/');
      // Handling DRF pagination if present or direct array
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setBranches(data);
    } catch (err: any) {
      setError('Không thể tải danh sách chi nhánh. Vui lòng kiểm tra backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormData({
      code: '',
      name: '',
      address: '',
      ward: '',
      district: '',
      province: '',
      phone: '',
      email: '',
      total_floors: '',
      is_active: true,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      code: branch.code,
      name: branch.name,
      address: branch.address,
      ward: branch.ward || '',
      district: branch.district || '',
      province: branch.province || '',
      phone: branch.phone || '',
      email: branch.email || '',
      total_floors: branch.total_floors ? String(branch.total_floors) : '',
      is_active: branch.is_active,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!formData.code.trim() || !formData.name.trim() || !formData.address.trim()) {
      setModalError('Mã chi nhánh, Tên chi nhánh và Địa chỉ là các trường bắt buộc.');
      return;
    }

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      address: formData.address.trim(),
      ward: formData.ward.trim() || null,
      district: formData.district.trim() || null,
      province: formData.province.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      total_floors: formData.total_floors ? parseInt(formData.total_floors, 10) : null,
      is_active: formData.is_active,
    };

    try {
      setSubmitting(true);
      if (editingBranch) {
        await apiClient.put(`/branches/${editingBranch.id}/`, payload);
      } else {
        await apiClient.post('/branches/', payload);
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (err: any) {
      if (err.response?.data?.code) {
        setModalError(`Mã chi nhánh: ${err.response.data.code[0]}`);
      } else if (err.response?.data?.detail) {
        setModalError(err.response.data.detail);
      } else {
        setModalError('Lỗi khi lưu chi nhánh. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBranch = async (branch: Branch) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa chi nhánh "${branch.name}" (${branch.code})?`)) {
      return;
    }

    try {
      await apiClient.delete(`/branches/${branch.id}/`);
      fetchBranches();
    } catch (err: any) {
      alert('Không thể xóa chi nhánh do đã có phòng, nhân viên hoặc giao dịch ràng buộc.');
    }
  };

  const filteredBranches = branches.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      b.code.toLowerCase().includes(term) ||
      b.name.toLowerCase().includes(term) ||
      (b.province && b.province.toLowerCase().includes(term)) ||
      b.address.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-indigo-600" />
            <span>Quản lý Chi nhánh</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Quản lý các cơ sở thuộc chuỗi khách sạn / hostel mini
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Thêm chi nhánh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3 border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã chi nhánh, tên hoặc địa chỉ..."
            className="w-full rounded-xl bg-slate-50 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500 whitespace-nowrap px-2">
          Tổng: <span className="text-indigo-600 font-bold">{filteredBranches.length}</span> chi nhánh
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <span className="text-xs font-medium text-slate-500">Đang tải danh sách chi nhánh...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600 mb-2" />
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={fetchBranches}
            className="mt-3 text-xs font-bold text-indigo-600 underline"
          >
            Thử lại
          </button>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
            <Building2 className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Chưa có chi nhánh nào</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'Không tìm thấy chi nhánh phù hợp với từ khóa.' : 'Bắt đầu bằng cách bấm "Thêm chi nhánh" để tạo cơ sở đầu tiên.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all group"
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-black text-indigo-700 tracking-wider">
                      {branch.code}
                    </span>
                    {branch.is_active ? (
                      <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-200">
                        <CheckCircle className="h-3 w-3" /> Hoạt động
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                        Tạm dừng
                      </span>
                    )}
                  </div>

                  {branch.total_floors && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Layers className="h-3.5 w-3.5" />
                      {branch.total_floors} tầng
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {branch.name}
                </h3>

                {/* Details */}
                <div className="mt-3.5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                    <span className="line-clamp-2">
                      {branch.address}
                      {branch.district ? `, ${branch.district}` : ''}
                      {branch.province ? `, ${branch.province}` : ''}
                    </span>
                  </div>

                  {branch.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{branch.phone}</span>
                    </div>
                  )}

                  {branch.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate">{branch.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3.5">
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(branch)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteBranch(branch)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Sửa Chi nhánh */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? `Chỉnh sửa: ${editingBranch.name}` : 'Thêm chi nhánh mới'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {modalError && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mã chi nhánh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="VD: HN01, SG02"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm uppercase focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tên chi nhánh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Chi nhánh Cầu Giấy"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Địa chỉ số nhà, tên đường <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 123 Đường Cầu Giấy"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phường / Xã</label>
              <input
                type="text"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                placeholder="Dịch Vọng"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quận / Huyện</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="Cầu Giấy"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Hà Nội"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0243123456"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="hn01@hostel.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tổng số tầng</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.total_floors}
                onChange={(e) => setFormData({ ...formData, total_floors: e.target.value })}
                placeholder="5"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="is_active" className="text-xs font-bold text-slate-700 cursor-pointer">
              Đang hoạt động (cho phép tạo phòng & nhận khách)
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-60 cursor-pointer"
            >
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{editingBranch ? 'Lưu thay đổi' : 'Thêm chi nhánh'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
