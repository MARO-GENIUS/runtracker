// Types for workout details
export interface BaseWorkoutData {
  notes?: string;
}

export interface IntervalWorkoutData extends BaseWorkoutData {
  repetitions: number;
  distance: number; // meters
  targetPace: string; // format "4:30"
  recoveryTime: number; // seconds
  recoveryType?: 'active' | 'static';
}

export interface ThresholdWorkoutData extends BaseWorkoutData {
  duration: number; // minutes
  targetPace: string;
  heartRateZone?: string;
}

export interface EnduranceWorkoutData extends BaseWorkoutData {
  duration: number; // minutes
  targetPace: string;
  heartRateZone?: string;
}

export interface TempoWorkoutData extends BaseWorkoutData {
  warmup: number; // minutes
  tempoDistance: number; // meters
  targetPace: string;
  cooldown: number; // minutes
}

export interface HillWorkoutData extends BaseWorkoutData {
  repetitions: number;
  hillDistance: number; // meters
  gradient?: number; // percentage
  recoveryTime: number; // seconds
  targetEffort?: string;
}

export interface FartlekWorkoutData extends BaseWorkoutData {
  totalDuration: number; // minutes
  intervals: Array<{
    duration: number; // minutes
    intensity: 'easy' | 'moderate' | 'hard';
    description?: string;
  }>;
}

export interface RecoveryWorkoutData extends BaseWorkoutData {
  duration: number; // minutes
  targetPace: string;
  activity?: 'jogging' | 'walking' | 'cycling';
}

export interface LongRunWorkoutData extends BaseWorkoutData {
  duration: number; // minutes
  targetPace: string;
  negativeSplit?: boolean;
  fuelStrategy?: string;
}

export type WorkoutData = 
  | IntervalWorkoutData
  | ThresholdWorkoutData
  | EnduranceWorkoutData
  | TempoWorkoutData
  | HillWorkoutData
  | FartlekWorkoutData
  | RecoveryWorkoutData
  | LongRunWorkoutData;

export interface WorkoutDetail {
  id: string;
  activity_id: number;
  user_id: string;
  session_type: string;
  workout_data: WorkoutData;
  created_at: string;
  updated_at: string;
}