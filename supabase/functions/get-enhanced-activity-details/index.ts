
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { makeStravaRequest } from './http-utils.ts'
import { calculateDerivedMetrics } from './metrics-calculator.ts'
import { ProcessedStreams } from './types.ts'

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

    const { activityId } = await req.json()

    // Get user's Strava tokens
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('strava_access_token')
      .eq('id', user.id)
      .single()

    if (!profile?.strava_access_token) {
      return new Response(
        JSON.stringify({ error: 'Strava not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get activity details
    const activityResponse = await makeStravaRequest(
      `https://www.strava.com/api/v3/activities/${activityId}`,
      profile.strava_access_token
    )
    const activityData = await activityResponse.json()

    // Get available streams (including cadence if available)
    const streamTypes = ['time', 'heartrate', 'cadence', 'distance', 'altitude', 'velocity_smooth', 'grade_smooth']
    const streamsUrl = `https://www.strava.com/api/v3/activities/${activityId}/streams/${streamTypes.join(',')}`
    
    let streams = []
    try {
      const streamsResponse = await makeStravaRequest(streamsUrl, profile.strava_access_token)
      streams = await streamsResponse.json()
    } catch (error) {
      console.log('Streams not available for this activity')
    }

    // Process streams into usable format
    const processedStreams: ProcessedStreams = {
      time: [],
      heartrate: [],
      cadence: [],
      distance: [],
      altitude: [],
      velocity: [],
      grade: []
    }

    if (Array.isArray(streams)) {
      streams.forEach(stream => {
        if (stream.type && processedStreams[stream.type as keyof ProcessedStreams] !== undefined) {
          processedStreams[stream.type as keyof ProcessedStreams] = stream.data || []
        }
      })
    }

    // Calculate derived metrics
    const derivedMetrics = calculateDerivedMetrics(activityData, processedStreams)

    return new Response(
      JSON.stringify({
        success: true,
        activity: activityData,
        streams: processedStreams,
        derivedMetrics,
        best_efforts: activityData.best_efforts || [],
        splits: activityData.splits_metric || []
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
