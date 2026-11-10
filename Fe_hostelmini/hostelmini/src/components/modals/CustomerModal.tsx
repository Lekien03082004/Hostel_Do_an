import React, { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { customersApi } from '../../api';
import type { Customer } from '../../types';

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCustomer: Customer | null;
  onSuccess: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  onClose,
  editingCustomer,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    id_card_number: '',
    id_card_type: 'cccd' as 'cccd' | 'cmnd' | 'passport' | 'other',
    date_of_birth: '',
    nationality: 'Việt Nam',
    address: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        full_name: editingCustomer.full_name,
        phone: editingCustomer.phone || '',
        email: editingCustomer.email || '',
        id_card_number: editingCustomer.id_card_number || '',
        id_card_type: editingCustomer.id_card_type || 'cccd',
        date_of_birth: editingCustomer.date_of_birth || '',
        nationality: editingCustomer.nationality || 'Việt Nam',
        address: editingCustomer.address || '',
        note: editingCustomer.note || '',
      });
    } else {
      setFormData({
        full_name: '',
        phone: '',
        email: '',
        id_card_number: '',
        id_card_type: 'cccd',
        date_of_birth: '',
        nationality: 'Việt Nam',
        address: '',
        note: '',
      });
    }
    setError('');
  }, [editingCustomer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Họ và tên khách hàng là trường bắt buộc.');
      return;
    }

    const payload = {
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      id_card_number: formData.id_card_number.trim() || null,
      id_card_type: formData.id_card_type || null,
      date_of_birth: formData.date_of_birth || null,
      nationality: formData.nationality.trim() || null,
      address: formData.address.trim() || null,
      note: formData.note.trim() || null,
    };

    try {
      setSubmitting(true);
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
      } else {
        await customersApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.id_card_number) {
        setError(`Số giấy tờ: ${err.response.data.id_card_number[0]}`);
      } else if (err.response?.data?.phone) {
        setError(`Số điện thoại: ${err.response.data.phone[0]}`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Lỗi khi lưu thông tin khách hàng. Vui lòng kiểm tra lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCustomer ? `Chỉnh sửa: ${editingCustomer.full_name}` : 'Thêm khách hàng mới'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="VD: Trần Thị Hoa"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Số điện thoại
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912345678"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Loại giấy tờ</label>
            <select
              value={formData.id_card_type}
              onChange={(e) =>
                setFormData({ ...formData, id_card_type: e.target.value as any })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="cccd">Căn cước công dân (CCCD)</option>
              <option value="cmnd">Chứng minh nhân dân (CMND)</option>
              <option value="passport">Hộ chiếu (Passport)</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số CCCD / Hộ chiếu</label>
            <input
              type="text"
              value={formData.id_card_number}
              onChange={(e) => setFormData({ ...formData, id_card_number: e.target.value })}
              placeholder="001200001234"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-mono focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="khachhang@gmail.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quốc tịch</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
              placeholder="Việt Nam"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày sinh</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Địa chỉ thường trú</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="TP. Hà Nội"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Ghi chú thêm</label>
          <textarea
            rows={2}
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Sở thích, lưu ý đặc biệt khi khách đến..."
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-stone-900 focus:outline-hidden focus:ring-1 focus:ring-stone-900"
          />
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
            <span>{editingCustomer ? 'Lưu thay đổi' : 'Thêm khách hàng'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
