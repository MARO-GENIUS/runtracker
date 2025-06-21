
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Invalid authorization')
    }

    const { activityId } = await req.json()

    if (!activityId) {
      throw new Error('Activity ID is required')
    }

    console.log(`Fetching details for activity ${activityId}`)

    // Get user's Strava access token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('strava_access_token, strava_refresh_token, strava_token_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.strava_access_token) {
      throw new Error('Strava not connected')
    }

    // Check if token needs refresh
    let accessToken = profile.strava_access_token
    if (profile.strava_token_expires_at && new Date(profile.strava_token_expires_at * 1000) <= new Date()) {
      console.log('Token expired, refreshing...')
      
      const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('STRAVA_CLIENT_ID') ?? '',
          client_secret: Deno.env.get('STRAVA_CLIENT_SECRET') ?? '',
          refresh_token: profile.strava_refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh Strava token')
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      // Update the token in the database
      await supabase
        .from('profiles')
        .update({
          strava_access_token: refreshData.access_token,
          strava_refresh_token: refreshData.refresh_token,
          strava_token_expires_at: refreshData.expires_at,
        })
        .eq('id', user.id)

      console.log('Token refreshed successfully')
    }

    // Fetch activity streams for detailed data
    const streamsResponse = await fetch(
      `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=latlng,distance,altitude,velocity_smooth,heartrate,cadence,watts,temp,moving,grade_smooth&key_by_type=true`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    let streams = null
    if (streamsResponse.ok) {
      streams = await streamsResponse.json()
      console.log('Successfully fetched activity streams')
    } else {
      console.log('Could not fetch activity streams, using basic data only')
    }

    // Try to get best efforts from our database (stored during sync)
    const { data: bestEfforts } = await supabase
      .from('strava_best_efforts')
      .select('*')
      .eq('activity_id', activityId)
      .order('distance', { ascending: true })

    // Generate splits if we have distance data
    let splits = []
    if (streams?.distance?.data && streams?.distance?.data.length > 0) {
      const distanceData = streams.distance.data
      const timeData = streams.time?.data || []
      
      // Create kilometer splits
      let currentKm = 1
      let lastIndex = 0
      
      for (let i = 0; i < distanceData.length; i++) {
        if (distanceData[i] >= currentKm * 1000) {
          const splitTime = timeData[i] - (timeData[lastIndex] || 0)
          splits.push({
            split: currentKm,
            distance: 1000,
            moving_time: splitTime,
            elapsed_time: splitTime,
            elevation_difference: 0, // Could calculate from altitude data if available
            average_speed: 1000 / splitTime // m/s
          })
          
          lastIndex = i
          currentKm++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        best_efforts: bestEfforts || [],
        splits: splits,
        streams: streams ? Object.keys(streams) : []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error fetching activity details:', error)
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
