
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

    const { action } = await req.json()

    if (action === 'get_auth_url') {
      const clientId = Deno.env.get('STRAVA_CLIENT_ID')
      if (!clientId) {
        return new Response(
          JSON.stringify({ error: 'Strava client ID not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const stateSecret = Deno.env.get('STRAVA_STATE_SECRET')
      if (!stateSecret) {
        return new Response(
          JSON.stringify({ error: 'Missing STRAVA_STATE_SECRET' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Use the new callback function URL
      const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/strava-callback`
      const scope = 'read,activity:read_all'

      // Create a signed, expiring state: userId.timestamp.signature
      const enc = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        enc.encode(stateSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const timestamp = Date.now().toString()
      const payload = `${user.id}:${timestamp}`
      const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
      const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
      const state = `${user.id}.${timestamp}.${sigHex}`

      const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=${scope}&state=${state}`

      console.log('Generated auth URL with redirect and signed state:', { redirectUri, userId: user.id })

      return new Response(
        JSON.stringify({ auth_url: authUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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
