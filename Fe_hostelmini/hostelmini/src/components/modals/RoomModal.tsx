import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Loader2,
  Upload,
  Trash2,
  X,
  BedDouble,
  Users,
  Sparkles,
  Building2,
  Maximize2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { roomsApi } from '../../api';
import type { Room, RoomType, Branch, RoomStatus } from '../../types';

export interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRoom: Room | null;
  branches: Branch[];
  roomTypes: RoomType[];
  defaultBranchId?: string;
  onSuccess: (room: Room, isNew: boolean) => void;
  onEditRoomType?: (type: RoomType) => void;
  onAddRoomType?: () => void;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  editingRoom,
  branches,
  roomTypes,
  defaultBranchId,
  onSuccess,
}) => {
  // Room basic information
  const [branch, setBranch] = useState<string>('');
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [floor, setFloor] = useState<string>('1');
  const [status, setStatus] = useState<RoomStatus>('available');
  const [isActive, setIsActive] = useState<boolean>(true);

  // Room type & details
  const [roomTypeId, setRoomTypeId] = useState<string>('');
  const [isNewType, setIsNewType] = useState<boolean>(false);
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [maxOccupancy, setMaxOccupancy] = useState<number>(2);
  const [bedType, setBedType] = useState<string>('King Bed');
  const [areaSqm, setAreaSqm] = useState<string>('30.00');

  // Images (Cách 1: Chọn tệp ảnh trực tiếp từ máy tính)
  // 1 ảnh to đại diện box
  const [primaryImage, setPrimaryImage] = useState<string>('');
  // 5 ảnh nhỏ chi tiết
  const [detailImages, setDetailImages] = useState<string[]>(['', '', '', '', '']);

  // Loading & error states
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null); // -1 = primary, 0..4 = details
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Synchronize state when modal opens or editingRoom changes
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setUploadingIdx(null);

    if (editingRoom) {
      setBranch(String(editingRoom.branch));
      setRoomNumber(editingRoom.room_number);
      setFloor(editingRoom.floor ? String(editingRoom.floor) : '1');
      setStatus(editingRoom.status);
      setIsActive(editingRoom.is_active);

      const targetType = roomTypes.find((t) => t.id === editingRoom.room_type);
      if (targetType) {
        setRoomTypeId(String(targetType.id));
        setIsNewType(false);
        setNewTypeName('');
        setDescription(targetType.description || '');
        setMaxOccupancy(targetType.max_occupancy || 2);
        setBedType(targetType.bed_type || 'King Bed');
        setAreaSqm(targetType.area_sqm ? String(targetType.area_sqm) : '30.00');

        const primary = targetType.images?.find((img) => img.is_primary);
        const details = targetType.images?.filter((img) => !img.is_primary) || [];

        setPrimaryImage(primary?.image_url || targetType.images?.[0]?.image_url || '');

        const newDetails = ['', '', '', '', ''];
        details.slice(0, 5).forEach((img, idx) => {
          newDetails[idx] = img.image_url;
        });
        setDetailImages(newDetails);
      } else {
        setRoomTypeId(String(editingRoom.room_type));
        setIsNewType(false);
        setNewTypeName('');
        setDescription('');
        setMaxOccupancy(2);
        setBedType('King Bed');
        setAreaSqm('30.00');
        setPrimaryImage('');
        setDetailImages(['', '', '', '', '']);
      }
    } else {
      // Adding new room
      const initBranch =
        defaultBranchId && defaultBranchId !== 'all'
          ? defaultBranchId
          : branches[0]?.id
          ? String(branches[0].id)
          : '';
      setBranch(initBranch);
      setRoomNumber('');
      setFloor('1');
      setStatus('available');
      setIsActive(true);

      if (roomTypes.length > 0) {
        const firstType = roomTypes[0];
        setRoomTypeId(String(firstType.id));
        setIsNewType(false);
        setNewTypeName('');
        setDescription(firstType.description || '');
        setMaxOccupancy(firstType.max_occupancy || 2);
        setBedType(firstType.bed_type || 'King Bed');
        setAreaSqm(firstType.area_sqm ? String(firstType.area_sqm) : '30.00');

        const primary = firstType.images?.find((img) => img.is_primary);
        const details = firstType.images?.filter((img) => !img.is_primary) || [];

        setPrimaryImage(primary?.image_url || firstType.images?.[0]?.image_url || '');

        const newDetails = ['', '', '', '', ''];
        details.slice(0, 5).forEach((img, idx) => {
          newDetails[idx] = img.image_url;
        });
        setDetailImages(newDetails);
      } else {
        setRoomTypeId('new');
        setIsNewType(true);
        setNewTypeName('');
        setDescription('');
        setMaxOccupancy(2);
        setBedType('King Bed');
        setAreaSqm('30.00');
        setPrimaryImage('');
        setDetailImages(['', '', '', '', '']);
      }
    }
  }, [isOpen, editingRoom, branches, roomTypes, defaultBranchId]);

  // When changing room type dropdown
  const handleRoomTypeChange = (selectedVal: string) => {
    if (selectedVal === 'new') {
      setIsNewType(true);
      setRoomTypeId('new');
      setNewTypeName('');
      setDescription('');
      setMaxOccupancy(2);
      setBedType('King Bed');
      setAreaSqm('30.00');
      setPrimaryImage('');
      setDetailImages(['', '', '', '', '']);
    } else {
      setIsNewType(false);
      setRoomTypeId(selectedVal);
      const targetType = roomTypes.find((t) => String(t.id) === selectedVal);
      if (targetType) {
        setDescription(targetType.description || '');
        setMaxOccupancy(targetType.max_occupancy || 2);
        setBedType(targetType.bed_type || 'King Bed');
        setAreaSqm(targetType.area_sqm ? String(targetType.area_sqm) : '30.00');

        const primary = targetType.images?.find((img) => img.is_primary);
        const details = targetType.images?.filter((img) => !img.is_primary) || [];

        setPrimaryImage(primary?.image_url || targetType.images?.[0]?.image_url || '');

        const newDetails = ['', '', '', '', ''];
        details.slice(0, 5).forEach((img, idx) => {
          newDetails[idx] = img.image_url;
        });
        setDetailImages(newDetails);
      }
    }
  };

  // Cách 1: Tải tệp ảnh trực tiếp từ máy tính lên server
  const handleFileUpload = async (file: File, targetIdx: number) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa cho phép là 10MB.');
      return;
    }

    try {
      setUploadingIdx(targetIdx);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const res = await roomsApi.uploadRoomImage(formData);

      const uploadedUrl = res.data.image_url;
      if (targetIdx === -1) {
        setPrimaryImage(uploadedUrl);
      } else {
        setDetailImages((prev) => {
          const next = [...prev];
          next[targetIdx] = uploadedUrl;
          return next;
        });
      }
    } catch (err: any) {
      // Fallback cục bộ nếu upload server gặp sự cố
      const fallbackUrl = URL.createObjectURL(file);
      if (targetIdx === -1) {
        setPrimaryImage(fallbackUrl);
      } else {
        setDetailImages((prev) => {
          const next = [...prev];
          next[targetIdx] = fallbackUrl;
          return next;
        });
      }
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleRemovePrimary = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPrimaryImage('');
  };

  const handleRemoveDetail = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDetailImages((prev) => {
      const next = [...prev];
      next[idx] = '';
      return next;
    });
  };

  // Submit toàn bộ thông tin phòng, mô tả và bộ ảnh chỉ trong 1 lần nhấn
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!branch) {
      setError('Vui lòng chọn cơ sở Chi nhánh.');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Vui lòng nhập Số phòng (VD: 101, 202).');
      return;
    }
    if (isNewType && !newTypeName.trim()) {
      setError('Vui lòng nhập Tên loại phòng mới.');
      return;
    }
    if (!roomTypeId) {
      setError('Vui lòng chọn hoặc tạo Hạng phòng.');
      return;
    }

    try {
      setSubmitting(true);

      // Chuẩn bị payload danh sách ảnh
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

      // 1. Tạo hoặc cập nhật Loại phòng (RoomType) kèm mô tả và ảnh
      let finalRoomTypeId: number;

      if (isNewType) {
        const typePayload = {
          name: newTypeName.trim(),
          description: description.trim() || null,
          max_occupancy: Number(maxOccupancy) || 2,
          bed_type: bedType.trim() || 'King Bed',
          area_sqm: areaSqm ? parseFloat(areaSqm) : null,
          images: imagesPayload,
        };
        const resType = await roomsApi.createRoomType(typePayload);
        finalRoomTypeId = resType.data.id;
      } else {
        finalRoomTypeId = parseInt(roomTypeId, 10);
        // Cập nhật thông tin mô tả, thông số và bộ ảnh cho hạng phòng hiện tại
        try {
          const updateTypePayload = {
            description: description.trim() || null,
            max_occupancy: Number(maxOccupancy) || 2,
            bed_type: bedType.trim() || 'King Bed',
            area_sqm: areaSqm ? parseFloat(areaSqm) : null,
            images: imagesPayload,
          };
          await roomsApi.patchRoomType(finalRoomTypeId, updateTypePayload);
        } catch (err) {
          console.warn('Lưu thông tin hạng phòng cập nhật:', err);
        }
      }

      // 2. Tạo hoặc cập nhật Phòng (Room)
      const roomPayload = {
        branch: parseInt(branch, 10),
        room_type: finalRoomTypeId,
        room_number: roomNumber.trim(),
        floor: parseInt(floor, 10) || 1,
        status: status,
        is_active: isActive,
      };

      if (editingRoom) {
        const res = await roomsApi.updateRoom(editingRoom.id, roomPayload);
        onSuccess(res.data, false);
      } else {
        const res = await roomsApi.createRoom(roomPayload);
        onSuccess(res.data, true);
      }

      onClose();
    } catch (err: any) {
      if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.response?.data?.room_number) {
        setError(`Số phòng: ${err.response.data.room_number[0]}`);
      } else if (err.response?.data?.name) {
        setError(`Tên hạng phòng: ${err.response.data.name[0]}`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Có lỗi xảy ra khi lưu thông tin phòng. Vui lòng kiểm tra lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingRoom ? `Chỉnh sửa phòng: P.${editingRoom.room_number}` : 'Thêm phòng mới'}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* PHẦN 1: THÔNG TIN PHÒNG CƠ BẢN */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
            <Building2 className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              1. Thông tin vị trí & số phòng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Cơ sở Chi nhánh <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm bg-white focus:border-stone-900 focus:outline-hidden cursor-pointer"
              >
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} - {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Số phòng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="VD: 101, 204"
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-hidden font-bold text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Tầng lầu
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Trạng thái phòng ban đầu
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RoomStatus)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm bg-white focus:border-stone-900 focus:outline-hidden cursor-pointer"
              >
                <option value="available">🟢 Trống sẵn sàng đón khách</option>
                <option value="occupied">🔴 Đang có khách ở</option>
                <option value="cleaning">🟡 Buồng phòng đang dọn dẹp</option>
                <option value="maintenance">⚪ Đang bảo trì thiết bị</option>
                <option value="blocked">🔒 Tạm khóa phòng</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-stone-300 text-stone-900 accent-stone-900 cursor-pointer"
                />
                <span className="text-xs font-semibold text-stone-800">
                  Phòng đang hoạt động (cho phép khách xem và đặt phòng)
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* PHẦN 2: HẠNG PHÒNG, THÔNG SỐ VÀ MÔ TẢ PHÒNG */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b border-stone-200">
            <BedDouble className="w-4 h-4 text-amber-700" />
            <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
              2. Hạng phòng & Mô tả chi tiết
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                Chọn Hạng phòng <span className="text-rose-500">*</span>
              </label>
              <select
                value={isNewType ? 'new' : roomTypeId}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm bg-white focus:border-stone-900 focus:outline-hidden cursor-pointer font-medium"
              >
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Tối đa {t.max_occupancy} khách - {t.bed_type || 'King Bed'})
                  </option>
                ))}
                <option value="new" className="font-bold text-amber-800">
                  + Tạo loại phòng mới...
                </option>
              </select>
            </div>

            {isNewType && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Tên loại phòng mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required={isNewType}
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="VD: Deluxe Ban Công View Phố"
                  className="w-full rounded-xl border border-amber-300 bg-amber-50/30 px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-hidden font-bold"
                />
              </div>
            )}
          </div>

          {/* Thông số phòng */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-700" />
                Sức chứa
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxOccupancy}
                onChange={(e) => setMaxOccupancy(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center gap-1">
                <BedDouble className="w-3 h-3 text-amber-700" />
                Loại giường
              </label>
              <input
                type="text"
                value={bedType}
                onChange={(e) => setBedType(e.target.value)}
                placeholder="VD: King Bed"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1 flex items-center gap-1">
                <Maximize2 className="w-3 h-3 text-amber-700" />
                Diện tích (m²)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                value={areaSqm}
                onChange={(e) => setAreaSqm(e.target.value)}
                placeholder="VD: 30"
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Ô nhập mô tả chi tiết phòng */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
              Mô tả chi tiết phòng & tiện nghi
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả không gian phòng, cửa sổ tầm nhìn, tiện nghi buồng phòng (điều hòa, bồn tắm nằm cao cấp, minibar, wifi tốc độ cao...)"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm focus:border-stone-900 focus:outline-hidden resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* PHẦN 3: CHỌN ẢNH PHÒNG (CÁCH 1: BẤM TRỰC TIẾP VÀO KHUNG ĐỂ CHỌN TỆP TỪ MÁY TÍNH) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                3. Bộ ảnh phòng (1 ảnh bìa box + 5 ảnh chi tiết)
              </span>
            </div>
            <span className="text-[11px] text-amber-800 font-semibold">
              * Bấm trực tiếp vào từng ô bên dưới để chọn tệp ảnh từ máy tính
            </span>
          </div>

          {/* 1. KHUNG ẢNH TO ĐẠI DIỆN BOX */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Ảnh bìa đại diện box <span className="text-amber-700 font-semibold">(Ảnh to hiển thị thẻ phòng ngoài danh sách)</span>
              </label>
              {primaryImage && (
                <button
                  type="button"
                  onClick={handleRemovePrimary}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Xóa ảnh bìa
                </button>
              )}
            </div>

            <label
              className={`relative block w-full h-44 sm:h-52 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
                primaryImage
                  ? 'border-amber-400 bg-stone-900 group shadow-md'
                  : 'border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/20'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingIdx !== null}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, -1);
                  e.target.value = '';
                }}
              />

              {uploadingIdx === -1 ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-stone-50 text-stone-600">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                  <span className="text-xs font-bold">Đang tải ảnh bìa từ máy tính lên máy chủ...</span>
                </div>
              ) : primaryImage ? (
                <>
                  <img
                    src={primaryImage}
                    alt="Ảnh bìa box"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 rounded-xl bg-white/95 text-stone-900 text-xs font-bold shadow-md inline-flex items-center gap-2">
                      <Upload className="w-4 h-4 text-amber-700" />
                      Bấm vào đây để đổi ảnh bìa khác từ máy tính
                    </span>
                  </div>
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md text-amber-300 text-[10px] font-bold uppercase tracking-wider shadow-xs">
                    ★ Ảnh đại diện chính
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100/80 flex items-center justify-center text-amber-800 mb-2 border border-amber-300/60 shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-stone-800">
                    Bấm chuột vào đây để chọn ảnh bìa đại diện từ máy tính
                  </span>
                  <span className="text-xs text-stone-500 mt-1">
                    Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 10MB)
                  </span>
                </div>
              )}
            </label>
          </div>

          {/* 2. 5 KHUNG ẢNH NHỎ CHI TIẾT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700">
                5 Ảnh chi tiết phòng <span className="text-stone-500 font-normal">(Hiển thị trong album khi khách bấm xem chi tiết)</span>
              </label>
              <span className="text-[11px] text-stone-500 font-medium">
                {detailImages.filter((x) => x.trim()).length}/5 ảnh đã chọn
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((idx) => {
                const imgUrl = detailImages[idx];
                const isUploadingThis = uploadingIdx === idx;

                return (
                  <label
                    key={idx}
                    className={`relative aspect-4/3 rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center ${
                      imgUrl
                        ? 'border-amber-300 group shadow-2xs bg-stone-900'
                        : 'border-dashed border-stone-300 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/20'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIdx !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, idx);
                        e.target.value = '';
                      }}
                    />

                    {isUploadingThis ? (
                      <div className="flex flex-col items-center justify-center gap-1 text-stone-600">
                        <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                        <span className="text-[10px] font-bold">Đang tải...</span>
                      </div>
                    ) : imgUrl ? (
                      <>
                        <img
                          src={imgUrl}
                          alt={`Chi tiết #${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white bg-stone-900/80 px-2 py-0.5 rounded-md">
                            Đổi ảnh
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveDetail(e, idx)}
                          title="Xóa ảnh này"
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-stone-950/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded-sm bg-stone-950/75 text-[9px] font-bold text-stone-200">
                          #{idx + 1}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-2 text-center text-stone-400 hover:text-amber-700 transition-colors">
                        <Upload className="w-4 h-4 mb-1" />
                        <span className="text-[10px] font-bold">Ảnh #{idx + 1}</span>
                        <span className="text-[9px] text-stone-400">Bấm chọn tệp</span>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* NÚT THAO TÁC Ở ĐÁY MODAL */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#EDE7DD]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-stone-950 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 disabled:opacity-50 transition-all cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                <span>Đang lưu thông tin...</span>
              </>
            ) : (
              <span>{editingRoom ? 'Lưu thay đổi' : 'Tạo phòng mới'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
