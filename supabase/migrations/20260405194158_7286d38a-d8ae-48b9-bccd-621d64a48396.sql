
-- profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  strava_user_id INTEGER UNIQUE,
  strava_expires_at BIGINT,
  first_name TEXT,
  last_name TEXT,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE INDEX idx_profiles_strava_user_id ON public.profiles(strava_user_id);

-- strava_activities table
CREATE TABLE public.strava_activities (
  id BIGINT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  distance REAL NOT NULL,
  moving_time INTEGER NOT NULL,
  elapsed_time INTEGER NOT NULL,
  total_elevation_gain REAL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date_local TIMESTAMP WITH TIME ZONE NOT NULL,
  location_city TEXT,
  location_state TEXT,
  location_country TEXT,
  average_speed REAL,
  max_speed REAL,
  average_heartrate REAL,
  max_heartrate REAL,
  suffer_score REAL,
  calories REAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  effort_rating INTEGER,
  effort_notes TEXT,
  session_type TEXT,
  map_polyline TEXT,
  map_summary_polyline TEXT,
  start_latlng TEXT,
  end_latlng TEXT,
  CONSTRAINT strava_activities_effort_rating_check CHECK (effort_rating >= 1 AND effort_rating <= 10)
);
ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own activities" ON public.strava_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activities" ON public.strava_activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.strava_activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.strava_activities FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_strava_activities_user_id ON public.strava_activities(user_id);
CREATE INDEX idx_strava_activities_start_date ON public.strava_activities(start_date);
CREATE INDEX idx_strava_activities_type ON public.strava_activities(type);

-- strava_best_efforts table
CREATE TABLE public.strava_best_efforts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_id BIGINT NOT NULL REFERENCES public.strava_activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  distance REAL NOT NULL,
  moving_time INTEGER NOT NULL,
  start_date_local TIMESTAMP WITH TIME ZONE NOT NULL,
  elapsed_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(activity_id, name)
);
ALTER TABLE public.strava_best_efforts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own best efforts" ON public.strava_best_efforts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own best efforts" ON public.strava_best_efforts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own best efforts" ON public.strava_best_efforts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own best efforts" ON public.strava_best_efforts FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_strava_best_efforts_user_id ON public.strava_best_efforts(user_id);
CREATE INDEX idx_strava_best_efforts_activity_id ON public.strava_best_efforts(activity_id);
CREATE INDEX idx_strava_best_efforts_distance ON public.strava_best_efforts(distance);
CREATE INDEX idx_strava_best_efforts_moving_time ON public.strava_best_efforts(moving_time);

-- personal_records table
CREATE TABLE public.personal_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  distance_type TEXT NOT NULL,
  distance_meters INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  activity_id BIGINT REFERENCES public.strava_activities(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, distance_type)
);
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own records" ON public.personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own records" ON public.personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own records" ON public.personal_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own records" ON public.personal_records FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_personal_records_user_id ON public.personal_records(user_id);

-- monthly_goals table
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  goal_km INTEGER NOT NULL DEFAULT 200,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, year, month)
);
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own monthly goals" ON public.monthly_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own monthly goals" ON public.monthly_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monthly goals" ON public.monthly_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monthly goals" ON public.monthly_goals FOR DELETE USING (auth.uid() = user_id);

-- user_statistics table
CREATE TABLE public.user_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
  period_year INTEGER NOT NULL,
  period_month INTEGER,
  total_distance REAL NOT NULL DEFAULT 0,
  total_activities INTEGER NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0,
  longest_activity_distance REAL DEFAULT 0,
  longest_activity_name TEXT,
  longest_activity_date TIMESTAMP WITH TIME ZONE,
  longest_activity_id BIGINT,
  latest_activity_name TEXT,
  latest_activity_distance REAL,
  latest_activity_date TIMESTAMP WITH TIME ZONE,
  latest_activity_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_year, period_month)
);
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own statistics" ON public.user_statistics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own statistics" ON public.user_statistics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own statistics" ON public.user_statistics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own statistics" ON public.user_statistics FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_statistics_user_period ON public.user_statistics(user_id, period_type, period_year, period_month);

