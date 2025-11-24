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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { query, limit = 10 } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchQuery = query.trim().toLowerCase();

    // Search in both English and Dutch names
    const { data, error } = await supabase
      .from('nevo_foods')
      .select('*')
      .or(`food_name_en.ilike.%${searchQuery}%,food_name_nl.ilike.%${searchQuery}%`)
      .limit(limit);

    if (error) throw error;

    const results = data.map((food: any) => ({
      id: food.id,
      nevo_code: food.nevo_code,
      name: food.food_name_en,
      name_nl: food.food_name_nl,
      calories: food.energy_kcal,
      protein: food.protein_total,
      carbs: food.carbohydrate_available,
      fat: food.fat_total,
      fiber: food.fiber_dietary_total,
    }));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error searching NEVO:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
