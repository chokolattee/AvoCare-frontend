/**
 * orderApi.ts
 * Front-end service layer for the Order endpoints.
 *
 * Matches Flask routes:
 *   POST   /api/orders/new          → newOrder()
 *   GET    /api/orders/me           → myOrders()
 *   GET    /api/orders/:id          → getSingleOrder()
 *   GET    /api/orders/all          → allOrders()   (admin)
 *   PUT    /api/orders/:id          → updateOrder() (admin)
 *   DELETE /api/orders/:id          → deleteOrder() (admin)
 *   PUT    /api/orders/:id/cancel   → cancelOrder()
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.1:5000/api';
//               ^ set EXPO_PUBLIC_API_URL in your .env file, e.g.:
//                 EXPO_PUBLIC_API_URL=http://192.168.1.100:5000/api

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrderItem {
  name: string;
  quantity: number;
  image: string;
  price: number;
  product: string;
}

export interface ShippingInfo {
  address: string;
  city: string;
  phoneNo: string;
  postalCode: string;
  country: string;
}

export interface PaymentInfo {
  id: string;
  status: string;
}

export interface Order {
  id: string;
  orderStatus: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paidAt?: string;
  createdAt?: string;
  updatedAt?: string;
  orderItems: OrderItem[];
  shippingInfo: ShippingInfo;
  paymentInfo?: PaymentInfo;
  user?: {
    _id: string;
    name?: string;
    email?: string;
  };
}

export interface NewOrderPayload {
  orderItems: OrderItem[];
  shippingInfo: ShippingInfo;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  paymentInfo: PaymentInfo;
}

// ─── Response wrappers ────────────────────────────────────────────────────────

interface SingleOrderResponse {
  success: boolean;
  order?: Order;
  message?: string;
}

interface OrderListResponse {
  success: boolean;
  orders?: Order[];
  totalAmount?: number;
  message?: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token =
    (await AsyncStorage.getItem('jwt')) ??
    (await AsyncStorage.getItem('token'));

  if (!token) {
    throw new Error('No auth token found. Please log in again.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    // Bypass ngrok browser-warning interception page
    'ngrok-skip-browser-warning': 'true',
  };
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  const url = `${BASE_URL}${path}`;

  // Only set Content-Type for requests that carry a body
  const hasBody = options.body !== undefined && options.body !== null;
  const allHeaders: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res = await fetch(url, {
    ...options,
    headers: allHeaders,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? `Request failed with status ${res.status}`);
  }

  return data as T;
}

export async function myOrdersApi(): Promise<OrderListResponse> {
  return apiFetch<OrderListResponse>('/api/orders/me', { method: 'GET' });
}

export async function getSingleOrderApi(id: string): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/api/orders/${id}`, { method: 'GET' });
}

export async function newOrderApi(payload: NewOrderPayload): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>('/api/orders/new', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function cancelOrderApi(id: string): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/api/orders/${id}/cancel`, {
    method: 'PUT',
  });
}

export async function allOrdersApi(): Promise<OrderListResponse> {
  return apiFetch<OrderListResponse>('/api/orders/all', { method: 'GET' });
}

export async function updateOrderApi(id: string, status: string): Promise<SingleOrderResponse> {
  return apiFetch<SingleOrderResponse>(`/api/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function deleteOrderApi(id: string): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/api/orders/${id}`, { method: 'DELETE' });
}