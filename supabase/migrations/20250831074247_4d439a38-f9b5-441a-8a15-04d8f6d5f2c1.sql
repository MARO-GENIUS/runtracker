-- Drop trigger first, then function, then recreate both with proper search path
DROP TRIGGER IF EXISTS trigger_strava_activity_changes ON public.strava_activities;
DROP FUNCTION IF EXISTS public.handle_strava_activity_changes();
DROP FUNCTION IF EXISTS public.recalculate_user_statistics(UUID, TIMESTAMP WITH TIME ZONE);

-- Recreate function with proper search path
CREATE OR REPLACE FUNCTION public.recalculate_user_statistics(p_user_id UUID, p_activity_date TIMESTAMP WITH TIME ZONE)
RETURNS VOID AS $$
DECLARE
  activity_year INTEGER;
  activity_month INTEGER;
  monthly_stats RECORD;
  yearly_stats RECORD;
  longest_activity_monthly RECORD;
  latest_activity_monthly RECORD;
  longest_activity_yearly RECORD;
  latest_activity_yearly RECORD;
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
  
  -- Get longest activity for the month
  SELECT name, distance, start_date_local, id
  INTO longest_activity_monthly
  FROM public.strava_activities 
  WHERE user_id = p_user_id 
    AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
    AND EXTRACT(MONTH FROM start_date_local) = activity_month
    AND distance = monthly_stats.longest_distance
  ORDER BY start_date_local DESC
  LIMIT 1;
  
  -- Get latest activity for the month
  SELECT name, distance, start_date_local, id
  INTO latest_activity_monthly
  FROM public.strava_activities 
  WHERE user_id = p_user_id 
    AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
    AND EXTRACT(MONTH FROM start_date_local) = activity_month
  ORDER BY start_date_local DESC
  LIMIT 1;
  
  -- Upsert monthly statistics
  INSERT INTO public.user_statistics (
    user_id, period_type, period_year, period_month,
    total_distance, total_activities, total_time,
    longest_activity_distance, longest_activity_name, longest_activity_date, longest_activity_id,
    latest_activity_name, latest_activity_distance, latest_activity_date, latest_activity_id,
    updated_at
  )
  VALUES (
    p_user_id, 'monthly', activity_year, activity_month,
    monthly_stats.total_distance, monthly_stats.total_activities, monthly_stats.total_time,
    COALESCE(longest_activity_monthly.distance, 0), longest_activity_monthly.name, longest_activity_monthly.start_date_local, longest_activity_monthly.id,
    latest_activity_monthly.name, COALESCE(latest_activity_monthly.distance, 0), latest_activity_monthly.start_date_local, latest_activity_monthly.id,
    now()
  )
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
  
  -- Get longest activity for the year
  SELECT name, distance, start_date_local, id
  INTO longest_activity_yearly
  FROM public.strava_activities 
  WHERE user_id = p_user_id 
    AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
    AND distance = yearly_stats.longest_distance
  ORDER BY start_date_local DESC
  LIMIT 1;
  
  -- Get latest activity for the year
  SELECT name, distance, start_date_local, id
  INTO latest_activity_yearly
  FROM public.strava_activities 
  WHERE user_id = p_user_id 
    AND type IN ('Run', 'VirtualRun')
    AND EXTRACT(YEAR FROM start_date_local) = activity_year
  ORDER BY start_date_local DESC
  LIMIT 1;
  
  -- Upsert yearly statistics
  INSERT INTO public.user_statistics (
    user_id, period_type, period_year, period_month,
    total_distance, total_activities, total_time,
    longest_activity_distance, longest_activity_name, longest_activity_date, longest_activity_id,
    latest_activity_name, latest_activity_distance, latest_activity_date, latest_activity_id,
    updated_at
  )
  VALUES (
    p_user_id, 'yearly', activity_year, NULL,
    yearly_stats.total_distance, yearly_stats.total_activities, yearly_stats.total_time,
    COALESCE(longest_activity_yearly.distance, 0), longest_activity_yearly.name, longest_activity_yearly.start_date_local, longest_activity_yearly.id,
    latest_activity_yearly.name, COALESCE(latest_activity_yearly.distance, 0), latest_activity_yearly.start_date_local, latest_activity_yearly.id,
    now()
  )
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
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger function with proper search path
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER trigger_strava_activity_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.strava_activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_strava_activity_changes();