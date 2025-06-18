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

    // Calculate and update personal records with improved algorithm
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
  // ... keep existing code (statistics calculation)
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
  console.log('Starting improved personal records calculation...')
  
  // Get all running activities for this user
  const { data: activities } = await supabaseClient
    .from('strava_activities')
    .select('*')
    .eq('user_id', userId)
    .order('moving_time', { ascending: true })

  if (!activities || activities.length === 0) {
    console.log('No activities found for personal records calculation')
    return
  }

  console.log(`Analyzing ${activities.length} activities for personal records`)

  // Define standard distances with adaptive tolerances
  const standardDistances = [
    { type: '400m', meters: 400, tolerance: 0.10 }, // 10% tolerance for short distances
    { type: '800m', meters: 800, tolerance: 0.10 },
    { type: '1km', meters: 1000, tolerance: 0.08 },
    { type: '1mile', meters: 1609, tolerance: 0.08 }, // 1 mile
    { type: '2km', meters: 2000, tolerance: 0.08 },
    { type: '3km', meters: 3000, tolerance: 0.08 },
    { type: '5km', meters: 5000, tolerance: 0.06 },
    { type: '8km', meters: 8000, tolerance: 0.06 },
    { type: '10km', meters: 10000, tolerance: 0.05 },
    { type: '15km', meters: 15000, tolerance: 0.05 },
    { type: 'semi', meters: 21097, tolerance: 0.03 }, // Half marathon
    { type: 'marathon', meters: 42195, tolerance: 0.02 }, // Marathon
    { type: '50km', meters: 50000, tolerance: 0.02 },
  ]

  // Also detect actual distances from activities (group similar distances)
  const distanceGroups = new Map()
  
  activities.forEach(activity => {
    const distance = activity.distance
    const kmDistance = Math.round(distance / 100) * 100 // Group by 100m intervals
    
    if (!distanceGroups.has(kmDistance) || 
        distanceGroups.get(kmDistance).moving_time > activity.moving_time) {
      distanceGroups.set(kmDistance, activity)
    }
  })

  // Clear existing records for this user
  await supabaseClient
    .from('personal_records')
    .delete()
    .eq('user_id', userId)

  console.log('Cleared existing personal records')

  // Calculate records for standard distances
  for (const distance of standardDistances) {
    const tolerance = distance.meters * distance.tolerance
    const minDistance = distance.meters - tolerance
    const maxDistance = distance.meters + tolerance

    const bestActivity = activities.find(activity => 
      activity.distance >= minDistance && 
      activity.distance <= maxDistance
    )

    if (bestActivity) {
      console.log(`Found record for ${distance.type}: ${bestActivity.moving_time}s`)
      
      await supabaseClient
        .from('personal_records')
        .insert({
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

  // Add records for other significant distances found in activities
  const significantDistances = Array.from(distanceGroups.entries())
    .filter(([distance, activity]) => {
      // Only include distances that are not too close to standard distances
      return !standardDistances.some(std => {
        const tolerance = std.meters * std.tolerance
        return Math.abs(distance - std.meters) <= tolerance
      }) && distance >= 1000 // At least 1km
    })
    .sort(([a], [b]) => a - b) // Sort by distance

  for (const [distance, activity] of significantDistances.slice(0, 10)) { // Limit to 10 additional distances
    const distanceType = `${(distance / 1000).toFixed(1)}km`
    
    console.log(`Found additional record for ${distanceType}: ${activity.moving_time}s`)
    
    await supabaseClient
      .from('personal_records')
      .insert({
        user_id: userId,
        distance_type: distanceType,
        distance_meters: distance,
        time_seconds: activity.moving_time,
        activity_id: activity.id,
        date: activity.start_date,
        location: [activity.location_city, activity.location_state, activity.location_country]
          .filter(Boolean)
          .join(', ') || 'Non spécifié',
      })
  }

  console.log('Personal records calculation completed')
}
