import apiClient from './client';
import type { SystemUser, User } from '../types';

export interface CreateUserInput {
  username: string;
  password?: string;
  full_name: string;
  email?: string;
  phone?: string;
  role?: string;
  branch_id?: string | number | null;
  is_active?: boolean;
}

export interface UpdateUserInput {
  full_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  branch_id?: string | number | null;
  is_active?: boolean;
}

export const staffApi = {
  /**
   * Lấy danh sách tài khoản hệ thống (admin, manager, lễ tân, nhân viên, user)
   */
  getUsers: (params?: { search?: string; role?: string; is_active?: boolean }) =>
    apiClient.get<SystemUser[]>('/staff/users/', { params }),

  /**
   * Lấy thông tin chi tiết một người dùng theo ID
   */
  getUserById: (id: number | string) =>
    apiClient.get<SystemUser>(`/staff/users/${id}/`),

  /**
   * Tạo tài khoản người dùng / nhân viên mới
   */
  createUser: (data: CreateUserInput) =>
    apiClient.post<SystemUser>('/staff/users/', data),

  /**
   * Cập nhật toàn bộ thông tin tài khoản người dùng (PUT)
   */
  updateUser: (id: number | string, data: UpdateUserInput) =>
    apiClient.put<SystemUser>(`/staff/users/${id}/`, data),

  /**
   * Cập nhật một phần thông tin tài khoản người dùng (PATCH)
   */
  patchUser: (id: number | string, data: Partial<UpdateUserInput>) =>
    apiClient.patch<SystemUser>(`/staff/users/${id}/`, data),

  /**
   * Xóa một tài khoản khỏi hệ thống
   */
  deleteUser: (id: number | string) =>
    apiClient.delete(`/staff/users/${id}/`),

  /**
   * Lấy thông tin tài khoản hiện tại từ app staff
   */
  getStaffMe: () =>
    apiClient.get<User>('/staff/me/'),

  /**
   * Lấy danh sách chức vụ / vai trò (Roles)
   */
  getRoles: () =>
    apiClient.get('/staff/roles/'),

  /**
   * Lấy danh sách hồ sơ nhân viên (Employees)
   */
  getEmployees: (params?: { branch?: number | string }) =>
    apiClient.get('/staff/employees/', { params }),
};

export default staffApi;
