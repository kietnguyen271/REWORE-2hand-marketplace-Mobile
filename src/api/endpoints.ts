import { api, dataOf } from '@/api/client';
import type { Address, Auction, CartItem, Order, Product, SellerPermission, Subscription, User, WishlistItem } from '@/types/domain';

export type LoginResult =
  | { success?: true; token?: string; accessToken?: string; user?: User }
  | { success: false; requiresOtp: true; email: string; message?: string };

export const authApi = {
  register: (payload: Record<string, unknown>) => api.post('/api/auth/register', payload).then(dataOf),
  verifyOtp: (payload: { email: string; otp: string }) => api.post('/api/auth/verify-otp', payload).then(dataOf),
  resendOtp: (payload: { email: string }) => api.post('/api/auth/resend-otp', payload).then(dataOf),
  login: (payload: { email: string; password: string }) => api.post<LoginResult>('/api/auth/login', payload).then(dataOf),
  me: () => api.get<User | { user: User }>('/api/auth/me').then(dataOf),
  logout: () => api.post('/api/auth/logout').then(dataOf),
};

export const productsApi = {
  list: (params?: Record<string, unknown>) => api.get('/api/products', { params }).then(dataOf),
  detail: (id: string) => api.get<Product>(`/api/products/${id}`).then(dataOf),
  create: (payload: FormData) => api.post<Product>('/api/products', payload).then(dataOf),
  update: (id: string, payload: FormData) => api.patch<Product>(`/api/products/${id}`, payload).then(dataOf),
  remove: (id: string) => api.delete(`/api/products/${id}`).then(dataOf),
};

export const cartApi = {
  list: () => api.get<CartItem[] | { items?: CartItem[] }>('/api/cart').then(dataOf),
  add: (productId: string) => api.post('/api/cart', { productId }).then(dataOf),
  remove: (productId: string) => api.delete(`/api/cart/${productId}`).then(dataOf),
  check: (productId: string) => api.get(`/api/cart/check/${productId}`).then(dataOf),
};

export const wishlistApi = {
  list: () => api.get<WishlistItem[] | { items?: WishlistItem[] }>('/api/wishlist').then(dataOf),
  add: (productId: string) => api.post('/api/wishlist', { productId }).then(dataOf),
  remove: (productId: string) => api.delete(`/api/wishlist/${productId}`).then(dataOf),
  check: (productId: string) => api.get(`/api/wishlist/check/${productId}`).then(dataOf),
};

export const ordersApi = {
  list: (role: 'buyer' | 'seller') => api.get<Order[] | { orders?: Order[] }>('/api/orders', { params: { role } }).then(dataOf),
  create: (payload: { productId?: string; productIds?: string[]; address: Address }) => api.post<Order>('/api/orders', payload).then(dataOf),
  updateStatus: (id: string, status: string) => api.patch(`/api/orders/${id}/status`, { status }).then(dataOf),
};

export const sellerApi = {
  application: () => api.get('/api/seller/application').then(dataOf),
  apply: (payload: FormData) => api.post('/api/seller/application', payload).then(dataOf),
  auctionEligibility: () => api.get('/api/seller/auction-eligibility').then(dataOf),
  subscription: () => api.get<Subscription>('/api/seller/subscription').then(dataOf),
  requestSubscription: () => api.post('/api/seller/subscription-requests').then(dataOf),
  staff: () => api.get('/api/seller/staff').then(dataOf),
  inviteStaff: (payload: { email: string; permissions: SellerPermission[] }) => api.post('/api/seller/staff', payload).then(dataOf),
  revokeStaff: (id: string) => api.delete(`/api/seller/staff/${id}`).then(dataOf),
};

export const auctionsApi = {
  list: () => api.get<Auction[] | { auctions?: Auction[] }>('/api/auctions').then(dataOf),
  create: (payload: Record<string, unknown>) => api.post<Auction>('/api/auctions', payload).then(dataOf),
};

export const usersApi = {
  detail: (sellerId: string) => api.get<User & { sellerProfile?: unknown }>(`/api/users/${sellerId}`).then(dataOf),
};

export const reportsApi = {
  create: (payload: Record<string, unknown>) => api.post('/api/reports', payload).then(dataOf),
  mine: () => api.get('/api/reports/my').then(dataOf),
};
