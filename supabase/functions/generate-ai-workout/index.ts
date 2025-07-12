
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
    console.log('Début de la génération de séance...');

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

    const { prompt } = requestBody;

    if (!prompt) {
      console.error('Prompt manquant dans la requête');
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt requis'
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

    console.log('Appel à OpenAI avec le prompt...');

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
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
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
    console.log('Réponse OpenAI reçue:', data);

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

    // Extraire le JSON de la réponse
    let workout;
    try {
      // Chercher le JSON dans la réponse (au cas où il y aurait du texte autour)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workout = JSON.parse(jsonMatch[0]);
      } else {
        // Essayer de parser directement si pas de match trouvé
        workout = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Contenu reçu d\'OpenAI:', content);
      
      // Créer une séance de fallback si le parsing échoue
      workout = {
        nom_seance: "Séance d'endurance",
        objectif: "Maintenir la forme physique",
        type: "easy run",
        blocs: [{
          description: "Course continue facile",
          distance_m: 5000,
          duree_minutes: 30,
          allure_min_per_km: "5:30",
          frequence_cardiaque_cible: 150,
          puissance_cible: null,
          rpe: 5,
          recuperation: "Pas de récupération nécessaire"
        }],
        variante_facile: "Réduire à 20 minutes",
        variante_difficile: "Augmenter à 40 minutes",
        explication: "Séance d'endurance de base pour maintenir la condition physique"
      };
    }

    console.log('Séance générée avec succès');

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
