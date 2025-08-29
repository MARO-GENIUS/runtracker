import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Token encryption utilities using Web Crypto API
class TokenEncryption {
  private static async getEncryptionKey(): Promise<CryptoKey> {
    const keyMaterial = Deno.env.get('STRAVA_STATE_SECRET') || 'fallback-key-material-for-dev'
    const enc = new TextEncoder()
    const keyData = enc.encode(keyMaterial.padEnd(32, '0').slice(0, 32)) // Ensure 32 bytes
    
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    )
  }

  static async encryptToken(token: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey()
      const enc = new TextEncoder()
      const data = enc.encode(token)
      
      // Generate random IV (96 bits for AES-GCM)
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
      
      // Return base64 encoded
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      console.error('Token encryption failed:', error)
      throw new Error('Token encryption failed')
    }
  }

  static async decryptToken(encryptedToken: string): Promise<string> {
    try {
      const key = await this.getEncryptionKey()
      
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedToken).split('').map(char => char.charCodeAt(0))
      )
      
      // Extract IV (first 12 bytes) and encrypted data
      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      )
      
      const dec = new TextDecoder()
      return dec.decode(decrypted)
    } catch (error) {
      console.error('Token decryption failed:', error)
      throw new Error('Token decryption failed')
    }
  }
}

serve(async (req) => {
  console.log('Secure Token Manager:', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin Supabase client for secure operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, userId, accessToken, refreshToken, expiresAt } = await req.json()

    switch (action) {
      case 'store_tokens':
        if (!userId || !accessToken || !refreshToken) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Encrypting and storing tokens for user:', userId)
        
        const encryptedAccessToken = await TokenEncryption.encryptToken(accessToken)
        const encryptedRefreshToken = await TokenEncryption.encryptToken(refreshToken)

        const { error: storeError } = await supabaseAdmin
          .from('encrypted_tokens')
          .upsert({
            user_id: userId,
            encrypted_access_token: encryptedAccessToken,
            encrypted_refresh_token: encryptedRefreshToken,
            token_expires_at: expiresAt,
          })

        if (storeError) {
          console.error('Failed to store encrypted tokens:', storeError)
          return new Response(
            JSON.stringify({ error: 'Failed to store tokens securely' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Tokens stored securely for user:', userId)
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_tokens':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Retrieving tokens for user:', userId)

        const { data: tokenData, error: getError } = await supabaseAdmin
          .from('encrypted_tokens')
          .select('encrypted_access_token, encrypted_refresh_token, token_expires_at')
          .eq('user_id', userId)
          .single()

        if (getError || !tokenData) {
          console.error('Failed to retrieve tokens:', getError)
          return new Response(
            JSON.stringify({ error: 'Tokens not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!tokenData.encrypted_access_token || !tokenData.encrypted_refresh_token) {
          return new Response(
            JSON.stringify({ error: 'Tokens not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const decryptedAccessToken = await TokenEncryption.decryptToken(tokenData.encrypted_access_token)
        const decryptedRefreshToken = await TokenEncryption.decryptToken(tokenData.encrypted_refresh_token)

        console.log('Tokens decrypted successfully for user:', userId)
        return new Response(
          JSON.stringify({
            access_token: decryptedAccessToken,
            refresh_token: decryptedRefreshToken,
            expires_at: tokenData.token_expires_at,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'delete_tokens':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'Missing userId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Deleting tokens for user:', userId)

        const { error: deleteError } = await supabaseAdmin
          .from('encrypted_tokens')
          .delete()
          .eq('user_id', userId)

        if (deleteError) {
          console.error('Failed to delete tokens:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete tokens' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log('Tokens deleted successfully for user:', userId)
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Secure Token Manager error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})