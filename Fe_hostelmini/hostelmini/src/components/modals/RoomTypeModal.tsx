import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { roomsApi } from '../../api';
import type { RoomType } from '../../types';

export interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingType: RoomType | null;
  onSuccess: (type: RoomType, isNew: boolean) => void;
}

// Curated 5-star boutique hotel sample presets
const SAMPLE_PRESET_IMAGES = {
  primary:
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  details: [
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
  ],
};

export const RoomTypeModal: React.FC<RoomTypeModalProps> = ({
  isOpen,
  onClose,
  editingType,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_occupancy: 2,
    bed_type: 'King Bed',
    area_sqm: '30.00',
  });

  // 1 Big Cover/Representative Image
  const [primaryImage, setPrimaryImage] = useState<string>('');

  // 5 Small Detail Gallery Images
  const [detailImages, setDetailImages] = useState<string[]>(['', '', '', '', '']);

  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingType) {
      setFormData({
        name: editingType.name,
        description: editingType.description || '',
        max_occupancy: editingType.max_occupancy,
        bed_type: editingType.bed_type || 'King Bed',
        area_sqm: editingType.area_sqm ? String(editingType.area_sqm) : '30.00',
      });

      // Populate existing images
      if (editingType.images && editingType.images.length > 0) {
        const primary = editingType.images.find((img) => img.is_primary);
        const details = editingType.images.filter((img) => !img.is_primary);

        setPrimaryImage(primary?.image_url || editingType.images[0].image_url || '');

        const detailList = ['', '', '', '', ''];
        details.slice(0, 5).forEach((img, idx) => {
          detailList[idx] = img.image_url;
        });
        setDetailImages(detailList);
      } else {
        setPrimaryImage('');
        setDetailImages(['', '', '', '', '']);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        max_occupancy: 2,
        bed_type: 'King Bed',
        area_sqm: '30.00',
      });
      setPrimaryImage('');
      setDetailImages(['', '', '', '', '']);
    }
    setError('');
  }, [editingType, isOpen]);

  // Handle local file upload
  const handleFileUpload = async (file: File, targetIndex: number) => {
    try {
      setUploadingIdx(targetIndex);
      const data = new FormData();
      data.append('file', file);

      const res = await roomsApi.uploadRoomImage(data);

      const uploadedUrl = res.data.image_url;
      if (targetIndex === -1) {
        // -1 represents primary image
        setPrimaryImage(uploadedUrl);
      } else {
        const next = [...detailImages];
        next[targetIndex] = uploadedUrl;
        setDetailImages(next);
      }
    } catch (err) {
      // Fallback: create object preview URL
      const fallbackUrl = URL.createObjectURL(file);
      if (targetIndex === -1) {
        setPrimaryImage(fallbackUrl);
      } else {
        const next = [...detailImages];
        next[targetIndex] = fallbackUrl;
        setDetailImages(next);
      }
    } finally {
      setUploadingIdx(null);
    }
  };

  // Quick fill sample preset images
  const handleApplyPreset = () => {
    setPrimaryImage(SAMPLE_PRESET_IMAGES.primary);
    setDetailImages([...SAMPLE_PRESET_IMAGES.details]);
  };

  const handleDetailChange = (val: string, idx: number) => {
    const next = [...detailImages];
    next[idx] = val;
    setDetailImages(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Tên loại phòng là trường bắt buộc.');
      return;
    }

    // Assemble image payload
    const imagesPayload: { image_url: string; is_primary: boolean; sort_order: number }[] = [];
    if (primaryImage.trim()) {
      imagesPayload.push({
        image_url: primaryImage.trim(),
        is_primary: true,
        sort_order: 0,
      });
    }

    detailImages.forEach((url, idx) => {
      if (url && url.trim()) {
        imagesPayload.push({
          image_url: url.trim(),
          is_primary: false,
          sort_order: idx + 1,
        });
      }
    });

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      max_occupancy: Number(formData.max_occupancy) || 2,
      bed_type: formData.bed_type.trim() || null,
      area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
      images: imagesPayload,
    };

    try {
      setSubmitting(true);
      if (editingType) {
        const res = await roomsApi.updateRoomType(editingType.id, payload);
        onSuccess(res.data, false);
      } else {
        const res = await roomsApi.createRoomType(payload);
        onSuccess(res.data, true);
      }
      onClose();
    } catch (err: any) {
      setError('Lỗi khi lưu loại phòng. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingType ? `Chỉnh sửa: ${editingType.name}` : 'Thêm loại phòng mới'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* SECTION 1: BASIC INFO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
              1. Thông Tin Cơ Bản
            </h4>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Tên hạng phòng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Deluxe Heritage Suite, Luxury Capsule Pod..."
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden font-bold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Loại giường
              </label>
              <input
                type="text"
                value={formData.bed_type}
                onChange={(e) => setFormData({ ...formData, bed_type: e.target.value })}
                placeholder="VD: King Size, 2 Giường Đơn"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Sức chứa tối đa
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.max_occupancy}
                onChange={(e) =>
                  setFormData({ ...formData, max_occupancy: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Diện tích (m²)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.area_sqm}
                onChange={(e) => setFormData({ ...formData, area_sqm: e.target.value })}
                placeholder="35.00"
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Mô tả chi tiết tiện nghi
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Mô tả không gian phòng, view cửa sổ, bồn tắm, minibar..."
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
            />
          </div>
        </div>

        {/* SECTION 2: IMAGES (1 PRIMARY COVER + 5 DETAIL GALLERY) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between border-b border-stone-200 pb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                2. Hình Ảnh Phòng (1 Ảnh Đại Diện Box + 5 Ảnh Chi Tiết)
              </h4>
              <p className="text-[11px] text-stone-500 font-light mt-0.5">
                Ảnh đại diện hiển thị ngoài danh sách phòng. 5 ảnh chi tiết hiển thị khi khách bấm xem chi tiết.
              </p>
            </div>

            <button
              type="button"
              onClick={handleApplyPreset}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Dùng bộ ảnh mẫu 5 sao</span>
            </button>
          </div>

          {/* 1 BIG PRIMARY COVER IMAGE */}
          <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                Ảnh To Đại Diện Box (Bắt buộc cho hiển thị ngoài trang Rooms)
              </label>
              {primaryImage && (
                <button
                  type="button"
                  onClick={() => setPrimaryImage('')}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Preview Box - Directly clickable */}
              <label className="sm:col-span-4 aspect-16/10 rounded-2xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-300 hover:border-amber-400 relative group flex items-center justify-center cursor-pointer transition-colors shadow-xs">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, -1);
                  }}
                />
                {primaryImage ? (
                  <>
                    <img
                      src={primaryImage}
                      alt="Ảnh đại diện box"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                      <Upload className="w-5 h-5 mb-1 text-amber-300" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Bấm để đổi ảnh bìa</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-stone-400 p-4 text-center group-hover:text-amber-700 transition-colors">
                    <ImageIcon className="w-8 h-8 mb-1.5 opacity-60 group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold uppercase tracking-wider block">Bấm để chọn ảnh từ máy</span>
                    <span className="text-[9px] text-stone-400 font-normal">Hỗ trợ JPG, PNG, WEBP</span>
                  </div>
                )}
                {uploadingIdx === -1 && (
                  <div className="absolute inset-0 bg-stone-900/70 flex flex-col items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-300 mb-1" />
                    <span className="text-[10px] font-bold">Đang tải ảnh lên...</span>
                  </div>
                )}
              </label>

              {/* Upload Controls */}
              <div className="sm:col-span-8 space-y-2.5">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, -1);
                      }}
                    />
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-950 text-amber-300 hover:bg-stone-800 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Chọn tệp ảnh từ máy tính</span>
                    </div>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="url"
                    value={primaryImage}
                    onChange={(e) => setPrimaryImage(e.target.value)}
                    placeholder="Hoặc dán trực tiếp liên kết URL ảnh (https://...)"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-xs focus:border-stone-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5 SMALL DETAIL GALLERY IMAGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block">
                5 Ảnh Nhỏ Chi Tiết (Hiển thị khi khách bấm "Xem chi tiết phòng")
              </label>
              <span className="text-[11px] text-stone-400 font-light">
                Bấm trực tiếp vào từng ô để chọn ảnh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {detailImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-stone-200 p-2.5 bg-stone-50/60 flex flex-col space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-stone-500 uppercase">
                      Ảnh chi tiết #{idx + 1}
                    </span>
                    {imgUrl && (
                      <button
                        type="button"
                        onClick={() => handleDetailChange('', idx)}
                        className="text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Xóa ảnh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Preview - Directly clickable */}
                  <label className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-300 hover:border-amber-400 flex items-center justify-center group cursor-pointer transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, idx);
                      }}
                    />
                    {imgUrl ? (
                      <>
                        <img
                          src={imgUrl}
                          alt={`Ảnh chi tiết ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-center p-1">
                          <Upload className="w-4 h-4 mb-0.5 text-amber-300" />
                          <span className="text-[9px] font-bold">Đổi ảnh</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-stone-400 group-hover:text-amber-700 transition-colors text-center">
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Chọn ảnh #{idx + 1}</span>
                      </div>
                    )}
                    {uploadingIdx === idx && (
                      <div className="absolute inset-0 bg-stone-900/70 flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                      </div>
                    )}
                  </label>

                  {/* URL Text Input */}
                  <input
                    type="url"
                    value={imgUrl}
                    onChange={(e) => handleDetailChange(e.target.value, idx)}
                    placeholder="Dán URL ảnh..."
                    className="w-full rounded-lg border border-stone-300 px-2 py-1 text-[10px] focus:border-stone-900 focus:outline-hidden"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
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
            className="flex items-center gap-2 rounded-xl bg-stone-950 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-400 hover:text-stone-950 shadow-md transition-all disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{editingType ? 'Lưu thay đổi' : 'Tạo loại phòng'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

