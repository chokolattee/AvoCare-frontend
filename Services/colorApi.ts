import { API_BASE_URL as API_URL } from '../config/api';

// ─────────────────────────────────────────────────────────────
// Types matching color_routes.py response
// ─────────────────────────────────────────────────────────────

export interface ColorResult {
  success: boolean;
  color?: 'black' | 'green' | 'purple brown' | string;
  confidence?: number;
  all_probabilities?: { black: number; green: number; 'purple brown': number; [key: string]: number };
  error?: string;
}

// ─────────────────────────────────────────────────────────────
// Helper — build FormData from any URI format
// ─────────────────────────────────────────────────────────────

async function buildFormData(imageUri: string): Promise<FormData> {
  const formData = new FormData();

  if (imageUri.startsWith('data:') || imageUri.startsWith('blob:')) {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, 'avocado.jpg');
  } else if (typeof window !== 'undefined' && imageUri.startsWith('http')) {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    formData.append('image', blob, 'avocado.jpg');
  } else {
    // React Native file path
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avocado.jpg',
    } as any);
  }

  return formData;
}

// ─────────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────────

const colorApi = {

  /**
   * Classify the skin colour of an avocado image.
   * Returns one of: 'black' | 'green' | 'purple brown'
   */
  predictColor: async (imageUri: string): Promise<ColorResult> => {
    try {
      console.log('🎨 Color API: Starting prediction…');

      const formData = await buildFormData(imageUri);

      console.log('📤 Sending request to:', `${API_URL}/api/color/predict`);

      const response = await fetch(`${API_URL}/api/color/predict`, {
        method: 'POST',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        body: formData,
      });

      const data: ColorResult = await response.json();

      if (!response.ok || !data.success) {
        console.error('❌ Color prediction failed:', data);
        return { success: false, error: data.error || `Server error: ${response.status}` };
      }

      console.log(
        `✅ Colour: ${data.color}  conf=${((data.confidence ?? 0) * 100).toFixed(1)}%`
      );

      return data;
    } catch (error) {
      console.error('❌ Color API network error:', error);
      return { success: false, error: String(error) };
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/api/color/health`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await response.json();
      const healthy = data.status === 'healthy' && data.model_loaded === true;
      console.log('🏥 Color API health:', healthy ? '✅ Healthy' : '❌ Unhealthy');
      return healthy;
    } catch (error) {
      console.error('❌ Color health check failed:', error);
      return false;
    }
  },

  getClasses: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_URL}/api/color/classes`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      const data = await response.json();
      return data.classes ?? [];
    } catch {
      return [];
    }
  },
};

export default colorApi;
