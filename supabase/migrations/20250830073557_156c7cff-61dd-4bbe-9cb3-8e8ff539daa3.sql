-- Create the user_statistics table for pre-calculated statistics
CREATE TABLE public.user_statistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'yearly')),
  period_year INTEGER NOT NULL,
  period_month INTEGER, -- NULL for yearly stats
  total_distance REAL NOT NULL DEFAULT 0,
  total_activities INTEGER NOT NULL DEFAULT 0,
  total_time INTEGER NOT NULL DEFAULT 0, -- in seconds
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

-- Enable RLS
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own statistics" 
ON public.user_statistics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own statistics" 
ON public.user_statistics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own statistics" 
ON public.user_statistics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own statistics" 
ON public.user_statistics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_statistics_user_period ON public.user_statistics(user_id, period_type, period_year, period_month);
CREATE INDEX idx_user_statistics_updated_at ON public.user_statistics(updated_at);

-- Create function to recalculate user statistics
CREATE OR REPLACE FUNCTION public.recalculate_user_statistics(p_user_id UUID, p_activity_date TIMESTAMP WITH TIME ZONE)
RETURNS VOID AS $$
DECLARE
  activity_year INTEGER;
  activity_month INTEGER;
  monthly_stats RECORD;
  yearly_stats RECORD;
