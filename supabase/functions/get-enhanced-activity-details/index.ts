
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const makeStravaRequest = async (url: string, accessToken: string, retries = 2): Promise<Response> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000
        if (attempt < retries) {
          await wait(waitTime)
          continue
        }
        throw new Error('Rate limit exceeded')
      }

      if (!response.ok) {
        throw new Error(`Strava API error: ${response.status}`)
      }

      return response
    } catch (error) {
      if (attempt === retries) throw error
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
    const processedStreams = {
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
        if (stream.type && processedStreams[stream.type] !== undefined) {
          processedStreams[stream.type] = stream.data || []
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

function calculateDerivedMetrics(activity: any, streams: any) {
  const metrics: any = {}

  // Dénivelé moyen par km
  if (activity.total_elevation_gain && activity.distance) {
    metrics.avgElevationGainPerKm = (activity.total_elevation_gain / (activity.distance / 1000)).toFixed(1)
  }

  // Variabilité de la fréquence cardiaque
  if (streams.heartrate && streams.heartrate.length > 0) {
    const hrData = streams.heartrate.filter((hr: number) => hr > 0)
    if (hrData.length > 0) {
      const mean = hrData.reduce((sum: number, hr: number) => sum + hr, 0) / hrData.length
      const variance = hrData.reduce((sum: number, hr: number) => sum + Math.pow(hr - mean, 2), 0) / hrData.length
      metrics.heartRateVariability = Math.sqrt(variance).toFixed(1)
    }
  }

  // Zones d'effort (estimées)
  if (activity.average_heartrate) {
    const avgHr = activity.average_heartrate
    const maxHr = activity.max_heartrate || avgHr * 1.15
    
    metrics.effortZones = {
      zone1: Math.round(maxHr * 0.6), // Récupération
      zone2: Math.round(maxHr * 0.7), // Aérobie
      zone3: Math.round(maxHr * 0.8), // Seuil
      zone4: Math.round(maxHr * 0.9), // Anaérobie
      zone5: Math.round(maxHr * 1.0), // Neuromusculaire
    }

    // Déterminer la zone principale
    if (avgHr < metrics.effortZones.zone1) metrics.primaryZone = 'Récupération'
    else if (avgHr < metrics.effortZones.zone2) metrics.primaryZone = 'Aérobie légère'
    else if (avgHr < metrics.effortZones.zone3) metrics.primaryZone = 'Aérobie'
    else if (avgHr < metrics.effortZones.zone4) metrics.primaryZone = 'Seuil'
    else if (avgHr < metrics.effortZones.zone5) metrics.primaryZone = 'Anaérobie'
    else metrics.primaryZone = 'Neuromusculaire'
  }

  // Analyse de régularité d'allure
  if (streams.velocity && streams.velocity.length > 0) {
    const speeds = streams.velocity.filter((v: number) => v > 0)
    if (speeds.length > 0) {
      const meanSpeed = speeds.reduce((sum: number, speed: number) => sum + speed, 0) / speeds.length
      const speedVariance = speeds.reduce((sum: number, speed: number) => sum + Math.pow(speed - meanSpeed, 2), 0) / speeds.length
      metrics.paceConsistency = (1 / (1 + Math.sqrt(speedVariance))).toFixed(3) // Score de 0 à 1
    }
  }

  // Cadence moyenne si disponible
  if (streams.cadence && streams.cadence.length > 0) {
    const cadenceData = streams.cadence.filter((c: number) => c > 0)
    if (cadenceData.length > 0) {
      metrics.avgCadence = Math.round(cadenceData.reduce((sum: number, c: number) => sum + c, 0) / cadenceData.length)
      metrics.hasCadenceData = true
    }
  }

  return metrics
}
