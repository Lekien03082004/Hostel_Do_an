import React from 'react';
import { Modal } from '../common/Modal';
import type { Room, RoomStatus } from '../../types';

export interface QuickStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSelectStatus: (roomId: number, newStatus: RoomStatus) => void;
}

export const QuickStatusModal: React.FC<QuickStatusModalProps> = ({
  isOpen,
  onClose,
  room,
  onSelectStatus,
}) => {
  if (!room) return null;

  const statusOptions = [
    {
      status: 'available' as RoomStatus,
      label: 'Trống sẵn sàng',
      desc: 'Phòng sạch sẽ, sẵn sàng đón khách mới',
      color: 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 text-emerald-950',
    },
    {
      status: 'occupied' as RoomStatus,
      label: 'Đang có khách',
      desc: 'Khách đang lưu trú trong phòng',
      color: 'border-rose-300 hover:border-rose-500 bg-rose-50/40 text-rose-950',
    },
    {
      status: 'cleaning' as RoomStatus,
      label: 'Đang dọn dẹp',
      desc: 'Khách vừa trả phòng, nhân viên buồng phòng đang dọn',
      color: 'border-amber-300 hover:border-amber-500 bg-amber-50/40 text-amber-950',
    },
    {
      status: 'maintenance' as RoomStatus,
      label: 'Đang bảo trì',
      desc: 'Sửa chữa điện, nước, điều hòa, tạm ngưng nhận khách',
      color: 'border-stone-300 hover:border-stone-500 bg-stone-100 text-stone-900',
    },
    {
      status: 'blocked' as RoomStatus,
      label: 'Khóa phòng',
      desc: 'Tạm khóa vì lý do nội bộ',
      color: 'border-slate-300 hover:border-slate-500 bg-slate-100 text-slate-900',
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Đổi trạng thái: Phòng P.${room.room_number}`}
    >
      <div className="space-y-4">
        <p className="text-xs text-stone-600">
          Chọn trạng thái vận hành mới cho phòng <strong>P.{room.room_number}</strong> ({room.room_type_name}):
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statusOptions.map((opt) => (
            <button
              key={opt.status}
              type="button"
              onClick={() => {
                onSelectStatus(room.id, opt.status);
                onClose();
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${opt.color} flex flex-col justify-between`}
            >
              <span className="font-bold text-xs">{opt.label}</span>
              <span className="text-[11px] opacity-75 mt-1">{opt.desc}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
};