BEGIN
  -- Extract year and month from activity date
  activity_year := EXTRACT(YEAR FROM p_activity_date);
  activity_month := EXTRACT(MONTH FROM p_activity_date);
  
  -- Calculate monthly statistics
  SELECT 
    COALESCE(SUM(distance), 0) as total_distance,
    COUNT(*) as total_activities,
    COALESCE(SUM(moving_time), 0) as total_time,
    MAX(distance) as longest_distance
  INTO monthly_stats
  FROM public.strava_activities 
  WHERE user_id = p_user_id 
    AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
    AND EXTRACT(MONTH FROM start_date_local) = activity_month;
  
  -- Get longest activity details for the month
  WITH longest_activity AS (
    SELECT name, distance, start_date_local, id
    FROM public.strava_activities 
    WHERE user_id = p_user_id 
      AND type IN ('Run', 'VirtualRun')
      AND EXTRACT(YEAR FROM start_date_local) = activity_year
      AND EXTRACT(MONTH FROM start_date_local) = activity_month
      AND distance = monthly_stats.longest_distance
    ORDER BY start_date_local DESC
    LIMIT 1
  ),
  -- Get latest activity for the month
  latest_activity AS (
    SELECT name, distance, start_date_local, id
    FROM public.strava_activities 
    WHERE user_id = p_user_id 
      AND type IN ('Run', 'VirtualRun')
      AND EXTRACT(YEAR FROM start_date_local) = activity_year
      AND EXTRACT(MONTH FROM start_date_local) = activity_month
    ORDER BY start_date_local DESC
    LIMIT 1
  )
  -- Upsert monthly statistics
  INSERT INTO public.user_statistics (
    user_id, period_type, period_year, period_month,
    total_distance, total_activities, total_time,
    longest_activity_distance, longest_activity_name, longest_activity_date, longest_activity_id,
    latest_activity_name, latest_activity_distance, latest_activity_date, latest_activity_id,
    updated_at
  )
  SELECT 
    p_user_id, 'monthly', activity_year, activity_month,
    monthly_stats.total_distance, monthly_stats.total_activities, monthly_stats.total_time,
    la.distance, la.name, la.start_date_local, la.id,
    lat.name, lat.distance, lat.start_date_local, lat.id,
    now()
  FROM longest_activity la
  CROSS JOIN latest_activity lat
  ON CONFLICT (user_id, period_type, period_year, period_month)
  DO UPDATE SET
    total_distance = EXCLUDED.total_distance,
    total_activities = EXCLUDED.total_activities,
    total_time = EXCLUDED.total_time,
    longest_activity_distance = EXCLUDED.longest_activity_distance,
    longest_activity_name = EXCLUDED.longest_activity_name,
    longest_activity_date = EXCLUDED.longest_activity_date,
    longest_activity_id = EXCLUDED.longest_activity_id,
    latest_activity_name = EXCLUDED.latest_activity_name,
    latest_activity_distance = EXCLUDED.latest_activity_distance,
    latest_activity_date = EXCLUDED.latest_activity_date,
    latest_activity_id = EXCLUDED.latest_activity_id,
    updated_at = now();

  -- Calculate yearly statistics
  SELECT 
    COALESCE(SUM(distance), 0) as total_distance,
    COUNT(*) as total_activities,
    COALESCE(SUM(moving_time), 0) as total_time,
    MAX(distance) as longest_distance
  INTO yearly_stats
  FROM public.strava_activities 
  WHERE user_id = p_user_id 
    AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year;
  
  -- Get longest and latest activity details for the year
  WITH longest_activity_year AS (
    SELECT name, distance, start_date_local, id
    FROM public.strava_activities 
    WHERE user_id = p_user_id 
      AND type IN ('Run', 'VirtualRun')
      AND EXTRACT(YEAR FROM start_date_local) = activity_year
      AND distance = yearly_stats.longest_distance
    ORDER BY start_date_local DESC
    LIMIT 1
  ),
  latest_activity_year AS (
    SELECT name, distance, start_date_local, id
    FROM public.strava_activities 
    WHERE user_id = p_user_id 
      AND type IN ('Run', 'VirtualRun')
      AND EXTRACT(YEAR FROM start_date_local) = activity_year
    ORDER BY start_date_local DESC
    LIMIT 1
  )
  -- Upsert yearly statistics
  INSERT INTO public.user_statistics (
    user_id, period_type, period_year, period_month,
    total_distance, total_activities, total_time,
    longest_activity_distance, longest_activity_name, longest_activity_date, longest_activity_id,
    latest_activity_name, latest_activity_distance, latest_activity_date, latest_activity_id,
    updated_at
  )
  SELECT 
    p_user_id, 'yearly', activity_year, NULL,
    yearly_stats.total_distance, yearly_stats.total_activities, yearly_stats.total_time,
    la.distance, la.name, la.start_date_local, la.id,
    lat.name, lat.distance, lat.start_date_local, lat.id,
    now()
  FROM longest_activity_year la
  CROSS JOIN latest_activity_year lat
  ON CONFLICT (user_id, period_type, period_year, period_month)
  DO UPDATE SET
    total_distance = EXCLUDED.total_distance,
    total_activities = EXCLUDED.total_activities,
    total_time = EXCLUDED.total_time,
    longest_activity_distance = EXCLUDED.longest_activity_distance,
    longest_activity_name = EXCLUDED.longest_activity_name,
    longest_activity_date = EXCLUDED.longest_activity_date,
    longest_activity_id = EXCLUDED.longest_activity_id,
    latest_activity_name = EXCLUDED.latest_activity_name,
    latest_activity_distance = EXCLUDED.latest_activity_distance,
    latest_activity_date = EXCLUDED.latest_activity_date,
    latest_activity_id = EXCLUDED.latest_activity_id,
    updated_at = now();

  -- Update personal records if needed
  PERFORM public.update_personal_records(p_user_id, p_activity_date);
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update personal records
CREATE OR REPLACE FUNCTION public.update_personal_records(p_user_id UUID, p_activity_date TIMESTAMP WITH TIME ZONE)
RETURNS VOID AS $$
DECLARE
  activity_year INTEGER;
  new_records RECORD;
