import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.1:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewImage {
  public_id: string;
  url: string;
}

export interface ReviewProduct {
  _id: string;
  name: string;
  price: number;
  /**
   * Product images.  The backend (review_controller.review_to_dict) normalises
   * these from plain Cloudinary URL strings to { public_id, url } objects so
   * that getProductImageUrl() can reliably read `.url` on every item.
   */
  images?: ReviewImage[];
  ratings?: number;
  num_of_reviews?: number;
}

export interface ReviewOrder {
  _id: string;
  orderStatus?: string;
  createdAt?: string;
}

export interface ReviewUser {
  _id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar?: string;
}

/**
 * Unified Review shape.
 * The backend serialises both `id` and `_id` with the same value; we expose
 * both here so the screen can use `_id` (Mongo style) without mapping.
 */
export interface Review {
  /** Mongo-style alias returned by the backend (`_id` field). */
  _id: string;
  /** Duplicate of `_id` — also returned by the backend (`id` field). */
  id: string;
  rating: number;
  comment: string;
  images: ReviewImage[];
  isArchived: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  product?: ReviewProduct;
  order?: ReviewOrder | string;
  user?: ReviewUser;
}

export interface CreateReviewPayload {
  rating: number;
  comment: string;
  /** Mongo ObjectId string for the product being reviewed. */
  productId: string;
  /** Mongo ObjectId string for the delivered order. */
  orderId: string;
  /** Local file URIs selected via expo-image-picker (max 5). */
  imageUris?: string[];
}

