
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Strava callback received:', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin Supabase client for non-authenticated operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // Contains user ID
    const error = url.searchParams.get('error')

    console.log('Callback params:', { code: !!code, state, error })

    if (error) {
      console.error('Strava authorization error:', error)
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=strava_denied`)
    }

    if (!code || !state) {
      console.error('Missing code or state parameter')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=missing_params`)
    }

    // Verify signed state (userId.timestamp.signature)
    const stateSecret = Deno.env.get('STRAVA_STATE_SECRET')
    if (!stateSecret) {
      console.error('Missing STRAVA_STATE_SECRET')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=server_config`)
    }

    const parts = state.split('.')
    if (parts.length !== 3) {
      console.error('Invalid state format')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=invalid_state`)
    }

    const [stateUserId, tsStr, sig] = parts
    const ts = parseInt(tsStr, 10)
    if (!Number.isFinite(ts)) {
      console.error('Invalid state timestamp')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=invalid_state_ts`)
    }

    // 10 minutes max age
    const maxAgeMs = 10 * 60 * 1000
    if (Math.abs(Date.now() - ts) > maxAgeMs) {
      console.error('State expired')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=state_expired`)
    }

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(stateSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const payload = `${stateUserId}:${tsStr}`
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const expectedSig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

    // Constant-time compare
    const safeEqual = (a: string, b: string) => {
      if (a.length !== b.length) return false
      let result = 0
      for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
      }
      return result === 0
    }

    if (!safeEqual(sig, expectedSig)) {
      console.error('Invalid state signature')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=invalid_state_sig`)
    }

    const verifiedUserId = stateUserId

    const clientId = Deno.env.get('STRAVA_CLIENT_ID')
    const clientSecret = Deno.env.get('STRAVA_CLIENT_SECRET')
    
    if (!clientId || !clientSecret) {
      console.error('Missing Strava credentials')
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=config_error`)
    }

    console.log('Exchanging code for tokens...')
    
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
    console.log('Token exchange response:', { success: !!tokenData.access_token, athlete_id: tokenData.athlete?.id })

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=token_exchange_failed`)
    }

    // Store tokens in profiles table using the verified user ID
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: verifiedUserId,
        strava_user_id: tokenData.athlete.id,
        strava_access_token: tokenData.access_token,
        strava_refresh_token: tokenData.refresh_token,
        strava_expires_at: tokenData.expires_at,
        first_name: tokenData.athlete.firstname,
        last_name: tokenData.athlete.lastname,
        profile_picture: tokenData.athlete.profile,
      })

    if (updateError) {
      console.error('Failed to store tokens:', updateError)
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/?error=storage_failed`)
    }

    console.log('Tokens stored successfully for user:', verifiedUserId)

    // Redirect to app with success message
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')
    return Response.redirect(`${appUrl}/?strava_connected=true`)

  } catch (error) {
    console.error('Callback error:', error)
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')
    return Response.redirect(`${appUrl}/?error=callback_error`)
  }
})
