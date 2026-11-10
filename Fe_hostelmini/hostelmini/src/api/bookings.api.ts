import apiClient from './client';
import type { Booking, Service, BookingSource, BookingService } from '../types';

export interface BookingQueryParams {
  branch?: number | string;
  status?: string;
  search?: string;
  booking_source?: number | string;
  date_from?: string;
  date_to?: string;
}

export interface ServiceQueryParams {
  branch?: number | string;
  category?: string;
  is_active?: boolean;
  search?: string;
}

export interface AddServicePayload {
  detail_id: number;
  service_id: number;
  quantity: number;
  unit_price?: number;
  note?: string;
}

export const bookingsApi = {
  // === BOOKINGS (Đơn đặt phòng) ===
  getBookings: (params?: BookingQueryParams) =>
    apiClient.get<Booking[]>('/bookings/bookings/', { params }),

  getBookingById: (id: number | string) =>
    apiClient.get<Booking>(`/bookings/bookings/${id}/`),

  createBooking: (data: any) =>
    apiClient.post<Booking>('/bookings/bookings/', data),

  checkIn: (id: number | string) =>
    apiClient.post(`/bookings/bookings/${id}/check_in/`),

  checkOut: (id: number | string) =>
    apiClient.post(`/bookings/bookings/${id}/check_out/`),

  cancel: (id: number | string) =>
    apiClient.post(`/bookings/bookings/${id}/cancel/`),

  requestCheckIn: (id: number | string, data?: { note?: string; checkin_note?: string; [key: string]: any }) =>
    apiClient.post(`/bookings/bookings/${id}/request_checkin/`, data),

  requestCheckOut: (id: number | string, data?: { note?: string; checkout_note?: string; [key: string]: any }) =>
    apiClient.post(`/bookings/bookings/${id}/request_checkout/`, data),

  lookup: (params: { code?: string; phone?: string; q?: string; search?: string }) =>
    apiClient.get<Booking[]>('/bookings/bookings/lookup/', { params }),

  getMyBookings: () =>
    apiClient.get<Booking[]>('/bookings/bookings/my_bookings/'),

  addService: (bookingId: number | string, data: AddServicePayload) =>
    apiClient.post<BookingService>(`/bookings/bookings/${bookingId}/add_service/`, data),

  // === SERVICES (Dịch vụ khách sạn: ẩm thực, spa, giặt là...) ===
  getServices: (params?: ServiceQueryParams) =>
    apiClient.get<Service[]>('/bookings/services/', { params }),

  getServiceById: (id: number | string) =>
    apiClient.get<Service>(`/bookings/services/${id}/`),

  createService: (data: Partial<Service>) =>
    apiClient.post<Service>('/bookings/services/', data),

  updateService: (id: number | string, data: Partial<Service>) =>
    apiClient.put<Service>(`/bookings/services/${id}/`, data),

  patchService: (id: number | string, data: Partial<Service>) =>
    apiClient.patch<Service>(`/bookings/services/${id}/`, data),

  deleteService: (id: number | string) =>
    apiClient.delete(`/bookings/services/${id}/`),

  uploadServiceImage: (formData: FormData) =>
    apiClient.post<{ image_url: string }>('/bookings/services/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // === BOOKING SOURCES (Nguồn đặt phòng) ===
  getBookingSources: () =>
    apiClient.get<BookingSource[]>('/bookings/sources/'),
};

export default bookingsApi;
