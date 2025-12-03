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
    const { playerName, secretId, guessName, day } = await req.json();

    // Validate input
    if (!playerName || typeof playerName !== "string" || playerName.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: "Nom de joueur invalide" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!secretId || !guessName || !day) {
      return new Response(
        JSON.stringify({ success: false, error: "Données manquantes" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if player already guessed this secret
    const { data: existingGuess } = await supabase
      .from("guesses")
      .select("id")
      .eq("player_name", playerName.trim())
      .eq("secret_id", secretId)
      .maybeSingle();

    if (existingGuess) {
      return new Response(
        JSON.stringify({ success: false, error: "Tu as déjà deviné ce secret" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get the secret to check the correct answer
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("person_name")
      .eq("id", secretId)
      .single();

    if (secretError || !secret) {
      return new Response(
        JSON.stringify({ success: false, error: "Secret non trouvé" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check if the guess is correct (case-insensitive, trimmed)
    const isCorrect = secret.person_name.toLowerCase().trim() === guessName.toLowerCase().trim();

    // Insert the guess
    const { data: guess, error: insertError } = await supabase
      .from("guesses")
      .insert({
        player_name: playerName.trim(),
        secret_id: secretId,
        day: day,
        guess_name: guessName.trim(),
        is_correct: isCorrect,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, guessId: guess.id, isCorrect }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in submit-guess:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erreur serveur" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
