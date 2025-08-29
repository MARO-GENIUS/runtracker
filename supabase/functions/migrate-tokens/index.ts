import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('Token Migration Utility:', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin Supabase client for migration operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    if (action === 'check_migration_status') {
      // Check if there are any users that need token migration
      // Note: Since we already dropped the token columns, we'll check for users with strava_user_id
      // but no encrypted_tokens entry
      
      const { data: profilesWithStrava } = await supabaseAdmin
        .from('profiles')
        .select('id, strava_user_id')
        .not('strava_user_id', 'is', null)

      const { data: existingEncryptedTokens } = await supabaseAdmin
        .from('encrypted_tokens')
        .select('user_id')

      const existingTokenUsers = new Set(existingEncryptedTokens?.map((t: any) => t.user_id) || [])
      const needsMigration = profilesWithStrava?.filter((p: any) => !existingTokenUsers.has(p.id)) || []

      console.log(`Migration status: ${needsMigration.length} users need re-authentication`)

      return new Response(
        JSON.stringify({
          success: true,
          users_with_strava: profilesWithStrava?.length || 0,
          users_with_encrypted_tokens: existingEncryptedTokens?.length || 0,
          users_need_reauth: needsMigration.length,
          message: needsMigration.length > 0 
            ? `${needsMigration.length} users will need to reconnect their Strava accounts` 
            : 'All users have secure token storage'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'cleanup_disconnected_users') {
      // Clean up profiles that have strava_user_id but no encrypted tokens
      // This indicates the user was using the old system but needs to reconnect
      
      const { data: profilesWithStrava } = await supabaseAdmin
        .from('profiles')
        .select('id, strava_user_id')
        .not('strava_user_id', 'is', null)

      const { data: existingEncryptedTokens } = await supabaseAdmin
        .from('encrypted_tokens')
        .select('user_id')

      const existingTokenUsers = new Set(existingEncryptedTokens?.map((t: any) => t.user_id) || [])
      const disconnectedUsers = profilesWithStrava?.filter((p: any) => !existingTokenUsers.has(p.id)) || []

      if (disconnectedUsers.length > 0) {
        // Clear Strava data for users who need to reconnect
        for (const user of disconnectedUsers) {
          await supabaseAdmin
            .from('profiles')
            .update({
              strava_user_id: null,
              strava_expires_at: null,
            })
            .eq('id', user.id)
        }

        console.log(`Cleaned up ${disconnectedUsers.length} disconnected user profiles`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          cleaned_users: disconnectedUsers.length,
          message: disconnectedUsers.length > 0 
            ? `Cleaned up ${disconnectedUsers.length} users - they will need to reconnect Strava`
            : 'No cleanup needed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Migration utility error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Migration utility error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})