-- user_stats_cache table
CREATE TABLE public.user_stats_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  stats_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_stats_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cached stats" ON public.user_stats_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own cached stats" ON public.user_stats_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cached stats" ON public.user_stats_cache FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cached stats" ON public.user_stats_cache FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_user_stats_cache_user_id ON public.user_stats_cache(user_id);

-- training_settings table
CREATE TABLE public.training_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  target_race TEXT NOT NULL DEFAULT '10k',
  target_date TIMESTAMP WITH TIME ZONE,
  weekly_frequency INTEGER NOT NULL DEFAULT 3,
  preferred_days TEXT[] NOT NULL DEFAULT '{}',
  available_time_slots TEXT[] NOT NULL DEFAULT '{}',
  max_intensity TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  target_time_minutes INTEGER,
  last_session_type TEXT
);
ALTER TABLE public.training_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own training settings" ON public.training_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own training settings" ON public.training_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own training settings" ON public.training_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own training settings" ON public.training_settings FOR DELETE USING (auth.uid() = user_id);

-- ai_recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL,
  recommendation_data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  matching_activity_id BIGINT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_manual_match BOOLEAN DEFAULT false
);
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own recommendations" ON public.ai_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recommendations" ON public.ai_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recommendations" ON public.ai_recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recommendations" ON public.ai_recommendations FOR DELETE USING (auth.uid() = user_id);

-- encrypted_tokens table (no client access)
CREATE TABLE public.encrypted_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at BIGINT,
  encryption_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.encrypted_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No client access to encrypted tokens" ON public.encrypted_tokens FOR ALL USING (false);

-- workout_details table
CREATE TABLE public.workout_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id BIGINT NOT NULL,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL,
  workout_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.workout_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own workout details" ON public.workout_details FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own workout details" ON public.workout_details FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own workout details" ON public.workout_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own workout details" ON public.workout_details FOR DELETE USING (auth.uid() = user_id);

-- handle_new_user function and trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- update_encrypted_tokens_updated_at function
CREATE OR REPLACE FUNCTION public.update_encrypted_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_encrypted_tokens_updated_at
BEFORE UPDATE ON public.encrypted_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_encrypted_tokens_updated_at();

-- recalculate_user_statistics function
CREATE OR REPLACE FUNCTION public.recalculate_user_statistics(p_user_id UUID, p_activity_date TIMESTAMP WITH TIME ZONE)
RETURNS VOID AS $$
DECLARE
  activity_year INTEGER;
  activity_month INTEGER;
  monthly_stats RECORD;
  yearly_stats RECORD;
  longest_monthly RECORD;
  latest_monthly RECORD;
  longest_yearly RECORD;
  latest_yearly RECORD;
