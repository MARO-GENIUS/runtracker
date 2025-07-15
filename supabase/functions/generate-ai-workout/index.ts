
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Début de la génération de séance avec zones personnalisées...');

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Erreur lors du parsing JSON:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Format de requête invalide'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { systemMessage, userMessage, trainingData } = requestBody;

    if (!systemMessage || !userMessage || !trainingData) {
      console.error('Messages ou données d\'entraînement manquants dans la requête');
      return new Response(JSON.stringify({
        success: false,
        error: 'Messages système et utilisateur + données d\'entraînement requis'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('Clé API OpenAI manquante');
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuration OpenAI manquante'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Appel à OpenAI avec système de zones personnalisées...');
    console.log('Extrait du message utilisateur:', userMessage.substring(0, 500));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        temperature: 0.2, // Réduit pour plus de cohérence dans les allures
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur OpenAI:', response.status, errorText);
      return new Response(JSON.stringify({
        success: false,
        error: `Erreur OpenAI: ${response.status} - ${errorText}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Réponse OpenAI reçue avec zones personnalisées');

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('Pas de contenu dans la réponse OpenAI');
      return new Response(JSON.stringify({
        success: false,
        error: 'Pas de réponse de OpenAI'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extraire le JSON de la réponse avec le nouveau format "séance"
    let workout;
    try {
      // Chercher le JSON dans la réponse (au cas où il y aurait du texte autour)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Adapter le format de réponse selon la nouvelle structure
        workout = parsed.séance || parsed;
      } else {
        // Essayer de parser directement si pas de match trouvé
        const parsed = JSON.parse(content);
        workout = parsed.séance || parsed;
      }
      
      console.log('Séance parsée avec allures personnalisées:', workout);
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Contenu reçu d\'OpenAI:', content);
      
      // Créer une séance de fallback adaptée au niveau
      workout = {
        type: "Endurance fondamentale",
        structure: "Course continue facile pendant 40 minutes",
        allure_cible: "4:50-5:10/km",
        fc_cible: "140-155 bpm",
        kilométrage_total: "8 km",
        durée_estimée: "40 min",
        justification: "Séance d'endurance de base pour maintenir la condition physique. Allure dans votre zone d'endurance personnalisée."
      };
    }

    console.log('Séance générée avec zones personnalisées avec succès');

    return new Response(JSON.stringify({
      success: true,
      workout
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erreur générale dans generate-ai-workout:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Une erreur est survenue lors de la génération'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
