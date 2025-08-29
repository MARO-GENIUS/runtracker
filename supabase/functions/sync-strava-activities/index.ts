import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Rate limiting helpers
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const makeStravaRequest = async (url: string, accessToken: string, retries = 3): Promise<Response> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
        
        console.log(`Rate limit hit (429). Waiting ${waitTime}ms before retry ${attempt}/${retries}`)
        
        if (attempt < retries) {
          await wait(waitTime)
          continue
        } else {
          throw new Error(`Rate limit exceeded after ${retries} attempts. Please try again later.`)
        }
      }

      if (!response.ok) {
        throw new Error(`Strava API error: ${response.status} ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      console.log(`Request failed (attempt ${attempt}/${retries}):`, error.message)
      await wait(Math.pow(2, attempt) * 1000)
    }
  }
  
  throw new Error('Max retries exceeded')
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

    // Get user's Strava tokens securely
    const { data: tokenData, error: tokenError } = await supabaseClient.functions.invoke('secure-token-manager', {
      body: {
        action: 'get_tokens',
        userId: user.id,
      }
    })

    if (tokenError || !tokenData) {
      console.error('Failed to retrieve secure tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Strava not connected or tokens unavailable' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Also get profile info for expiry check
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('strava_expires_at')
      .eq('id', user.id)
      .single()

    // Check if token needs refresh
    const now = Math.floor(Date.now() / 1000)
    let accessToken = tokenData.access_token

    if (profile?.strava_expires_at && profile.strava_expires_at < now) {
      console.log('Token expired, refreshing...')
      try {
        const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: Deno.env.get('STRAVA_CLIENT_ID'),
            client_secret: Deno.env.get('STRAVA_CLIENT_SECRET'),
            refresh_token: tokenData.refresh_token,
            grant_type: 'refresh_token',
          }),
        })

        const refreshData = await refreshResponse.json()
        if (refreshData.access_token) {
          accessToken = refreshData.access_token
          
          // Store refreshed tokens securely
          const { error: refreshStoreError } = await supabaseClient.functions.invoke('secure-token-manager', {
            body: {
              action: 'store_tokens',
              userId: user.id,
              accessToken: refreshData.access_token,
              refreshToken: refreshData.refresh_token,
              expiresAt: refreshData.expires_at,
            }
          })

          if (refreshStoreError) {
            console.error('Failed to store refreshed tokens:', refreshStoreError)
          }

          // Update profile expiry
          await supabaseClient
            .from('profiles')
            .update({
              strava_expires_at: refreshData.expires_at,
            })
            .eq('id', user.id)
          
          console.log('Token refreshed and stored securely')
        }
      } catch (error) {
        console.error('Token refresh failed:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to refresh Strava token. Please reconnect your Strava account.' 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Fetch activities from Strava with rate limiting
    console.log('Fetching activities from Strava...')
    let activities = []
    
    try {
      const activitiesResponse = await makeStravaRequest(
        'https://www.strava.com/api/v3/athlete/activities?per_page=100',
        accessToken
      )
      activities = await activitiesResponse.json()
      console.log(`Fetched ${activities.length} activities from Strava`)
    } catch (error) {
      console.error('Failed to fetch activities:', error.message)
      
      if (error.message.includes('Rate limit exceeded')) {
        return new Response(
          JSON.stringify({ 
            error: 'Strava rate limit exceeded. Please wait a few minutes before trying again.',
            type: 'rate_limit'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      return new Response(
        JSON.stringify({ error: `Failed to fetch activities: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Filter for running activities
    const runningActivities = activities.filter((activity: any) => 
      activity.type === 'Run' || activity.type === 'VirtualRun'
    )

    let syncedCount = 0
    let skippedCount = 0

    // Insert or update activities with map data
    for (const activity of runningActivities) {
      try {
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
            // Nouvelles données de carte
            map_polyline: activity.map?.polyline || null,
            map_summary_polyline: activity.map?.summary_polyline || null,
            start_latlng: activity.start_latlng ? JSON.stringify(activity.start_latlng) : null,
            end_latlng: activity.end_latlng ? JSON.stringify(activity.end_latlng) : null,
          })
        syncedCount++
      } catch (error) {
        console.error(`Failed to sync activity ${activity.id}:`, error)
        skippedCount++
      }
    }

    // Fetch best efforts with improved error handling
    let bestEffortsResult
    try {
      bestEffortsResult = await fetchBestEfforts(supabaseClient, user.id, runningActivities, accessToken)
    } catch (error) {
      console.error('Best efforts sync partially failed:', error.message)
      bestEffortsResult = { 
        success: false, 
        message: error.message.includes('Rate limit') ? 
          'Rate limit reached during best efforts sync' : 
          'Partial sync completed'
      }
    }

    // Calculate statistics
    const stats = await calculateStatistics(supabaseClient, user.id)

    // Calculate and update personal records from best efforts
    await calculatePersonalRecordsFromBestEfforts(supabaseClient, user.id)

    const responseMessage = bestEffortsResult?.success === false ? 
      `${syncedCount} activités synchronisées. ${bestEffortsResult.message}` :
      `${syncedCount} activités synchronisées avec succès`

    return new Response(
      JSON.stringify({ 
        success: true, 
        activities_synced: syncedCount,
        activities_skipped: skippedCount,
        stats: stats,
        message: responseMessage,
        best_efforts_status: bestEffortsResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message.includes('Rate limit') ? 
          'Strava rate limit exceeded. Please try again in a few minutes.' :
          'An error occurred during synchronization'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchBestEfforts(supabaseClient: any, userId: string, activities: any[], accessToken: string) {
  console.log('Fetching best efforts for activities...')
  
  // Get activities that don't have best efforts yet
  const { data: existingEfforts } = await supabaseClient
    .from('strava_best_efforts')
    .select('activity_id')
    .eq('user_id', userId)

  const existingActivityIds = new Set(existingEfforts?.map((e: any) => e.activity_id) || [])
  const activitiesNeedingDetails = activities.filter(activity => !existingActivityIds.has(activity.id))

  console.log(`Need to fetch details for ${activitiesNeedingDetails.length} activities`)

  // Limit the number of activities processed per sync to avoid rate limits
  const maxActivitiesPerSync = 20
  const activitiesToProcess = activitiesNeedingDetails.slice(0, maxActivitiesPerSync)
  
  if (activitiesNeedingDetails.length > maxActivitiesPerSync) {
    console.log(`Processing ${maxActivitiesPerSync} activities out of ${activitiesNeedingDetails.length} to respect rate limits`)
  }

  let processedCount = 0
  let failedCount = 0

  // Fetch detailed data for each activity with enhanced rate limiting
  for (let i = 0; i < activitiesToProcess.length; i++) {
    const activity = activitiesToProcess[i]
    
    try {
      // Enhanced rate limiting: longer waits between requests
      if (i > 0) {
        const waitTime = i % 5 === 0 ? 2000 : 1000 // 2s every 5 requests, 1s otherwise
        console.log(`Waiting ${waitTime}ms before next request...`)
        await wait(waitTime)
      }

      console.log(`Fetching details for activity ${activity.id}: ${activity.name} (${i + 1}/${activitiesToProcess.length})`)
      
      const detailResponse = await makeStravaRequest(
        `https://www.strava.com/api/v3/activities/${activity.id}`,
        accessToken,
        2 // Fewer retries for individual activities
      )

      const detailData = await detailResponse.json()
      
      // Extract and store best efforts
      if (detailData.best_efforts && detailData.best_efforts.length > 0) {
        console.log(`Found ${detailData.best_efforts.length} best efforts for activity ${activity.id}`)
        
        for (const effort of detailData.best_efforts) {
          try {
            await supabaseClient
              .from('strava_best_efforts')
              .upsert({
                user_id: userId,
                activity_id: activity.id,
                name: effort.name,
                distance: effort.distance,
                moving_time: effort.moving_time,
                elapsed_time: effort.elapsed_time,
                start_date_local: activity.start_date_local,
              })
          } catch (dbError) {
            console.error(`Failed to store best effort for activity ${activity.id}:`, dbError)
          }
        }
        processedCount++
      }
    } catch (error) {
      console.error(`Error processing activity ${activity.id}:`, error.message)
      failedCount++
      
      if (error.message.includes('Rate limit exceeded')) {
        // If we hit rate limit, stop processing and return partial success
        throw new Error(`Rate limit reached after processing ${processedCount} activities`)
      }
    }
  }
  
  console.log(`Best efforts sync completed: ${processedCount} processed, ${failedCount} failed`)
  return { 
    success: true, 
    processed: processedCount, 
    failed: failedCount,
    remaining: activitiesNeedingDetails.length - activitiesToProcess.length
  }
}

async function calculatePersonalRecordsFromBestEfforts(supabaseClient: any, userId: string) {
  console.log('Calculating personal records from best efforts...')
  
  // Get all best efforts for this user
  const { data: bestEfforts } = await supabaseClient
    .from('strava_best_efforts')
    .select('*')
    .eq('user_id', userId)
    .order('moving_time', { ascending: true })

  if (!bestEfforts || bestEfforts.length === 0) {
    console.log('No best efforts found for personal records calculation')
    return
  }

  console.log(`Analyzing ${bestEfforts.length} best efforts for personal records`)

  // Group best efforts by distance and find the best time for each
  const recordsByDistance = new Map()
  
  for (const effort of bestEfforts) {
    const distance = effort.distance
    const key = `${Math.round(distance)}`
    
    if (!recordsByDistance.has(key) || recordsByDistance.get(key).moving_time > effort.moving_time) {
      recordsByDistance.set(key, effort)
    }
  }

  // Clear existing records for this user
  await supabaseClient
    .from('personal_records')
    .delete()
    .eq('user_id', userId)

  console.log('Cleared existing personal records')

  // Standard distance mappings for better display
  const distanceTypeMap: { [key: string]: string } = {
    '400': '400m',
    '800': '800m',
    '1000': '1km',
    '1609': '1mile',
    '1610': '1mile', // Sometimes Strava uses 1610m for 1 mile
    '3000': '3km',
    '3219': '2miles', // 2 miles ≈ 3219m
    '5000': '5km',
    '8000': '8km',
    '10000': '10km',
    '15000': '15km',
    '21097': 'semi',
    '42195': 'marathon',
  }

  // Insert new records
  for (const [distanceKey, bestEffort] of recordsByDistance) {
    const distance = parseInt(distanceKey)
    const distanceType = distanceTypeMap[distanceKey] || `${(distance / 1000).toFixed(1)}km`
    
    // Only include meaningful distances (>= 400m)
    if (distance >= 400) {
      console.log(`Found record for ${distanceType}: ${bestEffort.moving_time}s`)
      
      // Get activity details for location
      const { data: activity } = await supabaseClient
        .from('strava_activities')
        .select('location_city, location_state, location_country')
        .eq('id', bestEffort.activity_id)
        .single()
      
      await supabaseClient
        .from('personal_records')
        .insert({
          user_id: userId,
          distance_type: distanceType,
          distance_meters: distance,
          time_seconds: bestEffort.moving_time,
          activity_id: bestEffort.activity_id,
          date: bestEffort.start_date_local,
          location: activity ? [activity.location_city, activity.location_state, activity.location_country]
            .filter(Boolean)
            .join(', ') || 'Non spécifié' : 'Non spécifié',
        })
    }
  }

  console.log('Personal records calculation from best efforts completed')
}

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
  const monthlyDuration = monthActivities?.reduce((sum, activity) => sum + (activity.moving_time || 0), 0) || 0
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
      duration: monthlyDuration, // Durée en secondes
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
