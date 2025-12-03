import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerName, clueId, response, day } = await req.json();

    // Validate input
    if (!playerName || typeof playerName !== 'string' || playerName.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Nom du joueur invalide (minimum 2 caractères)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!clueId || !response || !day) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPlayerName = playerName.trim().toLowerCase();

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if player has already answered this clue today
    const { data: existingAnswer, error: checkError } = await supabase
      .from('answers')
      .select('id')
      .eq('player_name', normalizedPlayerName)
      .eq('clue_id', clueId)
      .maybeSingle();

    if (checkError) {
      console.error('Check existing answer error:', checkError);
      throw checkError;
    }

    if (existingAnswer) {
      return new Response(
        JSON.stringify({ error: 'Tu as déjà répondu à cet indice' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if player has already answered 2 clues today
    const { data: todayAnswers, error: countError } = await supabase
      .from('answers')
      .select('id')
      .eq('player_name', normalizedPlayerName)
      .eq('day', day);

    if (countError) {
      console.error('Count answers error:', countError);
      throw countError;
    }

    if (todayAnswers && todayAnswers.length >= 2) {
      return new Response(
        JSON.stringify({ error: 'Tu as déjà participé aujourd\'hui, reviens demain!' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the clue to check the answer
    const { data: clue, error: clueError } = await supabase
      .from('clues')
      .select('answer, day')
      .eq('id', clueId)
      .single();

    if (clueError || !clue) {
      console.error('Get clue error:', clueError);
      return new Response(
        JSON.stringify({ error: 'Indice non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Don't allow answering future clues
    if (clue.day > day) {
      return new Response(
        JSON.stringify({ error: 'Cet indice n\'est pas encore disponible' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if answer is correct (case insensitive, trimmed)
    const isCorrect = response.trim().toLowerCase() === clue.answer.trim().toLowerCase();

    // Insert the answer
    const { data: insertedAnswer, error: insertError } = await supabase
      .from('answers')
      .insert({
        player_name: normalizedPlayerName,
        player_id: null, // Not using player_id anymore
        clue_id: clueId,
        day: day,
        response: response.trim(),
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert answer error:', insertError);
      throw insertError;
    }

    console.log(`Answer submitted: ${normalizedPlayerName} -> ${isCorrect ? 'correct' : 'incorrect'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        isCorrect,
        answerId: insertedAnswer.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Submit answer error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
