import apiClient from './client';
import type { Branch } from '../types';

export interface BranchQueryParams {
  is_active?: boolean;
  search?: string;
}

export type BranchPayload = Partial<Omit<Branch, 'id' | 'created_at' | 'updated_at'>>;

export const branchesApi = {
  /**
   * Lấy danh sách tất cả các chi nhánh
   */
  getAll: (params?: BranchQueryParams) =>
    apiClient.get<Branch[]>('/branches/', { params }),

  /**
   * Lấy thông tin chi tiết một chi nhánh theo ID
   */
  getById: (id: number | string) =>
    apiClient.get<Branch>(`/branches/${id}/`),

  /**
   * Tạo mới một chi nhánh
   */
  create: (data: BranchPayload) =>
    apiClient.post<Branch>('/branches/', data),

  /**
   * Cập nhật toàn bộ thông tin chi nhánh (PUT)
   */
  update: (id: number | string, data: BranchPayload) =>
    apiClient.put<Branch>(`/branches/${id}/`, data),

  /**
   * Cập nhật một phần thông tin chi nhánh (PATCH)
   */
  patch: (id: number | string, data: Partial<BranchPayload>) =>
    apiClient.patch<Branch>(`/branches/${id}/`, data),

  /**
   * Xóa một chi nhánh
   */
  delete: (id: number | string) =>
    apiClient.delete(`/branches/${id}/`),

  /**
   * Tải ảnh đại diện chi nhánh
   */
  uploadImage: (formData: FormData) =>
    apiClient.post<{ image_url: string }>('/rooms/images/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default branchesApi;
