import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2, Plus, Minus, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { bookingsApi } from '../../api';
import type { Booking, Service } from '../../types';

export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: () => void;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<number | string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<number | string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && booking) {
      setError('');
      setQuantity(1);
      setCustomPrice('');
      if (booking.details && booking.details.length > 0) {
        setSelectedDetailId(booking.details[0].id);
      }
      fetchServices();
    }
  }, [isOpen, booking]);

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const res = await bookingsApi.getServices({ is_active: true });
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setServices(data);
      if (data.length > 0) {
        setSelectedServiceId(data[0].id);
        setCustomPrice(String(data[0].price));
      }
    } catch {
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    } finally {
      setLoadingServices(false);
    }
  };

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const found = services.find((s) => String(s.id) === serviceId);
    if (found) {
      setCustomPrice(String(found.price));
    }
  };

  const selectedService = services.find((s) => String(s.id) === String(selectedServiceId));
  const unitPriceNum = Number(customPrice) || 0;
  const totalPrice = unitPriceNum * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    if (!selectedDetailId) {
      setError('Vui lòng chọn phòng áp dụng dịch vụ.');
      return;
    }

    if (!selectedServiceId) {
      setError('Vui lòng chọn dịch vụ cần thêm.');
      return;
    }

    if (quantity <= 0) {
      setError('Số lượng dịch vụ phải lớn hơn 0.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await bookingsApi.addService(booking.id, {
        detail_id: Number(selectedDetailId),
        service_id: Number(selectedServiceId),
        quantity: quantity,
        unit_price: unitPriceNum,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Có lỗi xảy ra khi thêm dịch vụ vào đơn đặt phòng.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thêm Dịch Vụ Mini-bar / Phụ Thu - #${booking.booking_code}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Room Detail Selector */}
        {booking.details && booking.details.length > 1 && (
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Áp dụng cho phòng:
            </label>
            <select
              value={selectedDetailId}
              onChange={(e) => setSelectedDetailId(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              {booking.details.map((d) => (
                <option key={d.id} value={d.id}>
                  Phòng {d.room_number || `#${d.room}`} ({d.room_type_name || 'Phòng nghỉ'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Service Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Chọn Dịch Vụ / Tiện ích: <span className="text-rose-500">*</span>
          </label>
          {loadingServices ? (
            <div className="py-4 text-xs text-stone-400 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải danh sách dịch vụ...
            </div>
          ) : (
            <select
              required
              value={selectedServiceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3.5 py-2.5 text-xs text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {Number(s.price).toLocaleString('vi-VN')} đ / {s.unit}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Quantity Stepper & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Số lượng ({selectedService?.unit || 'lần'}):
            </label>
            <div className="flex items-center rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-700 shadow-2xs hover:bg-stone-100 transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-center text-xs font-bold text-stone-900 focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-stone-700 shadow-2xs hover:bg-stone-100 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Đơn giá (VNĐ):
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C5] bg-[#FAF8F5] px-3.5 py-2.5 text-xs font-mono font-semibold text-stone-900 focus:border-amber-500 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-1.5">
          <div className="flex justify-between text-xs text-amber-900">
            <span>Dịch vụ:</span>
            <strong>{selectedService?.name || '—'}</strong>
          </div>
          <div className="flex justify-between text-xs text-amber-900">
            <span>Đơn giá áp dụng:</span>
            <span>{unitPriceNum.toLocaleString('vi-VN')} đ × {quantity} {selectedService?.unit || ''}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-amber-200 text-sm font-bold text-amber-950">
            <span>Thành tiền cộng vào hóa đơn:</span>
            <span className="font-serif text-base text-amber-900">{totalPrice.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-amber-700 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang ghi nhận...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Xác Nhận Thêm Món</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
