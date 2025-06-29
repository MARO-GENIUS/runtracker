
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StravaActivity {
  id: bigint;
  name: string;
  distance: number;
  moving_time: number;
  average_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  start_date: string;
  total_elevation_gain?: number;
  type: string;
}

interface AIRecommendation {
  type: string;
  title: string;
  description: string;
  duration: number;
  intensity: string;
  targetPace?: string;
  targetHR?: { min: number; max: number };
  warmup: string;
  mainSet: string;
  cooldown: string;
  scheduledFor: string;
  priority: string;
  aiJustification: string;
  nutritionTips?: string;
  recoveryAdvice?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting AI coach analysis...')

    // Check if OpenAI API key is available
    const openAIKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIKey) {
      console.error('OpenAI API key not found')
      return new Response(
        JSON.stringify({ error: 'Configuration manquante: clé API OpenAI non trouvée' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
      console.error('User not authenticated')
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Analyzing data for user: ${user.id}`)

    // Get user's training settings
    const { data: settings, error: settingsError } = await supabaseClient
      .from('training_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError) {
      console.log('No training settings found, using defaults')
    }

    // Get recent activities (last 3 months for analysis)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: activities, error: activitiesError } = await supabaseClient
      .from('strava_activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('start_date', threeMonthsAgo.toISOString())
      .order('start_date', { ascending: false })
      .limit(50)

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError)
      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des activités' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!activities || activities.length === 0) {
      console.log('No activities found')
      return new Response(
        JSON.stringify({ error: 'Pas assez de données d\'activités pour l\'analyse' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${activities.length} activities for analysis`)

    // Create AI prompt for analysis
    const aiPrompt = `Tu es un coach d'entraînement professionnel spécialisé en course à pied. Analyse les données suivantes d'un coureur et génère des recommandations d'entraînement personnalisées et détaillées.

DONNÉES DU COUREUR:
- Objectif: ${settings?.target_race || '10k'}
- Date objectif: ${settings?.target_date || 'Non définie'}
- Fréquence hebdomadaire: ${settings?.weekly_frequency || 3} séances
- Jours préférés: ${settings?.preferred_days?.join(', ') || 'Flexible'}
- Créneaux disponibles: ${settings?.available_time_slots?.join(', ') || 'Flexible'}
- Intensité max: ${settings?.max_intensity || 'medium'}

HISTORIQUE D'ACTIVITÉS (${activities.length} activités sur 3 mois):
${activities.slice(0, 15).map(act => 
  `- ${act.name}: ${(act.distance/1000).toFixed(1)}km en ${Math.floor(act.moving_time/60)}min (${act.start_date.split('T')[0]}) FC moy: ${act.average_heartrate || 'N/A'}`
).join('\n')}

STATISTIQUES RÉCENTES:
- Distance moyenne: ${(activities.reduce((sum, act) => sum + act.distance, 0) / activities.length / 1000).toFixed(1)}km
- Allure moyenne: ${(activities.reduce((sum, act) => sum + (act.moving_time / (act.distance/1000)), 0) / activities.length / 60).toFixed(1)} min/km
- FC moyenne: ${activities.filter(act => act.average_heartrate).length > 0 ? (activities.filter(act => act.average_heartrate).reduce((sum, act) => sum + (act.average_heartrate || 0), 0) / activities.filter(act => act.average_heartrate).length).toFixed(0) : 'N/A'}

ANALYSE DEMANDÉE:
1. Génère exactement 3 recommandations d'entraînement personnalisées
2. Chaque recommandation doit inclure tous les champs requis
3. Base tes conseils sur l'analyse de la progression, de la charge d'entraînement, et des objectifs
4. Sois précis sur les allures, durées, et intensités
5. Inclus des justifications détaillées basées sur les données

Réponds UNIQUEMENT avec un JSON valide contenant un tableau "recommendations" avec 3 objets ayant cette structure exacte:
{
  "recommendations": [
    {
      "type": "endurance",
      "title": "Titre de la séance",
      "description": "Description détaillée",
      "duration": 45,
      "intensity": "Facile",
      "targetPace": "5:30-6:00 min/km",
      "targetHR": {"min": 140, "max": 160},
      "warmup": "10min échauffement progressif",
      "mainSet": "Corps de séance détaillé",
      "cooldown": "5min retour au calme",
      "scheduledFor": "today",
      "priority": "high",
      "aiJustification": "Explication basée sur l'analyse des données",
      "nutritionTips": "Conseils nutritionnels",
      "recoveryAdvice": "Conseils de récupération"
    }
  ]
}`

    console.log('Calling OpenAI API...')
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un coach d\'entraînement expert en course à pied. Tu analyses les données des coureurs et génères des recommandations précises et personnalisées. Réponds toujours en JSON valide.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIData = await openAIResponse.json()
    const aiContent = openAIData.choices[0].message.content

    console.log('AI Response received:', aiContent.substring(0, 200) + '...')

    let recommendations: AIRecommendation[]
    try {
      const parsedResponse = JSON.parse(aiContent)
      recommendations = parsedResponse.recommendations || []
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('AI content:', aiContent)
      
      // Fallback recommendations if AI parsing fails
      recommendations = [
        {
          type: 'endurance',
          title: 'Sortie endurance fondamentale',
          description: 'Développement de la capacité aérobie avec allure conversationnelle',
          duration: 45,
          intensity: 'Modérée',
          targetPace: '5:30-6:00 min/km',
          targetHR: { min: 140, max: 160 },
          warmup: '10min échauffement progressif',
          mainSet: '30min à allure régulière',
          cooldown: '5min retour au calme',
          scheduledFor: 'today',
          priority: 'high',
          aiJustification: 'Recommandation générée automatiquement basée sur vos données d\'entraînement récentes',
          nutritionTips: 'Hydratation régulière pendant la séance',
          recoveryAdvice: 'Étirements légers après la séance'
        }
      ]
    }

    console.log(`Generated ${recommendations.length} recommendations`)

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        analysisData: {
          totalActivities: activities.length,
          averageDistance: (activities.reduce((sum, act) => sum + act.distance, 0) / activities.length / 1000).toFixed(1),
          lastActivity: activities[0]?.start_date.split('T')[0]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in AI coach analysis:', error)
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur lors de l'analyse IA: ${errorMessage}`,
        details: error instanceof Error ? error.stack : 'Aucun détail disponible'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