BEGIN
  activity_year := EXTRACT(YEAR FROM p_activity_date);
  activity_month := EXTRACT(MONTH FROM p_activity_date);

  SELECT COALESCE(SUM(distance), 0) as total_distance, COUNT(*) as total_activities, COALESCE(SUM(moving_time), 0) as total_time
  INTO monthly_stats
  FROM public.strava_activities WHERE user_id = p_user_id AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year AND EXTRACT(MONTH FROM start_date_local) = activity_month;

  SELECT name, distance, start_date_local, id INTO longest_monthly
  FROM public.strava_activities WHERE user_id = p_user_id AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year AND EXTRACT(MONTH FROM start_date_local) = activity_month
  ORDER BY distance DESC LIMIT 1;

  SELECT name, distance, start_date_local, id INTO latest_monthly
  FROM public.strava_activities WHERE user_id = p_user_id AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year AND EXTRACT(MONTH FROM start_date_local) = activity_month
  ORDER BY start_date_local DESC LIMIT 1;

  INSERT INTO public.user_statistics (user_id, period_type, period_year, period_month, total_distance, total_activities, total_time,
    longest_activity_distance, longest_activity_name, longest_activity_date, longest_activity_id,
    latest_activity_name, latest_activity_distance, latest_activity_date, latest_activity_id)
  VALUES (p_user_id, 'monthly', activity_year, activity_month, monthly_stats.total_distance, monthly_stats.total_activities, monthly_stats.total_time,
    longest_monthly.distance, longest_monthly.name, longest_monthly.start_date_local, longest_monthly.id,
    latest_monthly.name, latest_monthly.distance, latest_monthly.start_date_local, latest_monthly.id)
  ON CONFLICT (user_id, period_type, period_year, period_month)
  DO UPDATE SET total_distance = EXCLUDED.total_distance, total_activities = EXCLUDED.total_activities, total_time = EXCLUDED.total_time,
    longest_activity_distance = EXCLUDED.longest_activity_distance, longest_activity_name = EXCLUDED.longest_activity_name,
    longest_activity_date = EXCLUDED.longest_activity_date, longest_activity_id = EXCLUDED.longest_activity_id,
    latest_activity_name = EXCLUDED.latest_activity_name, latest_activity_distance = EXCLUDED.latest_activity_distance,
    latest_activity_date = EXCLUDED.latest_activity_date, latest_activity_id = EXCLUDED.latest_activity_id,
    updated_at = now();

  SELECT COALESCE(SUM(distance), 0) as total_distance, COUNT(*) as total_activities, COALESCE(SUM(moving_time), 0) as total_time
  INTO yearly_stats
  FROM public.strava_activities WHERE user_id = p_user_id AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year;

  SELECT name, distance, start_date_local, id INTO longest_yearly
  FROM public.strava_activities WHERE user_id = p_user_id AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
  ORDER BY distance DESC LIMIT 1;

  SELECT name, distance, start_date_local, id INTO latest_yearly
  FROM public.strava_activities WHERE user_id = p_user_id AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
  ORDER BY start_date_local DESC LIMIT 1;

  INSERT INTO public.user_statistics (user_id, period_type, period_year, period_month, total_distance, total_activities, total_time,
    longest_activity_distance, longest_activity_name, longest_activity_date, longest_activity_id,
    latest_activity_name, latest_activity_distance, latest_activity_date, latest_activity_id)
  VALUES (p_user_id, 'yearly', activity_year, NULL, yearly_stats.total_distance, yearly_stats.total_activities, yearly_stats.total_time,
    longest_yearly.distance, longest_yearly.name, longest_yearly.start_date_local, longest_yearly.id,
    latest_yearly.name, latest_yearly.distance, latest_yearly.start_date_local, latest_yearly.id)
  ON CONFLICT (user_id, period_type, period_year, period_month)
  DO UPDATE SET total_distance = EXCLUDED.total_distance, total_activities = EXCLUDED.total_activities, total_time = EXCLUDED.total_time,
    longest_activity_distance = EXCLUDED.longest_activity_distance, longest_activity_name = EXCLUDED.longest_activity_name,
    longest_activity_date = EXCLUDED.longest_activity_date, longest_activity_id = EXCLUDED.longest_activity_id,
    latest_activity_name = EXCLUDED.latest_activity_name, latest_activity_distance = EXCLUDED.latest_activity_distance,
    latest_activity_date = EXCLUDED.latest_activity_date, latest_activity_id = EXCLUDED.latest_activity_id,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-recalculate stats on activity changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_statistics()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_user_statistics(OLD.user_id, OLD.start_date_local);
    RETURN OLD;
  ELSE
    PERFORM public.recalculate_user_statistics(NEW.user_id, NEW.start_date_local);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_activity_change
  AFTER INSERT OR UPDATE OR DELETE ON public.strava_activities
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_statistics();

-- Enable realtime for strava_activities
ALTER TABLE public.strava_activities REPLICA IDENTITY FULL;
