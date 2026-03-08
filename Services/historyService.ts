// Services/historyService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

async function getAuthToken(): Promise<string | null> {
  try {
    return (
      (await AsyncStorage.getItem('token')) ||
      (await AsyncStorage.getItem('jwt'))
    );
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Image encoding — works on BOTH web and native
//
// Web:    expo-file-system is unavailable → use fetch() + FileReader
// Native: use expo-file-system/legacy readAsStringAsync with Base64
// ─────────────────────────────────────────────────────────────

async function imageUriToBase64(uri: string): Promise<string | null> {
  if (!uri) return null;

  try {
    // Already a data-URI — strip the prefix and return raw base64
    if (uri.startsWith('data:')) {
      const comma = uri.indexOf(',');
      return comma !== -1 ? uri.slice(comma + 1) : null;
    }

    // ── Web platform: use fetch + FileReader (blob → base64) ──
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // result is "data:image/jpeg;base64,XXXX" — strip prefix
          const comma = result.indexOf(',');
          resolve(comma !== -1 ? result.slice(comma + 1) : null);
        };
        reader.onerror = () => {
          console.warn('historyService: FileReader error');
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    }

    // ── Native platform: use expo-file-system/legacy ───────────
    // Dynamic import so the module is never loaded on web
    // (avoids the UnavailabilityError entirely)
    const FileSystem = await import('expo-file-system/legacy');
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!b64 || b64.length < 10) {
      console.warn('historyService: readAsStringAsync returned empty string for', uri);
      return null;
    }

    console.log(`historyService: encoded ${b64.length} chars (native)`);
    return b64;

  } catch (e) {
    console.warn('historyService: could not encode image →', e);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// HTTP
// ─────────────────────────────────────────────────────────────

async function post(endpoint: string, body: object) {
  const token = await getAuthToken();
  if (!token) {
    return { success: false, message: 'Not authenticated' };
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────
// Payload types
// ─────────────────────────────────────────────────────────────

export interface SaveRipenessPayload {
  prediction: {
    ripeness: string;
    ripeness_level: number;
    confidence: number;
    texture: string;
    days_to_ripe: string;
    recommendation: string;
    bbox: number[];
    color?: string;
    color_metrics?: Record<string, number>;
  };
  all_probabilities: Record<string, number>;
  image_size: { width: number; height: number };
  count: number;
  notes?: string;
  imageUri?: string;
}

export interface SaveLeafPayload {
  prediction: {
    class: string;
    confidence: number;
    bbox: number[];
    all_probabilities: Record<string, number>;
  };
  detections: object[];
  recommendation: string;
  image_size: { width: number; height: number };
  count: number;
  notes?: string;
  imageUri?: string;
}

export interface SaveFruitDiseasePayload {
  prediction: {
    class: string;
    confidence: number;
    bbox?: number[];
    all_probabilities: Record<string, number>;
  };
  detections: object[];
  recommendation: string;
  image_size: { width: number; height: number };
  count: number;
  notes?: string;
  imageUri?: string;
}

// ─────────────────────────────────────────────────────────────
// Save methods
// ─────────────────────────────────────────────────────────────

async function saveRipenessAnalysis(payload: SaveRipenessPayload) {
  const imageBase64 = payload.imageUri
    ? await imageUriToBase64(payload.imageUri)
    : null;

  const body: Record<string, unknown> = {
    prediction:        payload.prediction,
    all_probabilities: payload.all_probabilities,
    image_size:        payload.image_size,
    count:             payload.count,
    notes:             payload.notes ?? '',
  };
  if (imageBase64) body.image_data = imageBase64;

  console.log('saveRipenessAnalysis → image attached?', !!imageBase64);
  return post('/api/history/ripeness/save', body);
}

async function saveLeafAnalysis(payload: SaveLeafPayload) {
  const imageBase64 = payload.imageUri
    ? await imageUriToBase64(payload.imageUri)
    : null;

  const body: Record<string, unknown> = {
    prediction:     payload.prediction,
    detections:     payload.detections,
    recommendation: payload.recommendation,
    image_size:     payload.image_size,
    count:          payload.count,
    notes:          payload.notes ?? '',
  };
  if (imageBase64) body.image_data = imageBase64;

  console.log('saveLeafAnalysis → image attached?', !!imageBase64);
  return post('/api/history/leaves/save', body);
}

async function saveFruitDiseaseAnalysis(payload: SaveFruitDiseasePayload) {
  const imageBase64 = payload.imageUri
    ? await imageUriToBase64(payload.imageUri)
    : null;

  const body: Record<string, unknown> = {
    prediction:     payload.prediction,
    detections:     payload.detections,
    recommendation: payload.recommendation,
    image_size:     payload.image_size,
    count:          payload.count,
    notes:          payload.notes ?? '',
  };
  if (imageBase64) body.image_data = imageBase64;

  console.log('saveFruitDiseaseAnalysis → image attached?', !!imageBase64);
  return post('/api/history/fruitdisease/save', body);
}

// ─────────────────────────────────────────────────────────────
// Batch
// ─────────────────────────────────────────────────────────────

export interface BatchAnalysisItem {
  analysis_type: 'ripeness' | 'leaf' | 'fruit_disease';
  prediction: object;
  image_size: { width: number; height: number };
  [key: string]: unknown;
  imageUri?: string;
}

async function saveBatchAnalyses(items: BatchAnalysisItem[]) {
  const analyses = await Promise.all(
    items.map(async (item) => {
      const { imageUri, ...rest } = item;
      const imageBase64 = imageUri ? await imageUriToBase64(imageUri) : null;
      const out: Record<string, unknown> = { ...rest };
      if (imageBase64) out.image_data = imageBase64;
      return out;
    }),
  );
  return post('/api/history/batch/save', { analyses });
}

// ─────────────────────────────────────────────────────────────
// Getters / updaters
// ─────────────────────────────────────────────────────────────

async function getAllAnalyses(limit = 50, offset = 0, type?: string) {
  const token = await getAuthToken();
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    ...(type ? { type } : {}),
  });
  const res = await fetch(`${BASE_URL}/api/history/all?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function getRipenessAnalyses(limit = 50, offset = 0) {
  const token = await getAuthToken();
  const res = await fetch(
    `${BASE_URL}/api/history/ripeness?limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.json();
}

async function getLeafAnalyses(limit = 50, offset = 0) {
  const token = await getAuthToken();
  const res = await fetch(
    `${BASE_URL}/api/history/leaves?limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.json();
}

async function getFruitDiseaseAnalyses(limit = 50, offset = 0) {
  const token = await getAuthToken();
  const res = await fetch(
    `${BASE_URL}/api/history/fruitdisease?limit=${limit}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.json();
}

async function getAnalysis(analysisId: string) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/api/history/${analysisId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function updateAnalysisNotes(analysisId: string, notes: string) {
  return post(`/api/history/${analysisId}/notes`, { notes });
}

async function deleteAnalysis(analysisId: string) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/api/history/${analysisId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function getStatistics() {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}/api/history/statistics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Default export
// ─────────────────────────────────────────────────────────────

const historyService = {
  saveRipenessAnalysis,
  saveLeafAnalysis,
  saveFruitDiseaseAnalysis,
  saveBatchAnalyses,
  getAllAnalyses,
  getRipenessAnalyses,
  getLeafAnalyses,
  getFruitDiseaseAnalyses,
  getAnalysis,
  updateAnalysisNotes,
  deleteAnalysis,
  getStatistics,
};

export default historyService;