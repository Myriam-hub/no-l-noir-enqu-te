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
    const { action, adminCode, clueData, clueId } = await req.json();
    
    // Verify admin code
    const storedCode = Deno.env.get('ADMIN_CODE');
    if (!storedCode || adminCode !== storedCode) {
      console.log('Admin verification failed');
      return new Response(
        JSON.stringify({ error: 'Code administrateur invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result;

    switch (action) {
      case 'add':
        console.log('Adding clue:', clueData);
        const { data: addData, error: addError } = await supabase
          .from('clues')
          .insert({
            day: clueData.day,
            clue_number: clueData.clue_number,
            text: clueData.text,
            answer: clueData.answer,
          })
          .select()
          .single();

        if (addError) {
          console.error('Add clue error:', addError);
          throw addError;
        }
        result = addData;
        break;

      case 'update':
        console.log('Updating clue:', clueId, clueData);
        const { data: updateData, error: updateError } = await supabase
          .from('clues')
          .update(clueData)
          .eq('id', clueId)
          .select()
          .single();

        if (updateError) {
          console.error('Update clue error:', updateError);
          throw updateError;
        }
        result = updateData;
        break;

      case 'delete':
        console.log('Deleting clue:', clueId);
        const { error: deleteError } = await supabase
          .from('clues')
          .delete()
          .eq('id', clueId);

        if (deleteError) {
          console.error('Delete clue error:', deleteError);
          throw deleteError;
        }
        result = { deleted: true };
        break;

      case 'list':
        console.log('Listing all clues');
        const { data: listData, error: listError } = await supabase
          .from('clues')
          .select('*')
          .order('day', { ascending: false })
          .order('clue_number');

        if (listError) {
          console.error('List clues error:', listError);
          throw listError;
        }
        result = listData;
        break;

      default:
        throw new Error('Action non valide');
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin clues error:', error);
    const message = error instanceof Error ? error.message : 'Une erreur est survenue';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
