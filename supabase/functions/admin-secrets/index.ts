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
    const { action, adminCode, secret, secretId, clueId, clueText, day, secretIds } = await req.json();

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

    switch (action) {
      case "list": {
        // Get all secrets with their clues
        const { data: secrets, error: secretsError } = await supabase
          .from("secrets")
          .select("*")
          .order("created_at", { ascending: false });

        if (secretsError) throw secretsError;

        // Get clues for each secret
        const { data: clues, error: cluesError } = await supabase
          .from("clues")
          .select("*")
          .order("created_at", { ascending: true });

        if (cluesError) throw cluesError;

        // Get daily_secrets config
        const { data: dailySecrets, error: dailyError } = await supabase
          .from("daily_secrets")
          .select("*")
          .order("day", { ascending: true });

        if (dailyError) throw dailyError;

        // Combine secrets with their clues
        const secretsWithClues = secrets?.map(s => ({
          ...s,
          clues: clues?.filter(c => c.secret_id === s.id) || []
        }));

        return new Response(
          JSON.stringify({ success: true, secrets: secretsWithClues, dailySecrets }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "add": {
        // Check max 20 secrets
        const { count } = await supabase
          .from("secrets")
          .select("*", { count: "exact", head: true });

        if (count && count >= 20) {
          return new Response(
            JSON.stringify({ success: false, error: "Maximum 20 secrets atteint" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("secrets")
          .insert({ title: secret.title, person_name: secret.person_name })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, secret: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const { data, error } = await supabase
          .from("secrets")
          .update({ title: secret.title, person_name: secret.person_name, is_active: secret.is_active })
          .eq("id", secretId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, secret: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { error } = await supabase
          .from("secrets")
          .delete()
          .eq("id", secretId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "addClue": {
        const { data, error } = await supabase
          .from("clues")
          .insert({ secret_id: secretId, text: clueText })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, clue: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "updateClue": {
        const { data, error } = await supabase
          .from("clues")
          .update({ text: clueText })
          .eq("id", clueId)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, clue: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "deleteClue": {
        const { error } = await supabase
          .from("clues")
          .delete()
          .eq("id", clueId);

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "setDailySecrets": {
        // Update which secrets are shown for a specific day
        const { data, error } = await supabase
          .from("daily_secrets")
          .update({ secret1_id: secretIds[0] || null, secret2_id: secretIds[1] || null })
          .eq("day", day)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, dailySecret: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "getGameConfig": {
        const { data, error } = await supabase
          .from("game_config")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        return new Response(
          JSON.stringify({ success: true, config: data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "updateGameConfig": {
        const { startDate, endDate } = await req.json().then(b => b);
        
        // Get existing config or create new
        const { data: existing } = await supabase
          .from("game_config")
          .select("id")
          .limit(1)
          .maybeSingle();

        let result;
        if (existing) {
          result = await supabase
            .from("game_config")
            .update({ 
              start_date: startDate, 
              end_date: endDate,
              updated_at: new Date().toISOString()
            })
            .eq("id", existing.id)
            .select()
            .single();
        } else {
          result = await supabase
            .from("game_config")
            .insert({ start_date: startDate, end_date: endDate })
            .select()
            .single();
        }

        if (result.error) throw result.error;

        return new Response(
          JSON.stringify({ success: true, config: result.data }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Action inconnue" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
  } catch (error) {
    console.error("Error in admin-secrets:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Erreur serveur" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
