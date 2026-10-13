import {
  Restaurant,
  Assessment,
  Finding,
  CorrectiveAction,
  CommunityPost,
  ImageValidationResult,
} from '../types';

// Default to localhost, configurable via EXPO_PUBLIC_API_URL
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const ApiClient = {
  baseUrl: BASE_URL,

  async getHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (!res.ok) throw new Error('Health check failed');
      return await res.json();
    } catch (e) {
      return { status: 'offline', error: String(e) };
    }
  },

  async getRestaurants(params?: { query?: string; area?: string; cuisine?: string; minScore?: number }): Promise<Restaurant[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.query) queryParams.append('q', params.query);
      if (params?.area) queryParams.append('area', params.area);
      if (params?.cuisine) queryParams.append('cuisine', params.cuisine);
      if (params?.minScore) queryParams.append('min_score', String(params.minScore));

      const res = await fetch(`${this.baseUrl}/restaurants?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      return await res.json();
    } catch {
      // Fallback sample data if backend is offline or starting up
      return FALLBACK_RESTAURANTS;
    }
  },

  async getRestaurantById(id: string): Promise<Restaurant | null> {
    try {
      const res = await fetch(`${this.baseUrl}/restaurants/${id}`);
      if (!res.ok) throw new Error('Restaurant not found');
      return await res.json();
    } catch {
      return FALLBACK_RESTAURANTS.find((r) => r.id === id) || null;
    }
  },

  async getAssessmentsByRestaurant(restaurantId: string): Promise<Assessment[]> {
    try {
      const res = await fetch(`${this.baseUrl}/restaurants/${restaurantId}/assessments`);
      if (!res.ok) throw new Error('Failed to fetch assessments');
      return await res.json();
    } catch {
      return FALLBACK_ASSESSMENTS.filter((a) => a.restaurant_id === restaurantId);
    }
  },

  async validateImage(base64: string): Promise<ImageValidationResult> {
    try {
      const res = await fetch(`${this.baseUrl}/inspections/validate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `image_base64=${encodeURIComponent(base64)}`,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail?.message || 'Image validation failed.');
      }
      return await res.json();
    } catch (e: any) {
      return {
        is_valid: true, // fallback permissive if server offline
        feedback: [],
        file_size_bytes: 0,
      };
    }
  },

  async analyzeKitchenPhoto(data: {
    zone: string;
    imageBase64?: string;
    imageUrl?: string;
    restaurantId?: string;
  }): Promise<Assessment> {
    const payload = {
      zone: data.zone,
      image_base64: data.imageBase64,
      image_url: data.imageUrl,
      restaurant_id: data.restaurantId,
    };

    const res = await fetch(`${this.baseUrl}/inspections/analyze/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => null);
      const errorMsg =
        errJson?.detail?.message ||
        (Array.isArray(errJson?.detail?.feedback) ? errJson.detail.feedback.join('\n') : null) ||
        (typeof errJson?.detail === 'string' ? errJson.detail : null) ||
        `Inspection failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return await res.json();
  },
};

// Realistic Seed Fallback Data (clearly marked is_sample: true)
export const FALLBACK_RESTAURANTS: Restaurant[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'Green Leaf Bistro',
    description: 'Contemporary organic dining focused on wholesome meals and transparent kitchen standards.',
    address: '42 Indiranagar 100ft Road',
    city: 'Bengaluru',
    area: 'Indiranagar',
    cuisine_type: 'Organic & Healthy',
    phone: '+91 80 4123 4567',
    image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    is_claimed: true,
    is_sample: true,
    latest_score: 94.5,
    latest_grade: 'A',
    latest_assessed_at: '2026-10-11T12:00:00Z',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Spice Route Kitchen',
    description: 'Traditional Mughlai & North Indian delicacies cooked in high-volume tandoor stations.',
    address: '18 Connaught Place, Block M',
    city: 'New Delhi',
    area: 'Connaught Place',
    cuisine_type: 'North Indian',
    phone: '+91 11 2345 6789',
    image_url: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    is_claimed: true,
    is_sample: true,
    latest_score: 86.0,
    latest_grade: 'B',
    latest_assessed_at: '2026-10-08T15:30:00Z',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Coastal Harbor Seafood',
    description: 'Fresh coastal curries, prawns, and grilled fish specialties.',
    address: '12 Marine Drive Promenade',
    city: 'Mumbai',
    area: 'Churchgate',
    cuisine_type: 'Seafood',
    phone: '+91 22 6789 0123',
    image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    is_claimed: false,
    is_sample: true,
    latest_score: 71.0,
    latest_grade: 'C',
    latest_assessed_at: '2026-09-29T10:00:00Z',
    created_at: '2026-10-01T00:00:00Z',
  },
  {
    id: 'b0000000-0000-0000-0000-000000000004',
    name: 'Urban Wok Street Kitchen',
    description: 'Pan-Asian street food and wok-tossed noodles in Koramangala.',
    address: '55 4th Block, 80ft Road',
    city: 'Bengaluru',
    area: 'Koramangala',
    cuisine_type: 'Pan-Asian',
    is_claimed: false,
    is_sample: true,
    latest_score: null,
    latest_grade: null,
    latest_assessed_at: null,
    created_at: '2026-10-01T00:00:00Z',
  },
];

export const FALLBACK_ASSESSMENTS: Assessment[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    restaurant_id: 'b0000000-0000-0000-0000-000000000001',
    zone: 'prep_surface',
    photo_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800',
    overall_score: 94.5,
    grade: 'A',
    status: 'completed',
    model_version: 'demo-v1.0',
    is_demo: true,
    disclaimer: 'CleanPlate AI assesses visible cleanliness only. Not an official regulatory inspection.',
    limitations: 'Assessment limited to stainless prep surface and cutting board arrangement.',
    created_at: '2026-10-11T12:00:00Z',
    findings: [
      {
        id: 'd0000000-0000-0000-0000-000000000001',
        assessment_id: 'c0000000-0000-0000-0000-000000000001',
        category: 'Sanitization & Storage',
        title: 'Sanitizing cloth resting on prep table',
        description: 'A damp wiping towel was observed on the cutting surface rather than in an approved sanitizing bucket.',
        severity: 'low',
        confidence: 0.92,
        deduction_points: 5.5,
        evidence_description: 'Visible folded cloth near center-right prep area',
        corrective_recommendation: 'Submerge kitchen wiping towels in designated sanitizing solution buckets between uses.',
      },
    ],
  },
];
