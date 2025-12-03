import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { adminCode, day } = await req.json();

    // Verify admin code
    const expectedCode = Deno.env.get("ADMIN_CODE");
    if (!expectedCode || adminCode !== expectedCode) {
      return new Response(
        JSON.stringify({ success: false, error: "Code admin invalide" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all guesses
    const { data: allGuesses, error: guessesError } = await supabase
      .from("guesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (guessesError) throw guessesError;

    // Get daily config
    const { data: dailyConfig, error: dailyError } = await supabase
      .from("daily_secrets")
      .select("*")
      .eq("day", day)
      .maybeSingle();

    if (dailyError) throw dailyError;

    // Filter guesses for today
    const todayGuesses = allGuesses?.filter(g => g.day === day) || [];

    // Count guesses per player for today
    const playerGuessCount: Record<string, number> = {};
    todayGuesses.forEach(g => {
      playerGuessCount[g.player_name] = (playerGuessCount[g.player_name] || 0) + 1;
    });

    // Players who completed both secrets today
    const completedPlayers = Object.entries(playerGuessCount)
      .filter(([_, count]) => count >= 2)
      .map(([name]) => name);

    // Players who only did 1 secret
    const partialPlayers = Object.entries(playerGuessCount)
      .filter(([_, count]) => count === 1)
      .map(([name]) => name);

    // Calculate leaderboard (10 points per correct guess)
    const playerScores: Record<string, number> = {};
    allGuesses?.forEach(g => {
      if (!playerScores[g.player_name]) playerScores[g.player_name] = 0;
      if (g.is_correct) playerScores[g.player_name] += 10;
    });

    const leaderboard = Object.entries(playerScores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({
        success: true,
        todayStats: {
          completedPlayers,
          partialPlayers,
          totalGuessesToday: todayGuesses.length,
        },
        leaderboard,
        todayGuesses,
        dailyConfig,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in admin-stats:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erreur serveur" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
