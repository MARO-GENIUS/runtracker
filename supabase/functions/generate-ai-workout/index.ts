
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
    const { prompt } = await req.json();

    if (!prompt) {
      throw new Error('Prompt requis');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    console.log('Génération de séance avec OpenAI...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erreur OpenAI:', errorText);
      throw new Error(`Erreur OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('Pas de réponse de OpenAI');
    }

    // Extraire le JSON de la réponse
    let workout;
    try {
      // Chercher le JSON dans la réponse (au cas où il y aurait du texte autour)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workout = JSON.parse(jsonMatch[0]);
      } else {
        workout = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Erreur de parsing JSON:', parseError);
      console.error('Contenu reçu:', content);
      throw new Error('Réponse de l\'IA invalide - format JSON incorrect');
    }

    console.log('Séance générée avec succès');

    return new Response(JSON.stringify({
      success: true,
      workout
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Erreur dans generate-ai-workout:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Une erreur est survenue lors de la génération'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
