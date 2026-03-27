/**
 * CellTech API client
 *
 * All prices from the backend are in CENTS (Int).
 * Divide by 100 at the display layer. wholesalePrice === 0 means "Contact for Price".
 *
 * Field name contract (backend → frontend):
 *   partName        = human-readable part name
 *   wholesalePrice  = price in cents (Int). 0 = Contact for Price.
 *   stockLevel      = units in stock
 *   skuId           = Smart SKU string (primary key)
 *   label / value   = specification key/value pairs
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://ctir-backendv1-official.vercel.app';

// ---------------------------------------------------------------------------
// Shared fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API error ${res.status}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Response envelope
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---------------------------------------------------------------------------
// Device Hierarchy
// ---------------------------------------------------------------------------

export interface HierarchyVariant {
  id: string;
  marketingName: string;
  modelNumber?: string | null;
}

export interface HierarchyGeneration {
  id: string;
  name: string;
  releaseYear?: number | null;
  variants: HierarchyVariant[];
}

export interface HierarchyModelType {
  id: string;
  name: string;
  generations: HierarchyGeneration[];
}

export interface HierarchyBrand {
  id: string;
  name: string;
  models: HierarchyModelType[];
}

export async function fetchHierarchy(): Promise<HierarchyBrand[]> {
  try {
    const res = await apiFetch<ApiResponse<HierarchyBrand[]>>('/api/hierarchy');
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return [];
  }
}

export async function fetchBrands(): Promise<Array<{ id: string; name: string }>> {
  try {
    const res = await apiFetch<ApiResponse<Array<{ id: string; name: string }>>>('/api/brands');
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

export async function fetchModels(
  brandId?: string
): Promise<Array<{ id: string; name: string; brandId: string }>> {
  try {
    const url = brandId ? `/api/models?brandId=${brandId}` : '/api/models';
    const res = await apiFetch<ApiResponse<Array<{ id: string; name: string; brandId: string }>>>(url);
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching models:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Inventory (Smart SKUs)
// All prices in CENTS. wholesalePrice === 0 → "Contact for Price"
// ---------------------------------------------------------------------------

export interface InventoryItem {
  skuId: string;
  partName: string;
  category: string;
  categoryId: string;
  wholesalePrice: number; // CENTS
  stockLevel: number;
  qualityGrade: 'OEM' | 'Premium' | 'Aftermarket' | 'U' | 'NA';
  specifications?: Array<{ label: string; value: string }>;
  compatibilities?: Array<{
    variantId: string;
    variant: {
      id: string;
      marketingName: string;
      modelNumber?: string | null;
    };
  }>;
}

export async function fetchInventory(): Promise<InventoryItem[]> {
  try {
    const res = await apiFetch<ApiResponse<InventoryItem[]>>('/api/inventory');
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return [];
  }
}

export async function fetchInventoryByModel(modelId: string): Promise<InventoryItem[]> {
  try {
    const res = await apiFetch<ApiResponse<InventoryItem[]>>(
      `/api/inventory/model/${modelId}`
    );
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching inventory by model:', error);
    return [];
  }
}

export async function fetchInventoryBySku(skuId: string): Promise<InventoryItem | null> {
  try {
    const res = await apiFetch<ApiResponse<InventoryItem>>(`/api/inventory/${skuId}`);
    return res.data ?? null;
  } catch (error) {
    console.error('Error fetching inventory by SKU:', error);
    return null;
  }
}

/** @deprecated Use fetchInventoryBySku */
export const fetchPartBySku = fetchInventoryBySku;

