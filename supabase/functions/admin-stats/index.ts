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
    const { adminCode } = await req.json();

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

    // Get all secrets to see first_found_by
    const { data: allSecrets, error: secretsError } = await supabase
      .from("secrets")
      .select("*");

    if (secretsError) throw secretsError;

    // Normalize player name function (remove accents, lowercase, trim, use first name only for matching)
    const normalizeName = (name: string): string => {
      const normalized = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim()
        .replace(/\s+/g, " "); // Normalize spaces
      
      // Use only the first word (first name) for matching
      return normalized.split(" ")[0];
    };

    // Map normalized names to their display name (use the first occurrence)
    const nameMap: Record<string, string> = {};
    const getDisplayName = (name: string): string => {
      const normalized = normalizeName(name);
      if (!nameMap[normalized]) {
        nameMap[normalized] = name;
      }
      return nameMap[normalized];
    };

    // First pass: collect all names from guesses to build the name map
    allGuesses?.forEach(g => getDisplayName(g.player_name));

    // Calculate unique players (normalized)
    const uniqueNormalizedPlayers = [...new Set(allGuesses?.map(g => normalizeName(g.player_name)) || [])];

    // Count secrets found by each player (first finder only = 1 point each)
    const playerScores: Record<string, number> = {};
    allSecrets?.forEach(s => {
      if (s.first_found_by) {
        const normalized = normalizeName(s.first_found_by);
        const displayName = nameMap[normalized] || s.first_found_by;
        playerScores[displayName] = (playerScores[displayName] || 0) + 1;
      }
    });

    // Add players with 0 points who have guessed but not found any
    uniqueNormalizedPlayers.forEach(normalized => {
      const displayName = nameMap[normalized];
      if (displayName && !(displayName in playerScores)) {
        playerScores[displayName] = 0;
      }
    });

    const leaderboard = Object.entries(playerScores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score);

    // Stats: secrets found vs total
    const secretsFound = allSecrets?.filter(s => s.first_found_by).length || 0;
    const totalSecrets = allSecrets?.length || 0;

    return new Response(
      JSON.stringify({
        success: true,
        stats: {
          totalPlayers: uniqueNormalizedPlayers.length,
          secretsFound,
          totalSecrets,
          totalGuesses: allGuesses?.length || 0,
        },
        leaderboard,
        allGuesses,
        allSecrets,
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
