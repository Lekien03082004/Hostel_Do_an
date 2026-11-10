import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  CreditCard,
  Globe,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { customersApi } from '../api';
import type { Customer } from '../types';
import { CustomerModal } from '../components/modals';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async (query = '') => {
    try {
      setLoading(true);
      setError('');
      const res = await customersApi.getAll(query ? { search: query } : undefined);
      const data = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
      setCustomers(data);
    } catch (err: any) {
      setError('Không thể tải danh sách khách hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCustomers(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!window.confirm(`Bạn có chắc muốn xóa hồ sơ khách hàng "${customer.full_name}"?`)) {
      return;
    }

    try {
      await customersApi.delete(customer.id);
      fetchCustomers(searchTerm);
    } catch (err: any) {
      alert('Không thể xóa khách hàng đã có lịch sử đơn đặt phòng.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-stone-900">
            Quản lý Khách thuê
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 font-light mt-1">
            Hồ sơ khách lưu trú, thông tin CCCD/Hộ chiếu và lịch sử lưu trú tại Aurelia Hostels.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-stone-800 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 text-amber-300" />
          <span>Thêm khách hàng</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-3.5 border border-[#E3DDD2] shadow-xs">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo số điện thoại, CCCD/CMND hoặc họ tên khách..."
            className="w-full rounded-xl bg-[#F8F6F2] py-2 pl-9 pr-4 text-xs sm:text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-stone-900 border border-transparent focus:border-stone-400"
          />
        </div>
        <div className="text-xs font-semibold text-stone-600 whitespace-nowrap px-2">
          Tìm thấy: <span className="text-amber-900 font-bold">{customers.length}</span> khách
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
            <span className="text-xs font-medium text-stone-500">Đang tra cứu dữ liệu khách hàng...</span>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-6 text-center text-amber-900">
          <AlertCircle className="mx-auto h-8 w-8 text-amber-800 mb-2" />
          <p className="text-sm font-bold">{error}</p>
          <button
            type="button"
            onClick={() => fetchCustomers(searchTerm)}
            className="mt-3 text-xs font-bold text-stone-900 underline"
          >
            Thử lại
          </button>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#DDD5C7] bg-white p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAF6EE] text-amber-800 mb-3 border border-[#EBE1D0]">
            <Users className="h-7 w-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-stone-800">Không có khách hàng nào</h3>
          <p className="mt-1 text-xs text-stone-500 max-w-sm mx-auto font-light">
            {searchTerm ? 'Không tìm thấy khách hàng nào khớp với từ khóa.' : 'Tạo mới hồ sơ khách hàng để tiện cho việc đặt phòng nhanh.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[#E3DDD2] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#EDE7DD] text-[11px] font-bold uppercase tracking-wider text-stone-600">
                <tr>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4">Giấy tờ tùy thân</th>
                  <th className="px-6 py-4">Email & Quốc tịch</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-stone-700">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FCFAF7] transition-colors">
                    {/* Customer Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAF4EA] text-amber-900 font-serif font-bold text-sm border border-[#E7DAC4]">
                          {c.full_name[0]?.toUpperCase() || 'K'}
                        </div>
                        <div>
                          <div className="font-serif font-bold text-stone-900 text-sm">{c.full_name}</div>
                          {c.address && (
                            <div className="text-[11px] text-stone-400 line-clamp-1 mt-0.5">{c.address}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-6 py-4">
                      {c.phone ? (
                        <div className="flex items-center gap-2 font-medium text-stone-900">
                          <Phone className="h-3.5 w-3.5 text-amber-700" />
                          <span>{c.phone}</span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-xs">Chưa có SĐT</span>
                      )}
                    </td>

                    {/* ID Card */}
                    <td className="px-6 py-4">
                      {c.id_card_number ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F8F6F2] px-2.5 py-1 text-xs font-mono font-bold text-stone-800 border border-[#E3DDD2]">
                            <CreditCard className="h-3.5 w-3.5 text-amber-700" />
                            {c.id_card_number}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {c.id_card_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-400 italic text-xs">Chưa lưu CCCD</span>
                      )}
                    </td>

                    {/* Email & Nationality */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {c.email && (
                          <div className="flex items-center gap-2 text-xs text-stone-600">
                            <Mail className="h-3.5 w-3.5 text-amber-700" />
                            <span className="truncate max-w-[170px]">{c.email}</span>
                          </div>
                        )}
                        {c.nationality && (
                          <div className="flex items-center gap-2 text-[11px] text-stone-500">
                            <Globe className="h-3.5 w-3.5 text-stone-400" />
                            <span>{c.nationality}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="rounded-xl border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
                          title="Sửa khách hàng"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(c)}
                          className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                          title="Xóa khách hàng"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Thêm / Sửa Khách hàng */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCustomer={editingCustomer}
        onSuccess={() => fetchCustomers(searchTerm)}
      />
    </div>
  );
};
