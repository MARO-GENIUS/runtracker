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
  effort_rating?: number;
  effort_notes?: string;
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

// Détection intelligente du type de séance
function detectWorkoutType(activity: StravaActivity): string {
  const name = activity.name.toLowerCase();
  const duration = activity.moving_time / 60; // en minutes
  const pace = activity.moving_time / (activity.distance / 1000); // min/km
  const avgHR = activity.average_heartrate || 0;
  
  // Détection par mots-clés dans le nom
  if (name.includes('interval') || name.includes('fractionné') || name.includes('répétition') || name.includes('400m') || name.includes('1000m')) {
    return 'intervals';
  }
  if (name.includes('tempo') || name.includes('seuil') || name.includes('threshold')) {
    return 'tempo';
  }
  if (name.includes('récupération') || name.includes('recovery') || name.includes('footing')) {
    return 'recovery';
  }
  if (name.includes('long') || name.includes('endurance') || duration > 75) {
    return 'long';
  }
  
  // Détection par caractéristiques physiques
  if (duration < 30 && avgHR > 170) {
    return 'intervals';
  }
  if (duration > 75) {
    return 'long';
  }
  if (avgHR > 0 && avgHR < 150) {
    return 'recovery';
  }
  if (pace < 5.5) {
    return 'tempo';
  }
  
  return 'endurance';
}

// Calcul du score de fatigue basé sur les ressentis
function calculateFatigueScore(activities: StravaActivity[]): number {
  const ratingsActivities = activities.filter(a => a.effort_rating).slice(0, 5);
  if (ratingsActivities.length === 0) return 5; // Score neutre
  
  const avgRating = ratingsActivities.reduce((sum, a) => sum + (a.effort_rating || 5), 0) / ratingsActivities.length;
  return avgRating;
}

