-- Force populate user_statistics table with existing data
DO $$
DECLARE
    activity_record RECORD;
    user_record RECORD;
BEGIN
    -- Loop through all users who have activities
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM public.strava_activities 
        WHERE type IN ('Run', 'VirtualRun')
    LOOP
        -- Get all unique year-month combinations for this user
        FOR activity_record IN 
            SELECT DISTINCT 
                EXTRACT(YEAR FROM start_date_local)::INTEGER as activity_year,
                EXTRACT(MONTH FROM start_date_local)::INTEGER as activity_month,
                start_date_local
            FROM public.strava_activities 
            WHERE user_id = user_record.user_id 
            AND type IN ('Run', 'VirtualRun')
        LOOP
            -- Call the recalculate function for each period
            PERFORM public.recalculate_user_statistics(
                user_record.user_id, 
                activity_record.start_date_local
            );
            
            RAISE LOG 'Recalculated stats for user % year % month %', 
                user_record.user_id, 
                activity_record.activity_year, 
                activity_record.activity_month;
        END LOOP;
        
        RAISE LOG 'Completed stats calculation for user %', user_record.user_id;
    END LOOP;
    
    RAISE LOG 'Migration completed successfully';
END $$;