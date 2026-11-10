export interface UserEmployee {
  id: number;
  employee_code: string;
  full_name: string;
  phone?: string;
  role?: string | null;
  role_name?: string | null;
  branch_id?: number | null;
  branch_code?: string | null;
  branch_name?: string | null;
  avatar_url?: string | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  employee?: UserEmployee | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface SystemUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login?: string | null;
  role_code: 'admin' | 'manager' | 'receptionist' | 'housekeeping' | 'user' | string;
  role_name: string;
  branch_id?: number | null;
  branch_name?: string | null;
  employee_code?: string;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  address: string;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  total_floors?: number | null;
  image_url?: string | null;
  is_active: boolean;
  rooms_count?: number;
  active_rooms_count?: number;
  manager_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  id_card_number?: string | null;
  id_card_type?: "cccd" | "cmnd" | "passport" | "other" | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  address?: string | null;
  note?: string | null;
  created_at: string;
  updated_at: string;
}

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked';

export interface RoomImage {
  id: number;
  room_type: number;
  branch?: number | null;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
  created_at?: string;
}

export interface RoomType {
  id: number;
  name: string;
  description?: string | null;
  max_occupancy: number;
  bed_type?: string | null;
  area_sqm?: string | number | null;
  images?: RoomImage[];
  created_at?: string;
  updated_at?: string;
}

export interface Room {
  id: number;
  branch: number;
  branch_code?: string;
  branch_name?: string;
  room_type: number;
  room_type_name?: string;
  max_occupancy?: number;
  bed_type?: string | null;
  area_sqm?: string | number | null;
  room_type_description?: string | null;
  room_number: string;
  floor?: number | null;
  status: RoomStatus;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  total_pages?: number;
  current_page?: number;
  page_size?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

export interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  priority: number;
  created_at?: string;
  updated_at?: string;
}

export type RateType = 'hourly' | 'daily' | 'monthly';

export interface RoomPrice {
  id: number;
  branch: number;
  branch_code?: string;
  branch_name?: string;
  room_type: number;
  room_type_name?: string;
  season?: number | null;
  season_name?: string | null;
  rate_type: RateType;
  price: string | number;
  first_hours?: number | null;
  extra_hour_price?: string | number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
export type BookingDetailStatus = 'booked' | 'checked_in' | 'checked_out' | 'cancelled';

export interface BookingSource {
  id: number;
  name: string;
  source_type: 'direct' | 'ota' | 'phone' | 'walk_in' | 'other';
  commission_rate: string | number;
  is_active: boolean;
  created_at?: string;
}

export type ServiceCategory =
  | 'food_beverage'
  | 'laundry'
  | 'spa_wellness'
  | 'transport'
  | 'room_amenities'
  | 'other';

export interface Service {
  id: number;
  branch?: number | null;
  branch_name?: string | null;
  category?: ServiceCategory;
  category_display?: string;
  name: string;
  unit: string;
  price: string | number;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
}

export interface BookingService {
  id: number;
  booking_detail: number;
  service: number;
  service_name?: string;
  service_unit?: string;
  quantity: number;
  unit_price: string | number;
  total_price?: string | number;
  used_at?: string;
}

export interface BookingDetail {
  id: number;
  booking: number;
  room: number;
  room_number?: string;
  room_type_name?: string;
  rate_type: RateType;
  check_in_planned: string;
  check_out_planned: string;
  check_in_actual?: string | null;
  check_out_actual?: string | null;
  unit_price: string | number;
  adults: number;
  children: number;
  status: BookingDetailStatus;
  services_used?: BookingService[];
  created_at?: string;
}

export interface Booking {
  id: number;
  booking_code: string;
  branch: number;
  branch_code?: string;
  branch_name?: string;
  customer: Customer;
  booking_source: number;
  booking_source_name?: string;
  created_by_employee?: number | null;
  created_by_name?: string | null;
  status: BookingStatus;
  booked_at?: string;
  note?: string | null;
  checkin_requested?: boolean;
  checkin_request_time?: string | null;
  checkin_note?: string | null;
  checkout_requested?: boolean;
  checkout_request_time?: string | null;
  checkout_note?: string | null;
  details: BookingDetail[];
  created_at?: string;
  updated_at?: string;
}

export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';

export interface Payment {
  id: number;
  invoice: number;
  invoice_code?: string;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'e_wallet' | 'other';
  payment_type: 'deposit' | 'partial' | 'full' | 'refund';
  amount: string | number;
  received_by_employee?: number | null;
  received_by_name?: string | null;
  reference_no?: string | null;
  note?: string | null;
  paid_at?: string;
  created_at?: string;
}

export interface Invoice {
  id: number;
  invoice_code: string;
  booking: number;
  booking_code?: string;
  customer_name?: string;
  branch_name?: string;
  subtotal_rooms: string | number;
  subtotal_services: string | number;
  discount_amount: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  paid_amount: string | number;
  remaining_amount: number;
  status: InvoiceStatus;
  payments?: Payment[];
  issued_at?: string;
  created_at?: string;
  updated_at?: string;
}
