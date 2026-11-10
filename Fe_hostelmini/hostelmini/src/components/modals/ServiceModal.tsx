import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  Upload,
  Sparkles,
  Utensils,
  Shirt,
  HeartHandshake,
  Car,
  BedDouble,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { bookingsApi } from '../../api';
import type { Service, Branch, ServiceCategory } from '../../types';

export interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService: Service | null;
  branches: Branch[];
  onSuccess: (service: Service, isNew: boolean) => void;
}

const CATEGORIES: { code: ServiceCategory; label: string; icon: React.FC<{ className?: string }> }[] = [
  { code: 'food_beverage', label: 'Ẩm thực & Đồ uống', icon: Utensils },
  { code: 'laundry', label: 'Giặt là & Giặt sấy', icon: Shirt },
  { code: 'spa_wellness', label: 'Spa & Trị liệu', icon: HeartHandshake },
  { code: 'transport', label: 'Xe đưa đón & Di chuyển', icon: Car },
  { code: 'room_amenities', label: 'Tiện ích buồng phòng', icon: BedDouble },
  { code: 'other', label: 'Dịch vụ khác', icon: MoreHorizontal },
];

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  editingService,
  branches,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('food_beverage');
  const [unit, setUnit] = useState('suất');
  const [price, setPrice] = useState<string>('50000');
  const [branchId, setBranchId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (editingService) {
        setName(editingService.name);
        setCategory(editingService.category || 'food_beverage');
        setUnit(editingService.unit || 'suất');
        setPrice(String(editingService.price));
        setBranchId(editingService.branch ? String(editingService.branch) : '');
        setDescription(editingService.description || '');
        setImageUrl(editingService.image_url || '');
        setIsActive(editingService.is_active !== undefined ? editingService.is_active : true);
      } else {
        setName('');
        setCategory('food_beverage');
        setUnit('suất');
        setPrice('50000');
        setBranchId('');
        setDescription('');
        setImageUrl('');
        setIsActive(true);
      }
    }
  }, [isOpen, editingService]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await bookingsApi.uploadServiceImage(formData);

      if (res.data?.image_url) {
        setImageUrl(res.data.image_url);
      }
    } catch {
      setError('Tải ảnh lên thất bại. Vui lòng thử lại hoặc dán đường dẫn ảnh trực tiếp.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên món / tên dịch vụ.');
      return;
    }

    if (!unit.trim()) {
      setError('Vui lòng nhập đơn vị tính (suất, kg, lần, tiếng, chuyến...).');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('Đơn giá không hợp lệ.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: any = {
        name: name.trim(),
        category,
        unit: unit.trim(),
        price: numPrice,
        branch: branchId ? Number(branchId) : null,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        is_active: isActive,
      };

      let res;
      if (editingService) {
        res = await bookingsApi.updateService(editingService.id, payload);
        onSuccess(res.data, false);
      } else {
        res = await bookingsApi.createService(payload);
        onSuccess(res.data, true);
      }
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          'Không thể lưu dịch vụ. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingService ? 'Chỉnh Sửa Dịch Vụ Khách Sạn' : 'Thêm Dịch Vụ Mới'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Tên dịch vụ & Danh mục */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Tên món ăn / Dịch vụ: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Phở Bò Tái Lăn, Giặt sấy 2H, Massage Đá Nóng..."
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Phân loại danh mục: <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Đơn giá, Đơn vị tính & Chi nhánh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Đơn giá (VNĐ): <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="VD: 85000"
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-mono font-bold text-amber-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Đơn vị tính: <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="VD: tô, suất, kg, tiếng, chuyến, set..."
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Chi nhánh áp dụng:
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 cursor-pointer"
            >
              <option value="">Toàn bộ chuỗi (Tất cả chi nhánh)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mô tả dịch vụ */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Mô tả chi tiết món ăn / gói dịch vụ:
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả nguyên liệu, quy trình phục vụ hoặc ghi chú cho khách..."
            className="w-full rounded-xl border border-stone-200 bg-white p-3 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600 resize-none"
          />
        </div>

        {/* Ảnh minh họa & Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-stone-700">
            Hình ảnh minh họa món / dịch vụ:
          </label>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Dán link ảnh (https://...) hoặc chọn tải tệp từ máy..."
              className="flex-1 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-600 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
            />

            <label className="shrink-0 flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer w-full sm:w-auto">
              {uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin text-amber-700" />
              ) : (
                <Upload className="h-4 w-4 text-amber-700" />
              )}
              <span>Tải ảnh từ máy</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          </div>

          {/* Preview ảnh nếu có */}
          {imageUrl && (
            <div className="relative mt-2 h-36 w-full rounded-xl border border-stone-200 overflow-hidden bg-stone-100 group">
              <img
                src={imageUrl}
                alt="Preview"
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
                }}
              />
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-stone-900/70 text-white hover:bg-stone-900 transition-colors"
                title="Xóa ảnh"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Trạng thái hoạt động */}
        <div className="flex items-center gap-2.5 pt-2">
          <input
            type="checkbox"
            id="service_is_active"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded-md border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <label htmlFor="service_is_active" className="text-xs font-medium text-stone-800 cursor-pointer">
            Đang mở bán / Phục vụ tại khách sạn (Hiển thị cho khách và lễ tân chọn)
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="flex items-center gap-2 rounded-xl bg-stone-950 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>{editingService ? 'Cập Nhật Dịch Vụ' : 'Tạo Dịch Vụ'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
