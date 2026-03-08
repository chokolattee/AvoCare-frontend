import { API_BASE_URL as API_URL } from '../config/api';

export interface FruitDetection {
  id: number;
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height] normalized (0-1)
  bbox_absolute?: [number, number, number, number]; // [x, y, width, height] in pixels
  all_probabilities: { [key: string]: number };
}

export interface FruitDiseaseResult {
  success: boolean;
  prediction?: {
    class: string;
    confidence: number;
    bbox?: [number, number, number, number];
    all_probabilities?: { [key: string]: number };
  };
  detections?: FruitDetection[];
  count?: number;
  image_size?: {
    width: number;
    height: number;
  };
  error?: string;
}

export interface AvocadoClassificationResult {
  success: boolean;
  isAvocado: boolean;
  class: string;           // 'avocado' | 'not avocado'
  confidence: number;
  all_probabilities: { [key: string]: number };
  error?: string;
}

// ─────────────────────────────────────────────
// Stage 0 — Avocado Classification Gate
// ─────────────────────────────────────────────

/**
 * Check if the image contains an avocado before running the full pipeline.
 * Calls /api/avocado/predict and returns a typed result.
 */
const checkIsAvocado = async (imageUri: string): Promise<AvocadoClassificationResult> => {
  try {
    console.log('🥑 [Stage 0] Avocado classification gate…');
    console.log('   Image URI:', imageUri.substring(0, 100));

    const formData = new FormData();
    
    // Handle different URI formats on web
    if (imageUri.startsWith('data:')) {
      // Data URI (base64) - convert to blob
      console.log('   Converting data URI to blob...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob, 'camera-capture.jpg');
    } else if (imageUri.startsWith('blob:')) {
      // Blob URL - fetch and convert
      console.log('   Fetching blob URL...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob, 'camera-capture.jpg');
    } else if (typeof window !== 'undefined' && imageUri.startsWith('http')) {
      // Web URL - fetch as blob
      console.log('   Fetching web URL...');
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob, 'image.jpg');
    } else {
      // React Native file path
      console.log('   Using React Native file path...');
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);
    }

    console.log('   Sending request to API...');
    const response = await fetch(`${API_URL}/api/avocado/predict`, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
    });

    console.log('   Response status:', response.status);

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('❌ Avocado classification failed:', data);
      return {
        success: false,
        isAvocado: false,
        class: 'not avocado',
        confidence: 0,
        all_probabilities: {},
        error: data.error || `Server error: ${response.status}`,
      };
    }

    const isAvocado = (data.class as string).toLowerCase() === 'avocado';
    console.log(
      `   Result: "${data.class}"  conf=${(data.confidence * 100).toFixed(1)}%  → isAvocado=${isAvocado}`
    );

    return {
      success: true,
      isAvocado,
      class: data.class,
      confidence: data.confidence,
      all_probabilities: data.all_probabilities ?? {},
    };
  } catch (error) {
    console.error('❌ checkIsAvocado network error:', error);
    return {
      success: false,
      isAvocado: false,
      class: 'not avocado',
      confidence: 0,
      all_probabilities: {},
      error: String(error),
    };
  }
};

// ─────────────────────────────────────────────
// Health check
// ─────────────────────────────────────────────

const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/fruitdisease/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      console.error('❌ Fruit disease API health check failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('✅ Fruit disease API health check:', data);
    return data.status === 'ok' && data.model_loaded === true;
  } catch (error) {
    console.error('❌ Fruit disease API health check error:', error);
    return false;
  }
};

// ─────────────────────────────────────────────
// Fruit Disease Prediction
// ─────────────────────────────────────────────

const predictFruitDisease = async (imageUri: string): Promise<FruitDiseaseResult> => {
  try {
    console.log('🔬 [Stage 3] Fruit disease detection…');

    const formData = new FormData();
    
    // Handle different URI formats (same logic as checkIsAvocado)
    if (imageUri.startsWith('data:')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob, 'camera-capture.jpg');
    } else if (imageUri.startsWith('blob:')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob, 'camera-capture.jpg');
    } else if (typeof window !== 'undefined' && imageUri.startsWith('http')) {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob, 'fruit.jpg');
    } else {
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'fruit.jpg',
      } as any);
    }

    const response = await fetch(`${API_URL}/api/fruitdisease/predict`, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
    });

    const result: FruitDiseaseResult = await response.json();

    if (!response.ok) {
      console.error('❌ Fruit disease API error:', result);
      return { success: false, error: result.error || `Server error: ${response.status}` };
    }

    console.log(`✅ Fruit disease: "${result.prediction?.class}"  count=${result.count ?? 0}`);
    return result;
  } catch (error) {
    console.error('❌ Fruit disease network error:', error);
    return { success: false, error: String(error) };
  }
};

// ─────────────────────────────────────────────
// Save analysis
// ─────────────────────────────────────────────

const saveAnalysis = async (analysisData: any): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/fruitdisease/save-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analysisData),
    });

    if (!response.ok) {
      console.error('Failed to save fruit disease analysis:', response.status);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error saving fruit disease analysis:', error);
    return false;
  }
};

const fruitDiseaseApi = {
  checkHealth,
  checkIsAvocado,
  predictFruitDisease,
  saveAnalysis,
};

export default fruitDiseaseApi;