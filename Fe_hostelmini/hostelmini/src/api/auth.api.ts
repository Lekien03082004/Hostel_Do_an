import apiClient from './client';
import type { User, LoginResponse, RegisterResponse, AuthTokens } from '../types';

export interface RegisterInput {
  username: string;
  password: string;
  full_name: string;
  email?: string;
  phone?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export const authApi = {
  /**
   * Đăng nhập người dùng bằng username và password
   */
  login: (data: LoginInput) =>
    apiClient.post<LoginResponse>('/auth/login/', data),

  /**
   * Đăng ký tài khoản khách hàng mới
   */
  register: (data: RegisterInput) =>
    apiClient.post<RegisterResponse>('/auth/register/', data),

  /**
   * Làm mới access token bằng refresh token
   */
  refreshToken: (refresh: string) =>
    apiClient.post<AuthTokens>('/auth/refresh/', { refresh }),

  /**
   * Lấy thông tin tài khoản hiện tại kèm profile nhân viên/khách hàng
   */
  getCurrentUser: () =>
    apiClient.get<User>('/auth/me/'),

  /**
   * Cập nhật thông tin tài khoản cá nhân
   */
  updateCurrentUser: (data: Partial<User>) =>
    apiClient.patch<User>('/auth/me/', data),
};

export default authApi;
