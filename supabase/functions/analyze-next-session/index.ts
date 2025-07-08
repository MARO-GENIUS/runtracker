
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { activityId } = await req.json();

    if (!activityId) {
      throw new Error('Activity ID is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Analyzing next session for user ${user.id}, activity ${activityId}`);

    // Get current activity details with session_type
    const { data: currentActivity, error: activityError } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', activityId)
      .single();

    if (activityError || !currentActivity) {
      throw new Error('Activity not found');
    }

    // Get last 20 activities with their session types
    const { data: recentActivitiesRaw, error: recentError } = await supabase
      .from('strava_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(20);

    if (recentError) {
      console.error('Error fetching recent activities:', recentError);
      throw new Error('Failed to fetch recent activities');
    }

    console.log(`Found ${recentActivitiesRaw?.length || 0} recent activities for context`);

    // Function to get session type label
    const getSessionTypeLabel = (sessionType: string | null) => {
      if (!sessionType) return 'Course libre';
      
      const typeLabels = {
        'footing': 'Footing',
        'sortie longue': 'Sortie longue',
        'intervalle': 'Intervalle',
        'seuil': 'Seuil',
        'récupération': 'Récupération',
        'compétition': 'Compétition',
        'côtes': 'Côtes',
        'fartlek': 'Fartlek'
      };
      
      return typeLabels[sessionType as keyof typeof typeLabels] || sessionType;
    };

    // Format activity data with session types
    const formatActivity = (activity: any) => {
      const distance = (activity.distance / 1000).toFixed(1);
      const duration = Math.round(activity.moving_time / 60);
      const pace = activity.distance > 0 ? 
        Math.floor((activity.moving_time / 60) / (activity.distance / 1000)) + ':' + 
        String(Math.round(((activity.moving_time / 60) / (activity.distance / 1000) % 1) * 60)).padStart(2, '0') 
        : 'N/A';
      
      const sessionType = getSessionTypeLabel(activity.session_type);
      
      return {
        date: new Date(activity.start_date_local).toLocaleDateString('fr-FR'),
        type: sessionType,
        duration: `${duration} min`,
        distance: `${distance} km`,
        pace: `${pace} min/km`,
        avgHeartRate: activity.average_heartrate || 'Non disponible',
        maxHeartRate: activity.max_heartrate || 'Non disponible',
        elevation: `${Math.round(activity.total_elevation_gain || 0)} m`,
        location: [activity.location_city, activity.location_state, activity.location_country]
          .filter(Boolean).join(', ') || 'Non spécifié',
        effortNotes: activity.effort_notes || ''
      };
    };

    const currentActivityFormatted = formatActivity(currentActivity);
    
    // Sort activities chronologically (oldest to newest) for better progression analysis
    const sortedActivities = recentActivitiesRaw?.sort((a, b) => 
      new Date(a.start_date_local).getTime() - new Date(b.start_date_local).getTime()
    ) || [];
    
    const recentActivitiesFormatted = sortedActivities.map(formatActivity);

    // Create enhanced context about recent training with session types
    const contextText = recentActivitiesFormatted.length > 0 ? 
      `Contexte des 20 dernières activités (ordre chronologique - de la plus ancienne à la plus récente) :\n${recentActivitiesFormatted.map((act, i) => 
        `${i + 1}. ${act.date} - ${act.type} - ${act.distance} en ${act.duration} (${act.pace})${act.effortNotes ? ` - Notes: ${act.effortNotes}` : ''}`
      ).join('\n')}\n\n` : '';

    // Enhanced prompt with session types
    const prompt = `Tu es un coach expert en course à pied, spécialisé en préparation sur 5 km, 10 km, semi-marathon et marathon. 

${contextText}Voici mes données issues de ma dernière séance Strava :
Date de la séance : ${currentActivityFormatted.date}
Type de séance : ${currentActivityFormatted.type}
Durée : ${currentActivityFormatted.duration}
Distance : ${currentActivityFormatted.distance}
Allure moyenne : ${currentActivityFormatted.pace}
Fréquence cardiaque moyenne : ${currentActivityFormatted.avgHeartRate}
Fréquence cardiaque max : ${currentActivityFormatted.maxHeartRate}
Dénivelé positif : ${currentActivityFormatted.elevation}
Notes d'effort : ${currentActivityFormatted.effortNotes || 'Non renseignées'}
Objectif actuel : Semi-marathon

IMPORTANT : Analyse bien la progression chronologique de mes séances ci-dessus. Tu peux voir les vrais types d'entraînement que j'ai fait selon ma classification personnelle.

En analysant cette séance dans le contexte de ma progression d'entraînement récente et en tenant compte de l'alternance intensité/récupération, donne-moi UNIQUEMENT une suggestion précise de la prochaine séance sous ce format exact :

**Type :** [type d'entraînement précis]
**Durée :** [durée précise]
**Allure :** [allure ou zones de travail]
**Récupération :** [temps de récupération recommandé]

Sois directif, pertinent et adapte ta réponse à ma progression récente. Si j'ai fait plusieurs séances faciles d'affilée, propose une séance de qualité. Si j'ai fait de l'intensité, propose de la récupération. Réponds uniquement avec ces 4 lignes, rien d'autre.`;

    console.log('Calling OpenAI API with enhanced context...');

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const suggestion = openAIData.choices[0]?.message?.content;

    if (!suggestion) {
      throw new Error('No suggestion received from OpenAI');
    }

    console.log('Analysis completed successfully with activity-specific session types');

    return new Response(JSON.stringify({
      success: true,
      suggestion: suggestion.trim(),
      activityId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-next-session function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Une erreur est survenue lors de l\'analyse'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
