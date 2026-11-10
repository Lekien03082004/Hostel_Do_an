import apiClient from './client';
import type { Customer } from '../types';

export interface CustomerQueryParams {
  search?: string;
  phone?: string;
}

export type CustomerPayload = Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>;

export const customersApi = {
  /**
   * Lấy danh sách khách hàng
   */
  getAll: (params?: CustomerQueryParams) =>
    apiClient.get<Customer[]>('/customers/', { params }),

  /**
   * Lấy thông tin chi tiết một khách hàng theo ID
   */
  getById: (id: number | string) =>
    apiClient.get<Customer>(`/customers/${id}/`),

  /**
   * Tạo hồ sơ khách hàng mới
   */
  create: (data: CustomerPayload) =>
    apiClient.post<Customer>('/customers/', data),

  /**
   * Cập nhật toàn bộ thông tin khách hàng (PUT)
   */
  update: (id: number | string, data: CustomerPayload) =>
    apiClient.put<Customer>(`/customers/${id}/`, data),

  /**
   * Cập nhật một phần thông tin khách hàng (PATCH)
   */
  patch: (id: number | string, data: Partial<CustomerPayload>) =>
    apiClient.patch<Customer>(`/customers/${id}/`, data),

  /**
   * Xóa hồ sơ khách hàng
   */
  delete: (id: number | string) =>
    apiClient.delete(`/customers/${id}/`),
};

export default customersApi;
