import apiClient from './client';
import type { Room, RoomType, RoomPrice, Season } from '../types';

export interface RoomQueryParams {
  branch?: number | string;
  room_type?: number | string;
  status?: string;
  is_active?: boolean;
  search?: string;
  page?: number | string;
  page_size?: number | string;
  guests?: number | string;
  [key: string]: any;
}

export interface RoomTypeQueryParams {
  branch?: number | string;
  is_active?: boolean;
  page?: number | string;
  page_size?: number | string;
  guests?: number | string;
  search?: string;
  [key: string]: any;
}

export interface AvailableRoomsQueryParams {
  branch?: number | string;
  check_in: string;
  check_out: string;
  room_type?: number | string;
}

export type RoomPayload = Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>;
export type RoomTypePayload = Partial<Omit<RoomType, 'id' | 'created_at' | 'updated_at' | 'images'>> & {
  images?: Array<{
    id?: number;
    room_type?: number;
    image_url: string;
    is_primary?: boolean;
    sort_order?: number;
  }>;
};
export type RoomPricePayload = Partial<Omit<RoomPrice, 'id' | 'created_at' | 'updated_at'>>;

export const roomsApi = {
  // === ROOMS (Phòng) ===
  getRooms: (params?: RoomQueryParams) =>
    apiClient.get<Room[]>('/rooms/rooms/', { params }),

  getRoomById: (id: number | string) =>
    apiClient.get<Room>(`/rooms/rooms/${id}/`),

  getAvailableRooms: (params: AvailableRoomsQueryParams) =>
    apiClient.get<Room[]>('/rooms/rooms/available/', { params }),

  createRoom: (data: RoomPayload) =>
    apiClient.post<Room>('/rooms/rooms/', data),

  updateRoom: (id: number | string, data: RoomPayload) =>
    apiClient.put<Room>(`/rooms/rooms/${id}/`, data),

  patchRoom: (id: number | string, data: Partial<RoomPayload>) =>
    apiClient.patch<Room>(`/rooms/rooms/${id}/`, data),

  deleteRoom: (id: number | string) =>
    apiClient.delete(`/rooms/rooms/${id}/`),

  // === ROOM TYPES (Hạng phòng) ===
  getRoomTypes: (params?: RoomTypeQueryParams) =>
    apiClient.get<RoomType[]>('/rooms/types/', { params }),

  getRoomTypeById: (id: number | string) =>
    apiClient.get<RoomType>(`/rooms/types/${id}/`),

  createRoomType: (data: RoomTypePayload) =>
    apiClient.post<RoomType>('/rooms/types/', data),

  updateRoomType: (id: number | string, data: RoomTypePayload) =>
    apiClient.put<RoomType>(`/rooms/types/${id}/`, data),

  patchRoomType: (id: number | string, data: Partial<RoomTypePayload>) =>
    apiClient.patch<RoomType>(`/rooms/types/${id}/`, data),

  deleteRoomType: (id: number | string) =>
    apiClient.delete(`/rooms/types/${id}/`),

  // === ROOM PRICES (Bảng giá phòng) ===
  getRoomPrices: (params?: { branch?: number | string; room_type?: number | string; rate_type?: string }) =>
    apiClient.get<RoomPrice[]>('/rooms/prices/', { params }),

  createRoomPrice: (data: RoomPricePayload) =>
    apiClient.post<RoomPrice>('/rooms/prices/', data),

  updateRoomPrice: (id: number | string, data: RoomPricePayload) =>
    apiClient.put<RoomPrice>(`/rooms/prices/${id}/`, data),

  deleteRoomPrice: (id: number | string) =>
    apiClient.delete(`/rooms/prices/${id}/`),

  // === SEASONS (Mùa giá) ===
  getSeasons: () =>
    apiClient.get<Season[]>('/rooms/seasons/'),

  // === IMAGE UPLOADS ===
  uploadRoomImage: (formData: FormData) =>
    apiClient.post<{ image_url: string }>('/rooms/images/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default roomsApi;