export interface UpdateReviewPayload {
  rating?: number;
  comment?: string;
  /**
   * New image URIs to upload (local device paths from expo-image-picker).
   * These are appended to whichever existing images are listed in
   * `keepImagePublicIds`.  Total is capped at 5 by the backend.
   */
  imageUris?: string[];
  /**
   * Cloudinary public_ids of the existing review images the user wants to
   * keep.  Any existing image whose public_id is NOT in this list will be
   * deleted from Cloudinary before new uploads are appended.
   * Pass an empty array to remove all existing images.
   */
  keepImagePublicIds?: string[];
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface SingleReviewResponse {
  success: boolean;
  data?: Review;
  message?: string;
}

export interface ReviewListResponse {
  success: boolean;
  /** Used by /reviews/me and /admin/reviews/archived */
  data?: Review[];
  /** Used by /review?id=... (public) and /review/product (admin) */
  reviews?: Review[];
  count?: number;
  message?: string;
  averageRating?: {
    average: number;
    total: number;
  };
  pagination?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface BaseResponse {
  success: boolean;
  message?: string;
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token =
    (await AsyncStorage.getItem('jwt')) ??
    (await AsyncStorage.getItem('token'));
  if (!token) throw new Error('No auth token found. Please log in again.');
  return {
    Authorization: `Bearer ${token}`,
    'ngrok-skip-browser-warning': 'true',
  };
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

/**
 * Thin wrapper around `fetch` that:
 *  - Injects auth headers automatically.
 *  - Sets `Content-Type: application/json` for non-FormData bodies.
 *  - Throws a descriptive Error when the server returns a non-2xx status.
 *
 * ⚠️  Never pass `Content-Type` manually for FormData bodies — fetch adds the
 *     `multipart/form-data; boundary=...` header automatically.  Setting it
 *     manually strips the boundary and Flask cannot parse the request.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const isFormData  = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(!isFormData && options.body ? { 'Content-Type': 'application/json' } : {}),
    ...authHeaders,
    // Allow callers to override specific headers (excluding Content-Type for FormData)
    ...(options.headers as Record<string, string> ?? {}),
  };

  const res  = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message ?? `Request failed with status ${res.status}`);
  }

  return data as T;
}

// ─── Review API ───────────────────────────────────────────────────────────────

/**
 * Fetch all active reviews belonging to the current logged-in user.
 * GET /api/reviews/me
 */
export async function getMyReviewsApi(): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>('/api/reviews/me', { method: 'GET' });
}

/**
 * Fetch a single review by its Mongo ID.
 * GET /api/review/:id
 */
export async function getOneReviewApi(id: string): Promise<SingleReviewResponse> {
  return apiFetch<SingleReviewResponse>(`/api/review/${id}`, { method: 'GET' });
}

/**
 * Fetch active, paginated reviews for a product (public endpoint).
 * GET /api/review?id=:productId&page=:page&limit=:limit
 *
 * Response contains both `data` and `reviews` arrays (same content); prefer
 * `reviews` as it is also returned by the admin endpoint for consistency.
 */
export async function getProductReviewsApi(
  productId: string,
  page = 1,
  limit = 10,
): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(
    `/api/review?id=${productId}&page=${page}&limit=${limit}`,
    { method: 'GET' },
  );
}

/**
 * Create a new review (multipart/form-data).
 * POST /api/review
 *
 * ⚠️  CRITICAL — React Native headers + FormData interaction:
 *
 * When `headers` is a plain object, React Native's fetch implementation
 * "seals" the header set and CANNOT inject the auto-generated
 * `Content-Type: multipart/form-data; boundary=<id>` header that is
 * required for Flask (Werkzeug) to parse the multipart body.
 * Result: request.files is empty on the server → images never saved.
 *
 * Fix: build a `Headers` instance and set ONLY the auth headers on it.
 * Do NOT set Content-Type at all — fetch generates it with the boundary.
 */
export async function createReviewApi(
  payload: CreateReviewPayload,
): Promise<SingleReviewResponse> {
  const formData = new FormData();
  formData.append('rating',  String(payload.rating));
  formData.append('comment', payload.comment);
  formData.append('product', payload.productId);
  formData.append('orderId', payload.orderId);

  // Mirror the forum pattern: fetch each URI → Blob, then append with filename.
  // This ensures the binary data is embedded in the multipart body so Flask
  // can read it from request.files — the plain {uri,name,type} object approach
  // does NOT send actual bytes on all RN environments.
  if (payload.imageUris) {
    for (const uri of payload.imageUris.slice(0, 5)) {
      const imgRes  = await fetch(uri);
      const imgBlob = await imgRes.blob();
      formData.append('images', imgBlob, `review_${Date.now()}.jpg`);
    }
  }

  const authHeaders = await getAuthHeaders();

  // Use a Headers instance — plain objects prevent boundary injection in RN
  const headers = new Headers();
  Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));
  // ❌ Do NOT set Content-Type — let fetch set it with the boundary automatically

  const res = await fetch(`${BASE_URL}/api/review`, {
    method:  'POST',
    headers,
    body:    formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Request failed with status ${res.status}`);
  return data as SingleReviewResponse;
}

/**
 * Update an existing review (multipart/form-data).
 * PUT /api/review/:id
 *
 * ⚠️  Same Headers instance pattern as createReviewApi — see that function for
 *     the full explanation of why a plain object breaks multipart boundary injection.
 */
export async function updateReviewApi(
  id: string,
  payload: UpdateReviewPayload,
): Promise<SingleReviewResponse> {
  const formData = new FormData();

  if (payload.rating  !== undefined) formData.append('rating',  String(payload.rating));
  if (payload.comment !== undefined) formData.append('comment', payload.comment);

  // Always send the list of public_ids to keep so the backend knows exactly
  // which existing images to retain (and which to delete). Empty array = remove all.
  formData.append(
    'keepImageIds',
    JSON.stringify(payload.keepImagePublicIds ?? []),
  );

  // Mirror the forum pattern: fetch each URI → Blob, then append with filename.
  if (payload.imageUris) {
    for (const uri of payload.imageUris.slice(0, 5)) {
      const imgRes  = await fetch(uri);
      const imgBlob = await imgRes.blob();
      formData.append('images', imgBlob, `review_${Date.now()}.jpg`);
    }
  }

  const authHeaders = await getAuthHeaders();

  // Use a Headers instance so RN fetch can inject the multipart boundary
  const headers = new Headers();
  Object.entries(authHeaders).forEach(([k, v]) => headers.set(k, v));

  const res = await fetch(`${BASE_URL}/api/review/${id}`, {
    method:  'PUT',
    headers,
    body:    formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message ?? `Request failed with status ${res.status}`);
  return data as SingleReviewResponse;
}

/**
 * Archive (soft-delete) the current user's own review.
 * PATCH /api/review/:id/archive
 */
export async function archiveMyReviewApi(id: string): Promise<BaseResponse> {
  return apiFetch<BaseResponse>(`/api/review/${id}/archive`, { method: 'PATCH' });
}

/**
 * Unarchive (restore) the current user's own previously archived review.
 * PATCH /api/review/:id/unarchive
 */
export async function unarchiveMyReviewApi(id: string): Promise<SingleReviewResponse> {
  return apiFetch<SingleReviewResponse>(`/api/review/${id}/unarchive`, { method: 'PATCH' });
}

/**
 * Fetch all archived reviews belonging to the current logged-in user.
 * GET /api/reviews/me/archived
 */
export async function getMyArchivedReviewsApi(): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>('/api/reviews/me/archived', { method: 'GET' });
}

/**
 * Admin: archive any review.
 * PATCH /api/admin/review/:id/archive
 */
export async function adminArchiveReviewApi(id: string): Promise<BaseResponse> {
  return apiFetch<BaseResponse>(`/api/admin/review/${id}/archive`, { method: 'PATCH' });
}

/**
 * Admin: restore an archived review.
 * PATCH /api/admin/review/:id/restore
 */
export async function adminRestoreReviewApi(id: string): Promise<SingleReviewResponse> {
  return apiFetch<SingleReviewResponse>(`/api/admin/review/${id}/restore`, { method: 'PATCH' });
}

/**
 * Admin: list all archived reviews (paginated).
 * GET /api/admin/reviews/archived
 */
export async function getArchivedReviewsApi(page = 1, limit = 10): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(
    `/api/admin/reviews/archived?page=${page}&limit=${limit}`,
    { method: 'GET' },
  );
}

/**
 * Admin: get all reviews (including archived) for a product.
 * GET /api/review/product?id=:productId&includeArchived=true
 */
export async function adminGetProductReviewsApi(
  productId: string,
  includeArchived = false,
): Promise<ReviewListResponse> {
  return apiFetch<ReviewListResponse>(
    `/api/review/product?id=${productId}&includeArchived=${includeArchived}`,
    { method: 'GET' },
  );
}