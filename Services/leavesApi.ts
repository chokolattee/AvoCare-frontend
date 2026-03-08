import { API_BASE_URL as API_URL } from '../config/api';

export interface LeafDetection {
  id: number;
  class: string;
  confidence: number;
  bbox: [number, number, number, number];
  bbox_absolute: [number, number, number, number];
  all_probabilities: { [key: string]: number };
}

export interface GateResult {
  class: string;
  confidence: number;
  all_probabilities: { [key: string]: number };
}

export interface LeavesResult {
  success: boolean;
  is_leaf?: boolean;           // ← NEW: true if leaf was detected in step 1
  gate?: GateResult;           // ← NEW: step 1 classifier result
  prediction?: {
    class: string;
    confidence: number;
    bbox: [number, number, number, number];
    all_probabilities: { [key: string]: number };
  };
  detections?: LeafDetection[];
  count?: number;
  image_size?: {
    width: number;
    height: number;
  };
  error?: string;
}

const leavesApi = {
  predictLeaves: async (imageUri: string): Promise<LeavesResult> => {
    try {
      console.log('🍃 Starting leaf detection with image:', imageUri);

      const formData = new FormData();

      if (imageUri.startsWith('data:') || imageUri.startsWith('blob:')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, 'camera-capture.jpg');
      } else if (typeof window !== 'undefined' && imageUri.startsWith('http')) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('image', blob, 'leaf.jpg');
      } else {
        formData.append('image', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'leaf.jpg',
        } as any);
      }

      console.log('📤 Sending to backend...');
      const response = await fetch(`${API_URL}/api/leaves/predict`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData,
      });

      const result: LeavesResult = await response.json();
      console.log('📥 Received response:', result);

      if (response.status >= 500) {
        return { success: false, error: result.error || `Server error: ${response.status}` };
      }

      // Step 1 failed — not a leaf (HTTP 200 with is_leaf: false)
      if (!result.is_leaf) {
        console.warn('🚫 Not a leaf detected by gate classifier');
        return {
          success: false,
          is_leaf: false,
          gate: result.gate,
          error: result.error || 'No leaf detected in the image.',
        };
      }

      console.log(`✅ Leaf confirmed. Detected ${result.count || 0} regions.`);
      return result;

    } catch (error) {
      console.error('❌ Network error:', error);
      return { success: false, error: String(error) };
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/leaves/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await response.json();
      console.log('🏥 Leaves API health:', data);
      return data.status === 'ok' && data.classifier_loaded && data.disease_model_loaded;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  },
};

export default leavesApi;