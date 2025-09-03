import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple encryption/decryption using AES-GCM
async function encrypt(plaintext: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintext)
  const passwordKey = encoder.encode(password.padEnd(32, '0').slice(0, 32))
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

async function decrypt(encryptedData: string, password: string): Promise<string> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const passwordKey = encoder.encode(password.padEnd(32, '0').slice(0, 32))
  
  const key = await crypto.subtle.importKey(
    'raw',
    passwordKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  )
  
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  )
  
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encrypted
  )
  
  return decoder.decode(decrypted)
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userId, accessToken, refreshToken, expiresAt } = await req.json()
    
    console.log(`Secure Token Manager: ${req.method} ${req.url}`)
    console.log(`Action: ${action}, User ID: ${userId}`)

    const encryptionKey = Deno.env.get('STRAVA_STATE_SECRET') || 'default-secret-key'

    switch (action) {
      case 'store_tokens': {
        if (!userId || !accessToken) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Encrypt the tokens
        const encryptedAccessToken = await encrypt(accessToken, encryptionKey)
        const encryptedRefreshToken = refreshToken ? await encrypt(refreshToken, encryptionKey) : null

        // Store in database
        const { error } = await supabase
          .from('encrypted_tokens')
          .upsert({
            user_id: userId,
            encrypted_access_token: encryptedAccessToken,
            encrypted_refresh_token: encryptedRefreshToken,
            token_expires_at: expiresAt,
            encryption_version: 1,
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Database error:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to store tokens' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_tokens': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing user ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`Retrieving tokens for user: ${userId}`)

        // Get encrypted tokens from database
        const { data: tokenData, error } = await supabase
          .from('encrypted_tokens')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          console.error('Failed to retrieve tokens:', error)
          return new Response(
            JSON.stringify({ error: 'No tokens found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Decrypt the tokens
        try {
          const accessToken = await decrypt(tokenData.encrypted_access_token, encryptionKey)
          const refreshToken = tokenData.encrypted_refresh_token 
            ? await decrypt(tokenData.encrypted_refresh_token, encryptionKey)
            : null

          return new Response(
            JSON.stringify({
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: tokenData.token_expires_at
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } catch (decryptError) {
          console.error('Decryption error:', decryptError)
          return new Response(
            JSON.stringify({ error: 'Failed to decrypt tokens' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      case 'delete_tokens': {
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing user ID' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Delete tokens from database
        const { error } = await supabase
          .from('encrypted_tokens')
          .delete()
          .eq('user_id', userId)

        if (error) {
          console.error('Failed to delete tokens:', error)
          return new Response(
            JSON.stringify({ error: 'Failed to delete tokens' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Secure Token Manager error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})