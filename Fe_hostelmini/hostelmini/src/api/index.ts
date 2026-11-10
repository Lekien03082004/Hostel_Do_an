export { default as apiClient } from './client';

export { authApi } from './auth.api';
export type { LoginInput, RegisterInput } from './auth.api';

export { branchesApi } from './branches.api';
export type { BranchQueryParams, BranchPayload } from './branches.api';

export { staffApi } from './staff.api';
export type { CreateUserInput, UpdateUserInput } from './staff.api';

export { customersApi } from './customers.api';
export type { CustomerQueryParams, CustomerPayload } from './customers.api';

export { roomsApi } from './rooms.api';
export type {
  RoomQueryParams,
  AvailableRoomsQueryParams,
  RoomPayload,
  RoomTypePayload,
  RoomPricePayload,
} from './rooms.api';

export { bookingsApi } from './bookings.api';
export type {
  BookingQueryParams,
  ServiceQueryParams,
  AddServicePayload,
} from './bookings.api';

export { billingApi } from './billing.api';
export type {
  InvoiceQueryParams,
  PaymentPayload,
  BranchRevenueReport,
  MonthlyTrendItem,
  ServiceCategoryRevenue,
  PaymentMethodRevenue,
  RevenueAnalyticsResponse,
  RevenueAnalyticsParams,
} from './billing.api';