BEGIN
  activity_year := EXTRACT(YEAR FROM p_activity_date);
  
  -- Check for new personal records (5K, 10K, half marathon, marathon)
  FOR new_records IN 
    WITH distance_targets AS (
      SELECT unnest(ARRAY[5000, 10000, 21097, 42195]) as target_distance,
             unnest(ARRAY['5K', '10K', 'Semi-marathon', 'Marathon']) as distance_type
    ),
    best_efforts AS (
      SELECT 
        dt.target_distance,
        dt.distance_type,
        MIN(sbe.moving_time) as best_time,
        (array_agg(sbe.activity_id ORDER BY sbe.moving_time))[1] as best_activity_id,
        (array_agg(sbe.start_date_local ORDER BY sbe.moving_time))[1] as best_date
      FROM distance_targets dt
      LEFT JOIN public.strava_best_efforts sbe ON sbe.distance = dt.target_distance 
        AND sbe.user_id = p_user_id
        AND EXTRACT(YEAR FROM sbe.start_date_local) = activity_year
      GROUP BY dt.target_distance, dt.distance_type
      HAVING MIN(sbe.moving_time) IS NOT NULL
    )
    SELECT * FROM best_efforts
  LOOP
    -- Insert or update personal record
    INSERT INTO public.personal_records (
      user_id, distance_meters, distance_type, time_seconds, 
      activity_id, date, updated_at
    )
    VALUES (
      p_user_id, new_records.target_distance, new_records.distance_type, 
      new_records.best_time, new_records.best_activity_id, new_records.best_date, now()
    )
    ON CONFLICT (user_id, distance_meters) 
    DO UPDATE SET
      time_seconds = CASE 
        WHEN EXCLUDED.time_seconds < personal_records.time_seconds 
        THEN EXCLUDED.time_seconds 
        ELSE personal_records.time_seconds 
      END,
      activity_id = CASE 
        WHEN EXCLUDED.time_seconds < personal_records.time_seconds 
        THEN EXCLUDED.activity_id 
        ELSE personal_records.activity_id 
      END,
      date = CASE 
        WHEN EXCLUDED.time_seconds < personal_records.time_seconds 
        THEN EXCLUDED.date 
        ELSE personal_records.date 
      END,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function
CREATE OR REPLACE FUNCTION public.handle_strava_activity_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Recalculate stats for the deleted activity's date
    PERFORM public.recalculate_user_statistics(OLD.user_id, OLD.start_date_local);
    RETURN OLD;
  ELSE
    -- Recalculate stats for the new/updated activity's date
    PERFORM public.recalculate_user_statistics(NEW.user_id, NEW.start_date_local);
    
    -- If this is an update and the date changed, also recalculate for the old date
    IF TG_OP = 'UPDATE' AND OLD.start_date_local != NEW.start_date_local THEN
      PERFORM public.recalculate_user_statistics(OLD.user_id, OLD.start_date_local);
    END IF;
    
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_strava_activity_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.strava_activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_strava_activity_changes();

-- Migrate existing data from user_stats_cache to user_statistics
INSERT INTO public.user_statistics (
  user_id, period_type, period_year, period_month,
  total_distance, total_activities, total_time,
  longest_activity_distance, longest_activity_name, longest_activity_date,
  latest_activity_name, latest_activity_distance, latest_activity_date,
  created_at, updated_at
)
SELECT 
  user_id,
  'monthly',
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  (stats_data->>'monthly'->>'distance')::REAL,
  (stats_data->>'monthly'->>'activitiesCount')::INTEGER,
  (stats_data->>'monthly'->>'duration')::INTEGER,
  (stats_data->>'monthly'->>'longestActivity'->>'distance')::REAL,
  stats_data->>'monthly'->>'longestActivity'->>'name',
  (stats_data->>'monthly'->>'longestActivity'->>'date')::TIMESTAMP WITH TIME ZONE,
  stats_data->>'latest'->>'name',
  (stats_data->>'latest'->>'distance')::REAL,
  (stats_data->>'latest'->>'date')::TIMESTAMP WITH TIME ZONE,
  created_at,
  updated_at
FROM public.user_stats_cache
WHERE stats_data IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also insert yearly stats from cache
INSERT INTO public.user_statistics (
  user_id, period_type, period_year, period_month,
  total_distance, total_activities, total_time,
  created_at, updated_at
)
SELECT 
  user_id,
  'yearly',
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  NULL,
  (stats_data->>'yearly'->>'distance')::REAL,
  (stats_data->>'yearly'->>'activitiesCount')::INTEGER,
  0, -- duration not available in yearly cache
  created_at,
  updated_at
FROM public.user_stats_cache
WHERE stats_data IS NOT NULL
ON CONFLICT DO NOTHING;