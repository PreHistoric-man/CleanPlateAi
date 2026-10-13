export type UserRole = 'customer' | 'restaurant_owner' | 'moderator';

export type KitchenZone =
  | 'prep_surface'
  | 'storage'
  | 'dishwashing'
  | 'waste_disposal'
  | 'equipment';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ActionStatus = 'pending' | 'in_progress' | 'resolved';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
  bio?: string;
}

export interface Restaurant {
  id: string;
  owner_id?: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  area: string;
  cuisine_type: string;
  phone?: string;
  website?: string;
  image_url?: string;
  is_claimed: boolean;
  is_sample: boolean;
  latest_score?: number | null;
  latest_grade?: string | null;
  latest_assessed_at?: string | null;
  created_at: string;
}

export interface Finding {
  id: string;
  assessment_id: string;
  category: string;
  title: string;
  description: string;
  severity: FindingSeverity;
  confidence: number;
  deduction_points: number;
  evidence_description?: string;
  corrective_recommendation: string;
}

export interface ScoringDeduction {
  finding_id: string;
  category: string;
  title: string;
  severity: FindingSeverity;
  points_deducted: number;
  rule_applied: string;
}

export interface ImageValidationResult {
  is_valid: boolean;
  feedback: string[];
  width?: number;
  height?: number;
  format?: string;
  file_size_bytes: number;
  blur_score?: number;
  brightness_score?: number;
}

export interface Assessment {
  id: string;
  restaurant_id?: string;
  inspector_user_id?: string;
  zone: KitchenZone;
  photo_url: string;
  overall_score: number | null;
  grade: string | null;
  status: string;
  model_version: string;
  is_demo: boolean;
  has_critical_warning?: boolean;
  critical_warnings?: string[];
  disclaimer: string;
  limitations?: string;
  created_at: string;
  findings?: Finding[];
  deductions?: ScoringDeduction[];
  recommendations?: string[];
}

export interface CorrectiveAction {
  id: string;
  restaurant_id: string;
  finding_id?: string;
  title: string;
  action_steps: string;
  status: ActionStatus;
  resolved_at?: string;
  follow_up_photo_url?: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  restaurant_id: string;
  author_id: string;
  author_name?: string;
  title?: string;
  content: string;
  post_type: 'review' | 'question' | 'discussion';
  rating?: number;
  is_moderated: boolean;
  moderation_status: string;
  created_at: string;
  comments?: CommunityComment[];
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name?: string;
  content: string;
  is_owner_response: boolean;
  created_at: string;
}
