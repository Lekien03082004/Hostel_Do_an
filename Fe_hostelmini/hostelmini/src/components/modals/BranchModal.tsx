import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Upload, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { branchesApi } from '../../api';
import type { Branch } from '../../types';

export interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBranch: Branch | null;
  onSuccess: () => void;
}

export const BranchModal: React.FC<BranchModalProps> = ({
  isOpen,
  onClose,
  editingBranch,
  onSuccess,
}) => {
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

  // Ảnh đại diện cho box chi nhánh (Cách 1: tải tệp trực tiếp từ máy tính)
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        code: editingBranch.code,
        name: editingBranch.name,
        address: editingBranch.address,
        ward: editingBranch.ward || '',
        district: editingBranch.district || '',
        province: editingBranch.province || '',
        phone: editingBranch.phone || '',
        email: editingBranch.email || '',
        total_floors: editingBranch.total_floors ? String(editingBranch.total_floors) : '',
        is_active: editingBranch.is_active,
      });
      setImageUrl(editingBranch.image_url || '');
    } else {
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
      setImageUrl('');
    }
    setError('');
  }, [editingBranch, isOpen]);

  // Cách 1: Tải tệp ảnh trực tiếp từ máy tính
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn đúng tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa cho phép là 10MB.');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      const data = new FormData();
      data.append('file', file);

      // Gọi API tải ảnh lên server
      const res = await branchesApi.uploadImage(data);
      setImageUrl(res.data.image_url);
    } catch (err: any) {
      // Fallback xem trước cục bộ nếu mạng/server gián đoạn
      const fallbackUrl = URL.createObjectURL(file);
      setImageUrl(fallbackUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code.trim() || !formData.name.trim() || !formData.address.trim()) {
      setError('Mã chi nhánh, Tên chi nhánh và Địa chỉ là các trường bắt buộc.');
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
      image_url: imageUrl.trim() || null,
      is_active: formData.is_active,
    };

    try {
      setSubmitting(true);
      if (editingBranch) {
        await branchesApi.update(editingBranch.id, payload);
      } else {
        await branchesApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.code) {
        setError(`Mã chi nhánh: ${err.response.data.code[0]}`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Lỗi khi lưu chi nhánh. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBranch ? `Chỉnh sửa: ${editingBranch.name}` : 'Thêm chi nhánh mới'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ẢNH ĐẠI DIỆN BOX CHI NHÁNH (CÁCH 1: BẤM TRỰC TIẾP ĐỂ CHỌN TỆP TỪ MÁY TÍNH) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Ảnh đại diện box chi nhánh <span className="text-amber-700 font-semibold">(Hiển thị trên thẻ box chi nhánh)</span>
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Xóa ảnh
              </button>
            )}
          </div>

          <label
            className={`relative block w-full h-44 sm:h-48 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              imageUrl
                ? 'border-amber-400 bg-stone-900 group shadow-md'
                : 'border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/20'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />

            {isUploading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-stone-50 text-stone-600">
                <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                <span className="text-xs font-bold">Đang tải ảnh chi nhánh từ máy tính...</span>
              </div>
            ) : imageUrl ? (
              <>
                <img
                  src={imageUrl}
                  alt="Ảnh chi nhánh"
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="px-4 py-2 rounded-xl bg-white/95 text-stone-900 text-xs font-bold shadow-md inline-flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-700" />
                    Bấm vào đây để đổi ảnh đại diện từ máy tính
                  </span>
                </div>
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  ★ Ảnh đại diện box chi nhánh
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-800 mb-2 border border-amber-300/60 shadow-2xs">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-stone-800">
                  Bấm chuột vào đây để chọn ảnh đại diện cho box chi nhánh
                </span>
                <span className="text-xs text-stone-500 mt-1">
                  Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 10MB)
                </span>
              </div>
            )}
          </label>
        </div>

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
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm uppercase focus:border-stone-900 focus:outline-hidden"
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
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
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
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
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
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quận / Huyện</label>
            <input
              type="text"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="Cầu Giấy"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tỉnh / Thành phố</label>
            <input
              type="text"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              placeholder="Hà Nội"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
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
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="hn01@hostel.com"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
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
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-2">
          <input
            id="modal_branch_is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="h-4 w-4 rounded-sm border-stone-300 text-stone-900 accent-stone-900 focus:ring-stone-900 cursor-pointer"
          />
          <label htmlFor="modal_branch_is_active" className="text-xs font-semibold text-stone-700 cursor-pointer">
            Đang hoạt động (cho phép tạo phòng & nhận khách)
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#EDE7DD]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{editingBranch ? 'Lưu thay đổi' : 'Thêm chi nhánh'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
