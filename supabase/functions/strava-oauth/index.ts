
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

    const { action, code, state } = await req.json()

    if (action === 'get_auth_url') {
      const clientId = Deno.env.get('STRAVA_CLIENT_ID')
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Strava client ID not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/strava-oauth`
      const scope = 'read,activity:read_all'
      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}&state=${user.id}`

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'exchange_token') {
      const clientId = Deno.env.get('STRAVA_CLIENT_ID')
      const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
      
      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: 'Strava credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
        }),
      })

      const tokenData = await tokenResponse.json()

      if (tokenData.access_token) {
        // Store tokens in profiles table
        await supabaseClient
          .from('profiles')
          .upsert({
            id: user.id,
            strava_user_id: tokenData.athlete.id,
            strava_access_token: tokenData.access_token,
            strava_refresh_token: tokenData.refresh_token,
            strava_expires_at: tokenData.expires_at,
            first_name: tokenData.athlete.firstname,
            last_name: tokenData.athlete.lastname,
            profile_picture: tokenData.athlete.profile,
          })

        return new Response(
          JSON.stringify({ success: true, athlete: tokenData.athlete }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
