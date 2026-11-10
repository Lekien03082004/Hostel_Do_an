import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  Building2,
  Wallet,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { billingApi } from '../../api';
import type { Invoice, Booking } from '../../types';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  booking: Booking | null;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  booking,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'credit_card' | 'e_wallet'>('cash');
  const [paymentType, setPaymentType] = useState<'full' | 'partial' | 'deposit'>('full');
  const [referenceNo, setReferenceNo] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && invoice) {
      setError('');
      setReferenceNo('');
      setNote('Khách thanh toán hóa đơn phòng và dịch vụ khi check-out');
      setPaymentMethod('cash');

      const remaining = Number(invoice.remaining_amount || 0);
      setAmount(remaining > 0 ? String(remaining) : String(invoice.total_amount));
      setPaymentType(remaining <= Number(invoice.total_amount) ? 'full' : 'partial');
    }
  }, [isOpen, invoice]);

  const formatCurrency = (val: string | number | undefined | null) => {
    if (!val) return '0 đ';
    return Number(val).toLocaleString('vi-VN') + ' đ';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!invoice) return;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Vui lòng nhập số tiền thanh toán hợp lệ (lớn hơn 0).');
      return;
    }

    try {
      setSubmitting(true);
      await billingApi.createPayment({
        invoice: invoice.id,
        payment_method: paymentMethod,
        payment_type: paymentType,
        amount: numAmount,
        reference_no: referenceNo.trim() || undefined,
        note: note.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.amount?.[0] ||
          'Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Thanh Toán & Quyết Toán Hóa Đơn #${invoice.invoice_code}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoice Summary breakdown */}
        <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-4 space-y-2">
          <div className="flex justify-between items-center border-b border-stone-200 pb-2">
            <span className="font-semibold text-stone-700 flex items-center gap-1.5">
              <Receipt className="h-4 w-4 text-amber-700" />
              Chi tiết hóa đơn đơn #{booking?.booking_code}
            </span>
            <span className="font-mono text-stone-900 font-bold">{invoice.invoice_code}</span>
          </div>

          <div className="space-y-1.5 pt-1 text-stone-600">
            <div className="flex justify-between">
              <span>Tiền phòng lưu trú:</span>
              <span className="font-mono font-bold text-stone-900">{formatCurrency(invoice.subtotal_rooms)}</span>
            </div>

            <div className="flex justify-between text-amber-950 font-medium">
              <span>Tiền dịch vụ (Ăn uống, Giặt là, Spa...):</span>
              <span className="font-mono font-bold text-amber-900">{formatCurrency(invoice.subtotal_services)}</span>
            </div>

            {Number(invoice.discount_amount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm trừ:</span>
                <span className="font-mono font-semibold">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2">
              <span>TỔNG CỘNG PHẢI THU:</span>
              <span className="font-serif font-bold text-base text-amber-900">
                {formatCurrency(invoice.total_amount)}
              </span>
            </div>

            <div className="flex justify-between text-emerald-700 pt-0.5">
              <span>Đã thanh toán trước đó:</span>
              <span className="font-mono font-bold">{formatCurrency(invoice.paid_amount)}</span>
            </div>

            <div className="flex justify-between text-sm font-bold border-t border-stone-200 pt-2">
              <span className="text-rose-700">CÒN LẠI CẦN THU:</span>
              <span className="font-mono font-bold text-rose-700 text-base">
                {formatCurrency(invoice.remaining_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <label className="block font-semibold text-stone-700 mb-1.5">
            Số tiền khách thanh toán đợt này (VNĐ): <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-amber-900 focus:border-amber-600 focus:outline-hidden"
            />
            <button
              type="button"
              onClick={() => setAmount(String(invoice.remaining_amount))}
              className="absolute right-2 top-2 px-2 py-1 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold hover:bg-amber-200 transition-colors"
            >
              Thu đủ
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block font-semibold text-stone-700 mb-1.5">
            Phương thức thanh toán: <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Tiền mặt', icon: Banknote },
              { id: 'bank_transfer', label: 'Chuyển khoản', icon: Building2 },
              { id: 'credit_card', label: 'Quẹt thẻ', icon: CreditCard },
              { id: 'e_wallet', label: 'Ví điện tử', icon: Wallet },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-stone-950 text-amber-300 border-stone-950 shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-[11px] font-bold">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Mã giao dịch / Mã chuyển khoản:
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="VD: FT260823001..."
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Hình thức ghi nhận:
            </label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as any)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-hidden cursor-pointer"
            >
              <option value="full">Thanh toán đủ hóa đơn</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="deposit">Đặt cọc phòng</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-stone-700 mb-1">
            Ghi chú phiếu thu:
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú nhân viên thu tiền..."
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-stone-900 focus:border-amber-600 focus:outline-hidden"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-xl bg-stone-950 px-5 py-2 font-bold text-white shadow-md hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                <span>Đang ghi nhận...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Xác Nhận Thu Tiền</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
