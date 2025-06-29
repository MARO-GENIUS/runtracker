
import { AIRecommendation } from '@/hooks/useAICoach';

export interface PersistentAIRecommendation {
  id: string;
  user_id: string;
  recommendation_data: AIRecommendation;
  generated_at: string;
  completed_at?: string;
  matching_activity_id?: number;
  status: 'pending' | 'completed' | 'expired';
  created_at: string;
  updated_at: string;
}
