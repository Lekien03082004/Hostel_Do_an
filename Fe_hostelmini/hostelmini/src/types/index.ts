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
  is_active: boolean;
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