export async function fetchPartsForVariant(variantId: string): Promise<InventoryItem[]> {
  try {
    const res = await apiFetch<ApiResponse<InventoryItem[]>>(
      `/api/inventory/variants/${variantId}/parts`
    );
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching parts for variant:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Part detail (product page)
// Returns the full inventory item including specs + compat map
// ---------------------------------------------------------------------------

export interface PartDetail {
  skuId: string;
  partName: string;
  category: string;
  wholesalePrice: number; // CENTS — 0 = "Contact for Price"
  stockLevel: number;
  qualityGrade: string;
  specifications: Array<{ label: string; value: string }>;
  compatibilities: Array<{
    variantId: string;
    variant: {
      id: string;
      marketingName: string;
      modelNumber?: string | null;
      generation?: {
        name: string;
        modelType?: { name: string; brand?: { name: string } };
      };
    };
  }>;
}

export async function getPartDetails(
  skuId: string
): Promise<{ part: PartDetail } | null> {
  try {
    const res = await apiFetch<ApiResponse<PartDetail>>(`/api/inventory/${skuId}`);
    if (!res.data) return null;
    return { part: res.data };
  } catch (error) {
    console.error('Error fetching part details:', error);
    return null;
  }
}

export async function getCompatibility(skuId: string) {
  try {
    const res = await apiFetch<ApiResponse<unknown>>(`/api/compatibility/${skuId}`);
    return res;
  } catch (error) {
    console.error('Error fetching compatibility:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Catalog search
// ---------------------------------------------------------------------------

export async function searchParts(query: string): Promise<InventoryItem[]> {
  try {
    const res = await apiFetch<ApiResponse<InventoryItem[]>>(
      `/api/parts?device=${encodeURIComponent(query)}`
    );
    return res.data ?? [];
  } catch (error) {
    console.error('Error searching parts:', error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Cart (server-side sync — optional, cart is primarily client-side Zustand)
// ---------------------------------------------------------------------------

export interface CartItem {
  skuId: string;
  quantity: number;
  inventory?: InventoryItem;
}

export async function fetchCart(token: string): Promise<CartItem[]> {
  try {
    const res = await apiFetch<ApiResponse<CartItem[]>>('/api/cart', {}, token);
    return res.data ?? [];
  } catch (error) {
    console.error('Error fetching cart:', error);
    return [];
  }
}

export async function addToCart(
  skuId: string,
  quantity: number,
  token: string
): Promise<boolean> {
  try {
    await apiFetch('/api/cart', {
      method: 'POST',
      body: JSON.stringify({ skuId, quantity }),
    }, token);
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
}

export async function validateCart(token: string) {
  try {
    const res = await apiFetch<ApiResponse<unknown>>('/api/cart/validate', {
      method: 'POST',
    }, token);
    return res;
  } catch (error) {
    console.error('Error validating cart:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export interface CheckoutResult {
  orderId: string;
  totalCents: number;
  status: string;
  guestCustomId?: string; // Present if guest checkout
  stripeClientSecret?: string; // Present if Stripe PaymentIntent created
}

export async function createCheckout(
  token: string | null,
  guestEmail?: string
): Promise<CheckoutResult | null> {
  try {
    const body: Record<string, string> = {};
    if (guestEmail) body.guestEmail = guestEmail;

    const res = await apiFetch<ApiResponse<CheckoutResult>>(
      '/api/checkout',
      { method: 'POST', body: JSON.stringify(body) },
      token
    );
    return res.data ?? null;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error; // Re-throw so checkout form can show error message
  }
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  totalCents: number; // CENTS
  createdAt: string;
  lines: Array<{
    id: string;
    skuId: string;
    quantity: number;
    unitPriceAtPurchase: number; // CENTS
    partNameSnapshot?: string;
    qualityGradeSnapshot?: string;
  }>;
}

export async function fetchOrders(
  token: string,
  page = 1,
  limit = 10
): Promise<{ orders: Order[]; meta: PaginationMeta | null }> {
  try {
    const res = await apiFetch<ApiResponse<Order[]>>(
      `/api/orders?page=${page}&limit=${limit}`,
      {},
      token
    );
    return { orders: res.data ?? [], meta: res.meta ?? null };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { orders: [], meta: null };
  }
}

export async function fetchOrderDetail(
  orderId: string,
  token: string
): Promise<Order | null> {
  try {
    const res = await apiFetch<ApiResponse<Order>>(`/api/orders/${orderId}`, {}, token);
    return res.data ?? null;
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string;
  clerkId: string | null;
  email: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  role: 'BUYER' | 'ADMIN';
  isGuest: boolean;
  customId: string | null;
  createdAt: string;
}

export async function fetchUserProfile(token: string): Promise<UserProfile | null> {
  try {
    const res = await apiFetch<ApiResponse<UserProfile>>('/api/users/profile', {}, token);
    return res.data ?? null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(
  token: string,
  data: { name?: string; company?: string; phone?: string }
): Promise<UserProfile | null> {
  try {
    const res = await apiFetch<ApiResponse<UserProfile>>(
      '/api/users/profile',
      { method: 'PUT', body: JSON.stringify(data) },
      token
    );
    return res.data ?? null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export type HealthStatus = 'green' | 'yellow' | 'red';

export interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latencyMs: number; // -1 when DOWN (null from backend mapped to -1)
  message: string;
}

export interface SystemHealth {
  status: HealthStatus;
  timestamp: string;
  environment: string;
  uptime: number;
  services: ServiceHealth[];
}

/**
 * Maps backend UP/DOWN + latencyMs → frontend green/yellow/red.
 * GREEN:  UP + latency < 500ms
 * YELLOW: UP + latency >= 500ms (high latency warning)
 * RED:    DOWN
 */
function mapServiceStatus(
  backendStatus: 'UP' | 'DOWN',
  latencyMs: number | null
): HealthStatus {
  if (backendStatus === 'DOWN') return 'red';
  if (latencyMs !== null && latencyMs >= 500) return 'yellow';
  return 'green';
}

export async function fetchSystemHealth(token?: string): Promise<SystemHealth | null> {
  try {
    const res = await apiFetch<{
      status: string;
      timestamp: string;
      environment: string;
      uptime?: number;
      services: Record<string, {
        name: string;
        status: 'UP' | 'DOWN';
        latencyMs: number | null;
        message: string;
      }>;
    }>('/api/health/detailed', {}, token);

    // Map the object-keyed services → array for the UI
    const services: ServiceHealth[] = Object.values(res.services).map((svc) => ({
      name: svc.name,
      status: mapServiceStatus(svc.status, svc.latencyMs),
      latencyMs: svc.latencyMs ?? -1,
      message: svc.message,
    }));

    // Compute overall status from services
    const hasRed = services.some((s) => s.status === 'red');
    const hasYellow = services.some((s) => s.status === 'yellow');
    const overallStatus: HealthStatus = hasRed ? 'red' : hasYellow ? 'yellow' : 'green';

    return {
      status: overallStatus,
      timestamp: res.timestamp,
      environment: res.environment ?? 'production',
      uptime: res.uptime ?? 0,
      services,
    };
  } catch (error) {
    console.error('Error fetching system health:', error);
    return null;
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Quote requests
// ---------------------------------------------------------------------------

export async function submitQuoteRequest(data: {
  email: string;
  company: string;
  phone?: string;
  items: Array<{ description: string; quantity: number }>;
  notes?: string;
}): Promise<{ quoteRequestId: string } | null> {
  try {
    const res = await apiFetch<ApiResponse<{ id: string }>>(
      '/api/quote',
      { method: 'POST', body: JSON.stringify(data) }
    );
    return res.data ? { quoteRequestId: res.data.id } : null;
  } catch (error) {
    console.error('Error submitting quote request:', error);
    return null;
  }
}
