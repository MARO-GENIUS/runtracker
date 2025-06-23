
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
      .select('strava_access_token, strava_refresh_token, strava_expires_at')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      throw new Error('Could not fetch user profile')
    }

    if (!profile?.strava_access_token) {
      console.log('No Strava access token found')
      return new Response(
        JSON.stringify({
          success: true,
          best_efforts: [],
          splits: [],
          heart_rate_stream: null,
          message: 'No Strava token available'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Check if token needs refresh
    let accessToken = profile.strava_access_token
    if (profile.strava_expires_at && new Date(profile.strava_expires_at * 1000) <= new Date()) {
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
        console.error('Failed to refresh token:', await refreshResponse.text())
        return new Response(
          JSON.stringify({
            success: true,
            best_efforts: [],
            splits: [],
            heart_rate_stream: null,
            message: 'Token refresh failed'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      // Update the token in the database
      await supabase
        .from('profiles')
        .update({
          strava_access_token: refreshData.access_token,
          strava_refresh_token: refreshData.refresh_token,
          strava_expires_at: refreshData.expires_at,
        })
        .eq('id', user.id)

      console.log('Token refreshed successfully')
    }

    let bestEfforts = []
    let splits = []
    let heartRateStream = null

    // Fetch detailed activity data from Strava API
    try {
      console.log('Fetching activity details from Strava API...')
      const activityResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}?include_all_efforts=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        console.log('Successfully fetched activity details from Strava')
        
        // Extract best efforts from activity data
        if (activityData?.best_efforts && Array.isArray(activityData.best_efforts)) {
          bestEfforts = activityData.best_efforts.map(effort => ({
            name: effort.name,
            distance: effort.distance,
            moving_time: effort.moving_time,
            elapsed_time: effort.elapsed_time,
            start_date_local: effort.start_date_local
          }))
          console.log(`Found ${bestEfforts.length} best efforts`)
        }

        // Extract splits from activity data
        if (activityData?.splits_metric && Array.isArray(activityData.splits_metric)) {
          splits = activityData.splits_metric.map((split, index) => ({
            split: index + 1,
            distance: split.distance,
            moving_time: split.moving_time,
            elapsed_time: split.elapsed_time,
            elevation_difference: split.elevation_difference || 0,
            average_speed: split.average_speed
          }))
          console.log(`Found ${splits.length} splits`)
        }
      } else {
        const errorText = await activityResponse.text()
        console.log(`Could not fetch activity details: ${activityResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error fetching activity details:', error)
    }

    // Fetch activity streams (time series data)
    try {
      console.log('Fetching activity streams from Strava API...')
      const streamsResponse = await fetch(
        `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=heartrate,time,distance&key_by_type=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (streamsResponse.ok) {
        const streamsData = await streamsResponse.json()
        console.log('Successfully fetched activity streams from Strava')
        console.log('Streams data keys:', Object.keys(streamsData || {}))
        
        if (streamsData?.heartrate && streamsData?.time) {
          const heartRateData = streamsData.heartrate.data
          const timeData = streamsData.time.data
          const distanceData = streamsData.distance?.data || []
          
          // Combine the data into a usable format
          heartRateStream = timeData.map((time: number, index: number) => ({
            time,
            heartRate: heartRateData[index] || null,
            distance: distanceData[index] || null
          })).filter((point: any) => point.heartRate !== null)
          
          console.log(`Created ${heartRateStream.length} heart rate data points`)
        } else {
          console.log('No heart rate or time data found in streams')
        }
      } else {
        const errorText = await streamsResponse.text()
        console.log(`Could not fetch activity streams: ${streamsResponse.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error fetching activity streams:', error)
    }

    return new Response(
      JSON.stringify({
        success: true,
        best_efforts: bestEfforts,
        splits: splits,
        heart_rate_stream: heartRateStream
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
