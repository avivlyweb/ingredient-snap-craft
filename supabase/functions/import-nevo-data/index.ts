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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { nevoData } = await req.json();
    
    if (!nevoData || !Array.isArray(nevoData)) {
      return new Response(
        JSON.stringify({ error: 'Invalid NEVO data format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${nevoData.length} NEVO food items...`);

    // Process in batches of 100
    const batchSize = 100;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < nevoData.length; i += batchSize) {
      const batch = nevoData.slice(i, i + batchSize);
      
      const records = batch.map((item: any) => ({
        nevo_code: item.id,
        food_name_en: item.name,
        food_name_nl: item.name_nl,
        energy_kj: item.nutrients?.energy_kj || null,
        energy_kcal: item.nutrients?.energy_kcal || null,
        water_total: item.nutrients?.water_total_g || null,
        protein_total: item.nutrients?.protein_total_g || null,
        protein_plant: item.nutrients?.protein_plant_g || null,
        protein_animal: item.nutrients?.protein_animal_g || null,
        fat_total: item.nutrients?.fat_total_g || null,
        carbohydrate_available: item.nutrients?.carbohydrate_available_g || null,
        fiber_dietary_total: item.nutrients?.fibre_dietary_total_g || null,
        alcohol_total: item.nutrients?.alcohol_total_g || null,
        fatty_acids_saturated: item.nutrients?.fatty_acids_saturated_total_g || null,
        fatty_acids_monounsaturated: item.nutrients?.fatty_acids_monounsaturated_cis_total_g || null,
        fatty_acids_polyunsaturated: item.nutrients?.fatty_acids_total_polyunsaturated_total_g || null,
        vitamin_a: item.nutrients?.vitamin_a_rae_g || null,
        vitamin_d: item.nutrients?.vitamin_d_total_g || null,
        vitamin_e: item.nutrients?.vitamin_e_total_mg || null,
        vitamin_k: item.nutrients?.vitamin_k_total_g || null,
        vitamin_b1: item.nutrients?.thiamin_mg || null,
        vitamin_b2: item.nutrients?.riboflavin_mg || null,
        vitamin_b6: item.nutrients?.vitamin_b6_total_mg || null,
        vitamin_b12: item.nutrients?.vitamin_b12_total_g || null,
        vitamin_c: item.nutrients?.vitamin_c_total_mg || null,
        folate: item.nutrients?.folate_total_g || null,
        calcium: item.nutrients?.calcium_mg || null,
        iron: item.nutrients?.iron_total_mg || null,
        magnesium: item.nutrients?.magnesium_mg || null,
        phosphorus: item.nutrients?.phosphorus_mg || null,
        potassium: item.nutrients?.potassium_mg || null,
        sodium: item.nutrients?.sodium_mg || null,
        zinc: item.nutrients?.zinc_mg || null,
      }));

      const { error } = await supabase
        .from('nevo_foods')
        .upsert(records, { onConflict: 'nevo_code' });

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`Imported batch ${i / batchSize + 1}: ${imported} total`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        imported,
        errors,
        total: nevoData.length,
        message: `Successfully imported ${imported} items with ${errors} errors`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in import-nevo-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
