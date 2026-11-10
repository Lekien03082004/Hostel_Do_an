import apiClient from './client';
import type { Invoice, Payment } from '../types';

export interface InvoiceQueryParams {
  booking?: number | string;
  status?: string;
  search?: string;
}

export interface PaymentPayload {
  invoice: number;
  payment_method: 'cash' | 'bank_transfer' | 'credit_card' | 'e_wallet' | 'other' | string;
  payment_type: 'deposit' | 'partial' | 'full' | 'refund' | string;
  amount: number;
  reference_no?: string;
  note?: string;
}

export interface BranchRevenueReport {
  branch_id: number;
  branch_name: string;
  branch_code: string;
  total_revenue: number;
  room_revenue: number;
  service_revenue: number;
  paid_amount: number;
  remaining_amount: number;
  invoices_count: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month: number;
  label: string;
  total_revenue: number;
  room_revenue: number;
  service_revenue: number;
  paid_amount: number;
  invoices_count: number;
  by_branch: Record<string, number>;
}

export interface ServiceCategoryRevenue {
  category: string;
  category_name: string;
  amount: number;
}

export interface PaymentMethodRevenue {
  method: string;
  method_name: string;
  amount: number;
}

export interface RevenueAnalyticsResponse {
  year: number;
  month: string | number;
  branch_id: string | number;
  total_revenue: number;
  room_revenue: number;
  service_revenue: number;
  paid_amount: number;
  remaining_amount: number;
  invoices_count: number;
  branch_reports: BranchRevenueReport[];
  monthly_trend: MonthlyTrendItem[];
  service_categories: ServiceCategoryRevenue[];
  payment_methods: PaymentMethodRevenue[];
  invoices_by_status: Array<{ status: string; label: string; count: number }>;
}

export interface RevenueAnalyticsParams {
  year?: number | string;
  month?: number | string;
  branch_id?: number | string;
}

export const billingApi = {
  // === INVOICES (Hóa đơn) ===
  getInvoices: (params?: InvoiceQueryParams) =>
    apiClient.get<Invoice[]>('/billing/invoices/', { params }),

  getInvoiceById: (id: number | string) =>
    apiClient.get<Invoice>(`/billing/invoices/${id}/`),

  recalculateInvoice: (id: number | string) =>
    apiClient.post<Invoice>(`/billing/invoices/${id}/recalculate/`),

  // === REVENUE ANALYTICS & REPORTS (Báo cáo doanh thu chuỗi chi nhánh) ===
  getAnalytics: (params?: RevenueAnalyticsParams) =>
    apiClient.get<RevenueAnalyticsResponse>('/billing/invoices/analytics/', { params }),

  // === PAYMENTS (Thanh toán & Thu tiền) ===
  getPayments: (params?: { invoice?: number | string }) =>
    apiClient.get<Payment[]>('/billing/payments/', { params }),

  createPayment: (data: PaymentPayload) =>
    apiClient.post<Payment>('/billing/payments/', data),
};

export default billingApi;
