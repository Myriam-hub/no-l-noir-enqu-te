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
    const { adminCode, day } = await req.json();
    
    // Verify admin code
    const storedCode = Deno.env.get('ADMIN_CODE');
    if (!storedCode || adminCode !== storedCode) {
      console.log('Admin verification failed');
      return new Response(
        JSON.stringify({ error: 'Code administrateur invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all answers
    const { data: allAnswers, error: answersError } = await supabase
      .from('answers')
      .select('*')
      .order('created_at', { ascending: false });

    if (answersError) {
      console.error('Fetch answers error:', answersError);
      throw answersError;
    }

    // Get today's answers
    const todayAnswers = allAnswers?.filter(a => a.day === day) || [];

    // Calculate unique players who answered today
    const playersToday = [...new Set(todayAnswers.map(a => a.player_name))];
    
    // Calculate players with 2 answers today (completed)
    const playerAnswerCounts: Record<string, number> = {};
    todayAnswers.forEach(a => {
      playerAnswerCounts[a.player_name] = (playerAnswerCounts[a.player_name] || 0) + 1;
    });
    
    const completedPlayers = Object.entries(playerAnswerCounts)
      .filter(([_, count]) => count >= 2)
      .map(([name]) => name);

    const partialPlayers = Object.entries(playerAnswerCounts)
      .filter(([_, count]) => count === 1)
      .map(([name]) => name);

    // Calculate leaderboard (total correct answers per player)
    const playerScores: Record<string, number> = {};
    allAnswers?.forEach(a => {
      if (a.is_correct) {
        playerScores[a.player_name] = (playerScores[a.player_name] || 0) + 1;
      }
    });

    const leaderboard = Object.entries(playerScores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);

    // Get all unique player names who have ever played
    const allPlayers = [...new Set(allAnswers?.map(a => a.player_name) || [])];

    console.log(`Stats: ${completedPlayers.length} completed, ${partialPlayers.length} partial, ${leaderboard.length} total players`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          todayStats: {
            completedPlayers,
            partialPlayers,
            totalAnswersToday: todayAnswers.length,
          },
          leaderboard,
          allPlayers,
          todayAnswers: todayAnswers.map(a => ({
            player_name: a.player_name,
            is_correct: a.is_correct,
            clue_id: a.clue_id,
            created_at: a.created_at,
          })),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin stats error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
