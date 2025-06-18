
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's Strava tokens
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile?.strava_access_token) {
      return new Response(
        JSON.stringify({ error: 'Strava not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000)
    let accessToken = profile.strava_access_token

    if (profile.strava_expires_at && profile.strava_expires_at < now) {
      console.log('Token expired, refreshing...')
      // Refresh token
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: Deno.env.get('STRAVA_CLIENT_ID'),
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
          refresh_token: profile.strava_refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      const refreshData = await refreshResponse.json()
      if (refreshData.access_token) {
        accessToken = refreshData.access_token
        
        // Update tokens in database
        await supabaseClient
          .from('profiles')
          .update({
            strava_access_token: refreshData.access_token,
            strava_refresh_token: refreshData.refresh_token,
            strava_expires_at: refreshData.expires_at,
          })
          .eq('id', user.id)
        
        console.log('Token refreshed successfully')
      }
    }

    // Fetch activities from Strava
    console.log('Fetching activities from Strava...')
    const activitiesResponse = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=200',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    if (!activitiesResponse.ok) {
      console.error('Strava API error:', activitiesResponse.status, activitiesResponse.statusText)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch activities from Strava' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const activities = await activitiesResponse.json()
    console.log(`Fetched ${activities.length} activities from Strava`)
    
    // Filter for running activities
    const runningActivities = activities.filter((activity: any) => 
      activity.type === 'Run' || activity.type === 'VirtualRun'
    )

    // Insert or update activities
    for (const activity of runningActivities) {
      await supabaseClient
        .from('strava_activities')
        .upsert({
          id: activity.id,
          user_id: user.id,
          name: activity.name,
          type: activity.type,
          distance: activity.distance,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
          total_elevation_gain: activity.total_elevation_gain,
          start_date: activity.start_date,
          start_date_local: activity.start_date_local,
          location_city: activity.location_city,
          location_state: activity.location_state,
          location_country: activity.location_country,
          average_speed: activity.average_speed,
          max_speed: activity.max_speed,
          average_heartrate: activity.average_heartrate,
          max_heartrate: activity.max_heartrate,
          suffer_score: activity.suffer_score,
          calories: activity.kilojoules ? activity.kilojoules * 0.239006 : null,
        })
    }

    // Calculate statistics
    const stats = await calculateStatistics(supabaseClient, user.id)

    // Calculate and update personal records
    await calculatePersonalRecords(supabaseClient, user.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        activities_synced: runningActivities.length,
        stats: stats,
        message: `${runningActivities.length} activités synchronisées avec succès`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function calculateStatistics(supabaseClient: any, userId: string) {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  // Get current month activities
  const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString()
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()

  const { data: monthActivities } = await supabaseClient
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', startOfMonth)
    .lte('start_date', endOfMonth)
    .order('start_date', { ascending: false })

  // Get current year activities
  const startOfYear = new Date(currentYear, 0, 1).toISOString()
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()

  const { data: yearActivities } = await supabaseClient
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .gte('start_date', startOfYear)
    .lte('start_date', endOfYear)
    .order('start_date', { ascending: false })

  // Calculate monthly stats
  const monthlyDistance = monthActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0
  const monthlyActivitiesCount = monthActivities?.length || 0
  const longestMonthlyActivity = monthActivities?.reduce((longest, activity) => 
    activity.distance > (longest?.distance || 0) ? activity : longest, null)

  // Calculate yearly stats
  const yearlyDistance = yearActivities?.reduce((sum, activity) => sum + (activity.distance / 1000), 0) || 0
  const yearlyActivitiesCount = yearActivities?.length || 0

  // Get latest activity
  const { data: latestActivity } = await supabaseClient
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(1)

  return {
    monthly: {
      distance: Math.round(monthlyDistance * 10) / 10,
      activitiesCount: monthlyActivitiesCount,
      longestActivity: longestMonthlyActivity ? {
        name: longestMonthlyActivity.name,
        distance: Math.round((longestMonthlyActivity.distance / 1000) * 10) / 10,
        date: longestMonthlyActivity.start_date_local
      } : null
    },
    yearly: {
      distance: Math.round(yearlyDistance * 10) / 10,
      activitiesCount: yearlyActivitiesCount
    },
    latest: latestActivity?.[0] ? {
      name: latestActivity[0].name,
      distance: Math.round((latestActivity[0].distance / 1000) * 10) / 10,
      date: latestActivity[0].start_date_local
    } : null
  }
}

async function calculatePersonalRecords(supabaseClient: any, userId: string) {
  // Define distances to calculate records for
  const distances = [
    { type: '1km', meters: 1000 },
    { type: '5km', meters: 5000 },
    { type: '10km', meters: 10000 },
    { type: 'semi', meters: 21097 },
    { type: 'marathon', meters: 42195 },
  ]

  for (const distance of distances) {
    // Find best time for this distance (allowing 5% tolerance)
    const tolerance = distance.meters * 0.05
    const minDistance = distance.meters - tolerance
    const maxDistance = distance.meters + tolerance

    const { data: activities } = await supabaseClient
      .from('strava_activities')
      .select('*')
      .eq('user_id', userId)
      .gte('distance', minDistance)
      .lte('distance', maxDistance)
      .order('moving_time', { ascending: true })
      .limit(1)

    if (activities && activities.length > 0) {
      const bestActivity = activities[0]
      
      await supabaseClient
        .from('personal_records')
        .upsert({
          user_id: userId,
          distance_type: distance.type,
          distance_meters: distance.meters,
          time_seconds: bestActivity.moving_time,
          activity_id: bestActivity.id,
          date: bestActivity.start_date,
          location: [bestActivity.location_city, bestActivity.location_state, bestActivity.location_country]
            .filter(Boolean)
            .join(', ') || 'Non spécifié',
        })
    }
  }
}
