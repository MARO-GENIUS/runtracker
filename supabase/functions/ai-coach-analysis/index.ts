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
  session_type?: string;
}

interface WorkoutDetail {
  activity_id: bigint;
  session_type: string;
  workout_data: any;
}

interface EnrichedActivity extends StravaActivity {
  workoutDetails?: any;
  confirmedSessionType?: string;
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

// Fonction pour formater les détails d'entraînement selon le type de séance
function formatWorkoutDetailsForPrompt(sessionType: string, workoutData: any, activity: StravaActivity): string {
  if (!workoutData) return "[Détails non renseignés]";
  
  const normalizedType = sessionType?.toLowerCase() || '';
  
  try {
    switch (normalizedType) {
      case 'intervals':
      case 'intervalles':
        if (workoutData.repetitions && workoutData.distance) {
          const distance = workoutData.distance >= 1000 ? 
            `${(workoutData.distance / 1000).toFixed(1)}km` : 
            `${workoutData.distance}m`;
          const recoveryText = workoutData.recoveryTime ? 
            ` avec ${Math.floor(workoutData.recoveryTime / 60)}'${(workoutData.recoveryTime % 60).toString().padStart(2, '0')}" de récupération` : '';
          const recoveryType = workoutData.recoveryType === 'active' ? ' trot' : '';
          const targetPace = workoutData.targetPace ? ` à ${workoutData.targetPace}/km` : '';
          
          return `${workoutData.repetitions} x ${distance}${targetPace}${recoveryText}${recoveryType}`;
        }
        break;
        
      case 'threshold':
      case 'seuil':
        if (workoutData.duration) {
          const targetPace = workoutData.targetPace ? ` à allure seuil ${workoutData.targetPace}/km` : ' à allure seuil';
          const hrZone = workoutData.heartRateZone ? `, zone FC : ${workoutData.heartRateZone}` : '';
          
          return `${workoutData.duration} minutes${targetPace}${hrZone}`;
        }
        break;
        
      case 'tempo':
        if (workoutData.warmup && workoutData.tempoDistance && workoutData.cooldown) {
          const distance = workoutData.tempoDistance >= 1000 ? 
            `${(workoutData.tempoDistance / 1000).toFixed(1)}km` : 
            `${workoutData.tempoDistance}m`;
          const targetPace = workoutData.targetPace ? ` à ${workoutData.targetPace}/km` : '';
          
          return `Échauffement ${workoutData.warmup}min + ${distance} tempo${targetPace} + retour au calme ${workoutData.cooldown}min`;
        }
        break;
        
      case 'hills':
      case 'côtes':
        if (workoutData.repetitions && workoutData.hillDistance) {
          const distance = workoutData.hillDistance >= 1000 ? 
            `${(workoutData.hillDistance / 1000).toFixed(1)}km` : 
            `${workoutData.hillDistance}m`;
          const gradient = workoutData.gradient ? ` (pente ${workoutData.gradient}%)` : '';
          const recoveryText = workoutData.recoveryTime ? 
            ` avec ${Math.floor(workoutData.recoveryTime / 60)}'${(workoutData.recoveryTime % 60).toString().padStart(2, '0')}" de récupération` : '';
          
          return `${workoutData.repetitions} x ${distance} côtes${gradient}${recoveryText}`;
        }
        break;
        
      case 'fartlek':
        if (workoutData.totalDuration && workoutData.intervals) {
          const intervalCount = workoutData.intervals.length;
          const avgDuration = workoutData.intervals.reduce((sum: number, interval: any) => sum + (interval.duration || 0), 0) / intervalCount;
          
          return `${workoutData.totalDuration} min de fartlek (${intervalCount} accélérations d'environ ${avgDuration.toFixed(0)} min)`;
        }
        break;
        
      case 'recovery':
      case 'récupération':
        if (workoutData.duration) {
          const activity = workoutData.activity ? ` (${workoutData.activity})` : '';
          const targetPace = workoutData.targetPace ? ` à ${workoutData.targetPace}/km` : '';
          
          return `${workoutData.duration} minutes de récupération${activity}${targetPace}`;
        }
        break;
        
      case 'long':
      case 'endurance':
        if (workoutData.duration) {
          const targetPace = workoutData.targetPace ? ` à ${workoutData.targetPace}/km` : '';
          const negativeSplit = workoutData.negativeSplit ? ', progression positive' : '';
          const fuel = workoutData.fuelStrategy ? `, stratégie nutrition : ${workoutData.fuelStrategy}` : '';
          
          return `${workoutData.duration} minutes${targetPace}${negativeSplit}${fuel}`;
        }
        break;
        
      default:
        // Pour les types non reconnus, essayer d'afficher les informations disponibles
        if (workoutData.notes) {
          return workoutData.notes;
        }
        break;
    }
    
    // Fallback : afficher les notes si disponibles
    if (workoutData.notes) {
      return workoutData.notes;
    }
    
    return "[Détails saisis mais format non reconnu]";
    
  } catch (error) {
    console.error('Error formatting workout details:', error);
    return "[Erreur dans le formatage des détails]";
  }
}

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

function calculateFatigueScore(activities: StravaActivity[]): number {
  const ratingsActivities = activities.filter(a => a.effort_rating).slice(0, 5);
  if (ratingsActivities.length === 0) return 5; // Score neutre
  
  const avgRating = ratingsActivities.reduce((sum, a) => sum + (a.effort_rating || 5), 0) / ratingsActivities.length;
  return avgRating;
}

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

function calculateTargetPaces(targetTimeMinutes: number, raceDistance: string): { easy: string; tempo: string; threshold: string; intervals: string } {
  let raceDistanceKm = 10; // défaut 10K
  
  switch (raceDistance) {
    case '5k': raceDistanceKm = 5; break;
    case '10k': raceDistanceKm = 10; break;
    case 'semi': raceDistanceKm = 21.1; break;
    case 'marathon': raceDistanceKm = 42.2; break;
  }
  
  // Allure de course en min/km
  const racePaceMinPerKm = targetTimeMinutes / raceDistanceKm;
  
  // Calcul des allures d'entraînement
  const easyPace = racePaceMinPerKm + (racePaceMinPerKm * 0.2); // +20%
  const tempoPace = racePaceMinPerKm + (racePaceMinPerKm * 0.05); // +5%
  const thresholdPace = racePaceMinPerKm - (racePaceMinPerKm * 0.02); // -2%
  const intervalsPace = racePaceMinPerKm - (racePaceMinPerKm * 0.05); // -5%
  
  const formatPace = (pace: number) => {
    const minutes = Math.floor(pace);
    const seconds = Math.round((pace - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  return {
    easy: formatPace(easyPace),
    tempo: formatPace(tempoPace),
    threshold: formatPace(thresholdPace),
    intervals: formatPace(intervalsPace)
  };
}

function analyzePeriodization(weeksUntilRace: number, targetRace: string): { phase: string; intensityFocus: string; volumeFocus: string } {
  if (weeksUntilRace > 16) {
    return {
      phase: 'Base',
      intensityFocus: 'faible - développement aérobie',
      volumeFocus: 'progression graduelle du volume'
    };
  } else if (weeksUntilRace > 8) {
    return {
      phase: 'Build',
      intensityFocus: 'modérée - seuil et tempo',
      volumeFocus: 'maintien du volume avec intensité'
    };
  } else if (weeksUntilRace > 3) {
    return {
      phase: 'Peak',
      intensityFocus: 'élevée - spécifique à l\'objectif',
      volumeFocus: 'réduction progressive du volume'
    };
  } else {
    return {
      phase: 'Taper',
      intensityFocus: 'maintien de la vivacité',
      volumeFocus: 'réduction significative du volume'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting enhanced AI coach analysis with workout details integration...')

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

    // Récupérer les paramètres d'entraînement avec objectifs personnels
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

    // Récupérer les détails d'entraînement pour chaque activité
    console.log('Fetching workout details for activities...')
    const { data: workoutDetails, error: workoutDetailsError } = await supabaseClient
      .from('workout_details')
      .select('activity_id, session_type, workout_data')
      .eq('user_id', user.id)
      .in('activity_id', activities.map(a => a.id))

    if (workoutDetailsError) {
      console.error('Error fetching workout details:', workoutDetailsError)
    }

    console.log(`Found ${workoutDetails?.length || 0} workout details for ${activities.length} activities`)

    // Enrichir les données d'activités avec les détails d'entraînement
    const enrichedActivities: EnrichedActivity[] = activities.map(activity => {
      const details = workoutDetails?.find(wd => wd.activity_id === activity.id);
      return {
        ...activity,
        workoutDetails: details?.workout_data || null,
        confirmedSessionType: details?.session_type || null
      };
    });

    console.log(`Analyzing ${enrichedActivities.length} activities with integrated workout details`)

    // Calculer les jours depuis la dernière activité
    const lastActivityDate = new Date(activities[0].start_date);
    const today = new Date();
    const daysSinceLastActivity = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    // Calculer les jours jusqu'à la date planifiée
    let daysUntilPlanned = null;
    if (plannedDate) {
      daysUntilPlanned = Math.floor((plannedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Analyse des objectifs personnels
    let weeksUntilRace = null;
    let targetPaces = null;
    let periodization = null;
    let raceAnalysis = '';

    if (settings?.target_date && settings?.target_race !== 'recuperation') {
      const raceDate = new Date(settings.target_date);
      const daysUntilRace = Math.floor((raceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      weeksUntilRace = Math.floor(daysUntilRace / 7);
      
      if (settings.target_time_minutes) {
        targetPaces = calculateTargetPaces(settings.target_time_minutes, settings.target_race);
      }
      
      if (weeksUntilRace > 0) {
        periodization = analyzePeriodization(weeksUntilRace, settings.target_race);
        
        const raceInfo = {
          '5k': '5 kilomètres',
          '10k': '10 kilomètres', 
          'semi': 'Semi-marathon',
          'marathon': 'Marathon'
        }[settings.target_race] || settings.target_race;
        
        const timeInfo = settings.target_time_minutes ? 
          ` en ${Math.floor(settings.target_time_minutes / 60)}h${(settings.target_time_minutes % 60).toString().padStart(2, '0')}` : '';
        
        raceAnalysis = `OBJECTIF PERSONNEL: ${raceInfo} le ${raceDate.toLocaleDateString()}${timeInfo} (dans ${weeksUntilRace} semaines)`;
      }
    }

    // Analyse des patterns et de la fatigue
    const fatigueScore = calculateFatigueScore(activities);
    const { balance, lastTypes } = analyzeWorkoutPattern(activities);
    const activitiesWithTypes = enrichedActivities.map(a => ({
      ...a,
      detectedType: detectWorkoutType(a)
    }));

    // Création du prompt IA amélioré avec détails d'entraînement intégrés
    const enhancedPrompt = `Tu es un coach d'entraînement expert en course à pied avec une approche adaptative et personnalisée. Analyse les données suivantes et génère 3 recommandations intelligentes qui tiennent compte de la fatigue, des patterns récents, du timing ET DES OBJECTIFS PERSONNELS.

DONNÉES DU COUREUR:
- Objectif: ${settings?.target_race || '10k'}
- Fréquence hebdomadaire: ${settings?.weekly_frequency || 3} séances

${raceAnalysis ? `
🎯 ${raceAnalysis}
${periodization ? `📅 PHASE D'ENTRAÎNEMENT: ${periodization.phase} (${periodization.intensityFocus}, ${periodization.volumeFocus})` : ''}
${targetPaces ? `🏃 ALLURES CIBLES basées sur l'objectif temps:
- Endurance facile: ${targetPaces.easy} min/km
- Tempo: ${targetPaces.tempo} min/km  
- Seuil: ${targetPaces.threshold} min/km
- Fractionné: ${targetPaces.intervals} min/km` : ''}
` : ''}

CONTEXTE TEMPOREL CRUCIAL:
- Jours écoulés depuis la dernière séance: ${daysSinceLastActivity} jours
- Date de la dernière activité: ${lastActivityDate.toLocaleDateString()}
${plannedDate ? `- Date prévue de la prochaine séance: ${plannedDate.toLocaleDateString()}` : ''}
${daysUntilPlanned !== null ? `- Jours jusqu'à la séance planifiée: ${daysUntilPlanned} jours` : ''}
${weeksUntilRace ? `- Semaines jusqu'à l'objectif personnel: ${weeksUntilRace} semaines` : ''}

ANALYSE DE LA FATIGUE ET DES PATTERNS:
- Score de fatigue récent: ${fatigueScore.toFixed(1)}/10 (${fatigueScore < 4 ? 'Faible fatigue' : fatigueScore > 7 ? 'Fatigue élevée' : 'Fatigue modérée'})
- Équilibre des séances: ${balance}
- Types des 5 dernières séances: ${lastTypes.join(', ')}

HISTORIQUE DÉTAILLÉ AVEC DÉTAILS D'ENTRAÎNEMENT (15 dernières activités):
${activitiesWithTypes.slice(0, 15).map(act => {
  const sessionType = act.confirmedSessionType || act.session_type || act.detectedType;
  const effortText = act.effort_rating ? ` | Ressenti: ${act.effort_rating}/10` : '';
  const notesText = act.effort_notes ? ` | Notes: "${act.effort_notes}"` : '';
  const workoutDetails = formatWorkoutDetailsForPrompt(sessionType, act.workoutDetails, act);
  const detailsText = workoutDetails ? ` | Détails: ${workoutDetails}` : '';
  
  return `- ${act.name}: ${(act.distance/1000).toFixed(1)}km en ${Math.floor(act.moving_time/60)}min | Type: ${sessionType} | FC: ${act.average_heartrate || 'N/A'}${effortText}${notesText}${detailsText} (${act.start_date.split('T')[0]})`;
}).join('\n')}

CONSIGNES PRIORITAIRES POUR L'IA ADAPTATIVE AVEC OBJECTIFS PERSONNELS ET DÉTAILS D'ENTRAÎNEMENT:

1. 🎯 ADAPTATION À L'OBJECTIF PERSONNEL (PRIORITÉ ABSOLUE):
${weeksUntilRace ? `
   - PHASE ${periodization?.phase.toUpperCase()}: ${periodization?.intensityFocus}
   - Adapter l'intensité selon les ${weeksUntilRace} semaines restantes
   - ${weeksUntilRace > 12 ? 'Focus développement de base' : weeksUntilRace > 8 ? 'Intensification progressive' : weeksUntilRace > 3 ? 'Spécificité maximale' : 'Affûtage et récupération'}
   ${targetPaces ? `- Utiliser les allures cibles calculées: Facile ${targetPaces.easy}, Tempo ${targetPaces.tempo}, Seuil ${targetPaces.threshold}, VMA ${targetPaces.intervals}` : ''}
` : '- Pas d\'objectif spécifique: recommandations générales adaptatives'}

2. 📊 ANALYSE DES DÉTAILS D'ENTRAÎNEMENT:
   - Utiliser les détails spécifiques des séances pour analyser la progression et les patterns
   - Tenir compte des allures réellement pratiquées vs. les allures cibles
   - Analyser la cohérence entre les types de séances et leur exécution
   - Identifier les points forts et les axes d'amélioration basés sur les détails fournis

3. PRIORITÉ AU TIMING IMMÉDIAT: 
   - Si >5 jours sans activité → recommandations de reprise progressive obligatoires
   - Si >10 jours → déconditionnement probable, recommandations très progressives
   - Si <2 jours → tenir compte de la récupération nécessaire

4. PÉRIODISATION INTELLIGENTE:
   ${weeksUntilRace ? `
   - ${weeksUntilRace > 12 ? 'Phase de base: Volume progressif, intensité faible à modérée' : ''}
   - ${weeksUntilRace <= 12 && weeksUntilRace > 8 ? 'Phase de développement: Introduction du travail spécifique' : ''}
   - ${weeksUntilRace <= 8 && weeksUntilRace > 3 ? 'Phase de pic: Travail intensif et spécifique' : ''}
   - ${weeksUntilRace <= 3 ? 'Phase d\'affûtage: Réduction volume, maintien qualité' : ''}
   ` : '- Planification générale équilibrée'}

5. Si fatigue élevée (>7) → priorité absolue à la récupération même proche de l'objectif
6. Expliquer clairement POURQUOI chaque recommandation maintenant, en tenant compte de l'objectif personnel, du timing ET des détails d'entraînement analysés

ANALYSE DEMANDÉE:
Génère exactement 3 recommandations personnalisées qui:
- Tiennent compte des ${daysSinceLastActivity} jours écoulés depuis la dernière séance
- S'adaptent à l'objectif personnel ${raceAnalysis ? `(${raceAnalysis})` : '(aucun)'}
- Respectent la phase d'entraînement ${periodization ? `(${periodization.phase})` : '(générale)'}
- Utilisent les allures cibles ${targetPaces ? 'calculées' : 'génériques'}
- Intègrent l'analyse des détails d'entraînement fournis
- Incluent une justification détaillée basée sur l'analyse complète avec détails

Réponds UNIQUEMENT avec un JSON valide:
{
  "recommendations": [
    {
      "type": "recovery/endurance/tempo/intervals/long",
      "title": "Titre adaptatif tenant compte de l'objectif personnel et des détails analysés",
      "description": "Description intégrant objectif, timing et analyse des détails d'entraînement",
      "duration": 45,
      "intensity": "Adaptée à la fatigue, timing ET phase d'entraînement",
      "targetPace": "${targetPaces ? 'Allure spécifique calculée' : 'Allure adaptée'}",
      "targetHR": {"min": 140, "max": 160},
      "warmup": "Échauffement personnalisé selon la phase",
      "mainSet": "Corps de séance contextualisé à l'objectif",
      "cooldown": "Retour au calme adapté",
      "scheduledFor": "today/tomorrow/this-week",
      "priority": "high/medium/low",
      "aiJustification": "Explication détaillée du POURQUOI cette recommandation maintenant, en tenant compte: 1) des ${daysSinceLastActivity} jours écoulés, 2) de la fatigue (${fatigueScore.toFixed(1)}/10), 3) du pattern récent (${balance}), 4) de l'objectif personnel${weeksUntilRace ? ` dans ${weeksUntilRace} semaines` : ''}, 5) de la phase d'entraînement${periodization ? ` (${periodization.phase})` : ''}, 6) des détails d'entraînement analysés",
      "nutritionTips": "Conseils nutritionnels adaptés à la phase d'entraînement",
      "recoveryAdvice": "Conseils de récupération selon l'objectif et le timing"
    }
  ]
}`

    console.log('Calling enhanced OpenAI analysis with workout details integration...')
    
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'Tu es un coach d\'entraînement expert et adaptatif en course à pied spécialisé dans la périodisation, les objectifs personnels et l\'analyse détaillée des séances d\'entraînement. Tu analyses les patterns, la fatigue, les ressentis, les objectifs de course ET les détails spécifiques de chaque entraînement pour générer des recommandations intelligentes et personnalisées avec des allures précises. Réponds toujours en JSON valide avec des justifications détaillées.'
          },
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    })

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text()
      console.error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`)
      throw new Error(`OpenAI API error: ${openAIResponse.status}`)
    }

    const openAIData = await openAIResponse.json()
    const aiContent = openAIData.choices[0].message.content

    console.log('Enhanced AI response with workout details integration received')

    let recommendations: AIRecommendation[]
    try {
      // Nettoyer la réponse AI des balises markdown si présentes
      const cleanedContent = aiContent.replace(/```json\n?|\n?```/g, '').trim();
      const parsedResponse = JSON.parse(cleanedContent)
      recommendations = parsedResponse.recommendations || []
    } catch (parseError) {
      console.error('Failed to parse enhanced AI response:', parseError)
      
      // Recommandations de fallback adaptées aux objectifs
      const fallbackIntensity = weeksUntilRace && weeksUntilRace <= 8 ? 'spécifique' : 'modérée';
      const fallbackDuration = fatigueScore > 7 ? 30 : weeksUntilRace && weeksUntilRace <= 3 ? 40 : 45;
      
      recommendations = [
        {
          type: fatigueScore > 7 ? 'recovery' : weeksUntilRace && weeksUntilRace <= 8 ? 'tempo' : 'endurance',
          title: `Séance ${fallbackIntensity} adaptée${raceAnalysis ? ' à votre objectif' : ''}`,
          description: `Séance adaptée à votre fatigue (${fatigueScore.toFixed(1)}/10)${weeksUntilRace ? ` et à votre objectif dans ${weeksUntilRace} semaines` : ''}`,
          duration: fallbackDuration,
          intensity: fallbackIntensity,
          targetPace: targetPaces ? (fatigueScore > 7 ? targetPaces.easy : targetPaces.tempo) : '5:30-6:00 min/km',
          targetHR: fatigueScore > 7 ? { min: 120, max: 140 } : { min: 140, max: 170 },
          warmup: '10min échauffement progressif',
          mainSet: `${fallbackDuration - 15}min selon objectif personnel`,
          cooldown: '5min retour au calme',
          scheduledFor: 'today',
          priority: 'high',
          aiJustification: `Recommandation générée automatiquement basée sur votre fatigue (${fatigueScore.toFixed(1)}/10), l'équilibre récent (${balance})${raceAnalysis ? ` et votre objectif personnel (${raceAnalysis})` : ''} avec prise en compte des détails d'entraînement disponibles`,
          nutritionTips: 'Hydratation et récupération prioritaires',
          recoveryAdvice: 'Étirements et sommeil de qualité'
        }
      ]
    }

    console.log(`Generated ${recommendations.length} personalized recommendations with workout details integration`)

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
          daysUntilPlanned,
          weeksUntilRace,
          raceGoal: raceAnalysis || null,
          targetPaces,
          periodization,
          workoutDetailsCount: workoutDetails?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in enhanced AI coach analysis with workout details:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
    
    return new Response(
      JSON.stringify({ 
        error: `Erreur lors de l'analyse IA avec détails d'entraînement: ${errorMessage}`,
        details: error instanceof Error ? error.stack : 'Aucun détail disponible'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
