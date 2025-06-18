
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

    // Store tokens in profiles table using the user ID from state
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: state, // User ID from state parameter
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

    console.log('Tokens stored successfully for user:', state)

    // Redirect to app with success message
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')
    return Response.redirect(`${appUrl}/?strava_connected=true`)

  } catch (error) {
    console.error('Callback error:', error)
    const appUrl = Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')
    return Response.redirect(`${appUrl}/?error=callback_error`)
  }
})