// Analyse des patterns de séances
function analyzeWorkoutPattern(activities: StravaActivity[]): { balance: string; lastTypes: string[] } {
  const recentTypes = activities.slice(0, 5).map(detectWorkoutType);
  const typeCounts = recentTypes.reduce((counts, type) => {
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);
  
  let balance = 'équilibré';
  if (typeCounts.intervals && typeCounts.intervals >= 3) balance = 'trop d\'intensité';
  if (typeCounts.recovery && typeCounts.recovery >= 3) balance = 'trop de récupération';
  if (typeCounts.long && typeCounts.long >= 2) balance = 'volume élevé';
  
  return { balance, lastTypes: recentTypes };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting enhanced AI coach analysis...')

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

    // Récupérer la date planifiée depuis le body de la requête
    let plannedDate = null;
    try {
      const body = await req.json();
      if (body.plannedDate) {
        plannedDate = new Date(body.plannedDate);
      }
    } catch (e) {
      // Body vide ou invalide, continuer sans date planifiée
    }

    console.log(`Enhanced analysis for user: ${user.id}, planned date: ${plannedDate}`)

    // Récupérer les paramètres d'entraînement
    const { data: settings } = await supabaseClient
      .from('training_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Récupérer les 20 dernières activités avec ressentis
    const { data: activities, error: activitiesError } = await supabaseClient
      .from('strava_activities')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .limit(20)

    if (activitiesError || !activities || activities.length === 0) {
      console.error('Error or no activities found:', activitiesError)
      return new Response(
        JSON.stringify({ error: 'Pas assez de données d\'activités pour l\'analyse' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Analyzing ${activities.length} recent activities with effort ratings`)

    // Calculer les jours depuis la dernière activité
    const lastActivityDate = new Date(activities[0].start_date);
    const today = new Date();
    const daysSinceLastActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculer les jours jusqu'à la date planifiée
    let daysUntilPlanned = null;
    if (plannedDate) {
      daysUntilPlanned = Math.floor((plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Analyse des patterns et de la fatigue
    const fatigueScore = calculateFatigueScore(activities);
    const { balance, lastTypes } = analyzeWorkoutPattern(activities);
    const activitiesWithTypes = activities.map(a => ({
      ...a,
      detectedType: detectWorkoutType(a)
    }));

    // Création du prompt IA amélioré avec contexte temporel
    const enhancedPrompt = `Tu es un coach d'entraînement expert en course à pied avec une approche adaptative et personnalisée. Analyse les données suivantes et génère 3 recommandations intelligentes qui tiennent compte de la fatigue, des patterns récents, du timing et de la planification.

DONNÉES DU COUREUR:
- Objectif: ${settings?.target_race || '10k'}
- Date objectif: ${settings?.target_date || 'Non définie'}
- Fréquence hebdomadaire: ${settings?.weekly_frequency || 3} séances

CONTEXTE TEMPOREL CRUCIAL:
- Jours écoulés depuis la dernière séance: ${daysSinceLastActivity} jours
- Date de la dernière activité: ${lastActivityDate.toLocaleDateString()}
${plannedDate ? `- Date prévue de la prochaine séance: ${plannedDate.toLocaleDateString()}` : ''}
${daysUntilPlanned !== null ? `- Jours jusqu'à la séance planifiée: ${daysUntilPlanned} jours` : ''}

ANALYSE DE LA FATIGUE ET DES PATTERNS:
- Score de fatigue récent: ${fatigueScore.toFixed(1)}/10 (${fatigueScore < 4 ? 'Faible fatigue' : fatigueScore > 7 ? 'Fatigue élevée' : 'Fatigue modérée'})
- Équilibre des séances: ${balance}
- Types des 5 dernières séances: ${lastTypes.join(', ')}

HISTORIQUE DÉTAILLÉ (15 dernières activités avec ressentis):
${activitiesWithTypes.slice(0, 15).map(act => {
  const effortText = act.effort_rating ? ` | Ressenti: ${act.effort_rating}/10` : '';
  const notesText = act.effort_notes ? ` | Notes: "${act.effort_notes}"` : '';
  return `- ${act.name}: ${(act.distance/1000).toFixed(1)}km en ${Math.floor(act.moving_time/60)}min | Type détecté: ${act.detectedType} | FC: ${act.average_heartrate || 'N/A'}${effortText}${notesText} (${act.start_date.split('T')[0]})`;
}).join('\n')}

CONSIGNES POUR L'IA ADAPTATIVE AVEC CONTEXTE TEMPOREL:
1. PRIORITÉ AU TIMING: 
   - Si >5 jours sans activité → recommandations de reprise progressive obligatoires
   - Si >10 jours → déconditionnement probable, recommandations très progressives
   - Si <2 jours → tenir compte de la récupération nécessaire
   
2. ADAPTATION À LA DATE PLANIFIÉE:
   ${daysUntilPlanned !== null ? `
   - Séance prévue dans ${daysUntilPlanned} jour(s): adapter l'intensité et la progressivité
   - Si c'est aujourd'hui (0 jour) → recommandation immédiate et pratique
   - Si c'est demain (1 jour) → préparation et échauffement renforcé
   - Si c'est dans plusieurs jours → recommandation progressive avec build-up
   ` : '- Pas de date planifiée: recommandations générales avec flexibilité temporelle'}

3. Si fatigue élevée (>7) + longue pause → priorité absolue à la récupération active
4. Si pattern déséquilibré + pause longue → correction progressive du déséquilibre
5. Tenir compte des notes de ressenti ET du temps écoulé pour ajuster l'intensité
6. Expliquer clairement POURQUOI chaque recommandation maintenant, en tenant compte du timing

ANALYSE DEMANDÉE:
Génère exactement 3 recommandations personnalisées qui:
- Tiennent compte des ${daysSinceLastActivity} jours écoulés depuis la dernière séance
- S'adaptent à la date planifiée ${plannedDate ? `(${plannedDate.toLocaleDateString()})` : '(non spécifiée)'}
- Corrigent les déséquilibres détectés progressivement
- Incluent une justification détaillée basée sur l'analyse temporelle et adaptative

Réponds UNIQUEMENT avec un JSON valide:
{
  "recommendations": [
    {
      "type": "recovery/endurance/tempo/intervals/long",
      "title": "Titre adaptatif tenant compte du timing",
      "description": "Description tenant compte du contexte temporel",
      "duration": 45,
      "intensity": "Adaptée à la fatigue ET au timing",
      "targetPace": "Ajustée selon l'analyse temporelle",
      "targetHR": {"min": 140, "max": 160},
      "warmup": "Échauffement personnalisé selon la pause",
      "mainSet": "Corps de séance contextualisé temporellement",
      "cooldown": "Retour au calme adapté",
      "scheduledFor": "today/tomorrow/this-week",
      "priority": "high/medium/low",
      "aiJustification": "Explication détaillée du POURQUOI cette recommandation maintenant, en tenant compte des ${daysSinceLastActivity} jours écoulés, de la fatigue (${fatigueScore.toFixed(1)}/10), du pattern récent (${balance})${daysUntilPlanned !== null ? `, et de la planification dans ${daysUntilPlanned} jour(s)` : ''}",
      "nutritionTips": "Conseils nutritionnels adaptés au timing",
      "recoveryAdvice": "Conseils de récupération personnalisés selon la pause"
    }
  ]
}`

    console.log('Calling enhanced OpenAI analysis with temporal context...')
    
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
            content: 'Tu es un coach d\'entraînement expert et adaptatif en course à pied. Tu analyses les patterns, la fatigue et les ressentis pour générer des recommandations intelligentes et personnalisées. Réponds toujours en JSON valide avec des justifications détaillées.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIData = await openAIResponse.json()
    const aiContent = openAIData.choices[0].message.content

    console.log('Enhanced AI response received')

    let recommendations: AIRecommendation[]
    try {
      const parsedResponse = JSON.parse(aiContent)
      recommendations = parsedResponse.recommendations || []
    } catch (parseError) {
      console.error('Failed to parse enhanced AI response:', parseError)
      
      // Recommandations de fallback adaptatives
      recommendations = [
        {
          type: fatigueScore > 7 ? 'recovery' : 'endurance',
          title: fatigueScore > 7 ? 'Récupération adaptative nécessaire' : 'Endurance équilibrante',
          description: `Séance adaptée à votre fatigue actuelle (${fatigueScore.toFixed(1)}/10) et au pattern récent`,
          duration: fatigueScore > 7 ? 30 : 45,
          intensity: fatigueScore > 7 ? 'Très facile' : 'Modérée',
          targetPace: fatigueScore > 7 ? '6:30-7:00 min/km' : '5:30-6:00 min/km',
          targetHR: fatigueScore > 7 ? { min: 120, max: 140 } : { min: 140, max: 160 },
          warmup: '10min échauffement progressif adapté',
          mainSet: fatigueScore > 7 ? '15min très facile' : '30min allure régulière',
          cooldown: '5min retour au calme',
          scheduledFor: 'today',
          priority: 'high',
          aiJustification: `Recommandation générée automatiquement basée sur votre fatigue (${fatigueScore.toFixed(1)}/10) et l'équilibre récent (${balance})`,
          nutritionTips: 'Hydratation et récupération prioritaires',
          recoveryAdvice: 'Étirements et sommeil de qualité'
        }
      ]
    }

    console.log(`Generated ${recommendations.length} adaptive recommendations`)

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        analysisData: {
          totalActivities: activities.length,
          averageDistance: (activities.reduce((sum, act) => sum + act.distance, 0) / activities.length / 1000).toFixed(1),
          lastActivity: activities[0]?.start_date.split('T')[0],
          fatigueScore: fatigueScore.toFixed(1),
          workoutBalance: balance,
          recentTypes: lastTypes.slice(0, 3),
          daysSinceLastActivity,
          daysUntilPlanned
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in enhanced AI coach analysis:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur lors de l'analyse IA adaptative: ${errorMessage}`,
        details: error instanceof Error ? error.stack : 'Aucun détail disponible'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
