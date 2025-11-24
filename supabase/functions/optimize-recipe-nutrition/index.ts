import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapSuggestion {
  original: string;
  replacement: string;
  reason: string;
  nutritionImprovement: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { ingredients, healthGoals } = await req.json();

    if (!ingredients || !Array.isArray(ingredients)) {
      return new Response(
        JSON.stringify({ error: 'Invalid ingredients' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Optimizing recipe for goals:', healthGoals);

    const suggestions: SwapSuggestion[] = [];

    // Common optimization mappings based on health goals
    const optimizationMap: Record<string, Array<{ from: string[], to: string, reason: string }>> = {
      high_protein: [
        { from: ['white rice', 'rice', 'pasta'], to: 'quinoa', reason: 'Higher protein content (8g vs 4g per 100g)' },
        { from: ['ground beef', 'beef'], to: 'chicken breast', reason: 'Leaner protein with less saturated fat' },
        { from: ['regular yogurt', 'yogurt'], to: 'greek yogurt', reason: 'Double the protein (10g vs 5g per 100g)' },
      ],
      low_carb: [
        { from: ['rice', 'white rice'], to: 'cauliflower rice', reason: 'Reduces carbs by 90% (5g vs 45g per 100g)' },
        { from: ['pasta', 'spaghetti'], to: 'zucchini noodles', reason: 'Low-carb alternative with added vitamins' },
        { from: ['potatoes', 'potato'], to: 'turnips', reason: 'Lower in carbs and calories' },
      ],
      heart_health: [
        { from: ['butter'], to: 'olive oil', reason: 'Rich in heart-healthy monounsaturated fats' },
        { from: ['white bread', 'bread'], to: 'whole grain bread', reason: 'More fiber and nutrients for heart health' },
        { from: ['ground beef'], to: 'salmon', reason: 'Omega-3 fatty acids support cardiovascular health' },
      ],
      high_fiber: [
        { from: ['white rice'], to: 'brown rice', reason: 'Triple the fiber (3.5g vs 1.2g per 100g)' },
        { from: ['white bread'], to: 'whole wheat bread', reason: 'Higher fiber content for digestive health' },
        { from: ['regular oats'], to: 'steel-cut oats', reason: 'More fiber and slower digestion' },
      ],
    };

    // Process each ingredient and find potential swaps
    for (const ingredient of ingredients) {
      const lowerIngredient = ingredient.toLowerCase();
      
      // Check each health goal
      for (const goal of healthGoals || []) {
        const swaps = optimizationMap[goal] || [];
        
        for (const swap of swaps) {
          // Check if ingredient matches any "from" items
          const matches = swap.from.some(from => 
            lowerIngredient.includes(from.toLowerCase())
          );
          
          if (matches) {
            // Look up both ingredients in NEVO database
            const { data: originalData } = await supabase
              .from('nevo_foods')
              .select('*')
              .ilike('food_name_en', `%${swap.from[0]}%`)
              .limit(1)
              .single();

            const { data: replacementData } = await supabase
              .from('nevo_foods')
              .select('*')
              .ilike('food_name_en', `%${swap.to}%`)
              .limit(1)
              .single();

            const nutritionImprovement: any = {};
            
            if (originalData && replacementData) {
              if (replacementData.protein_total > originalData.protein_total) {
                nutritionImprovement.protein = Math.round(
                  replacementData.protein_total - originalData.protein_total
                );
              }
              if (replacementData.fiber_dietary_total > originalData.fiber_dietary_total) {
                nutritionImprovement.fiber = Math.round(
                  replacementData.fiber_dietary_total - originalData.fiber_dietary_total
                );
              }
              if (originalData.fat_total > replacementData.fat_total) {
                nutritionImprovement.fat = -Math.round(
                  originalData.fat_total - replacementData.fat_total
                );
              }
            }

            suggestions.push({
              original: ingredient,
              replacement: swap.to.charAt(0).toUpperCase() + swap.to.slice(1),
              reason: swap.reason,
              nutritionImprovement,
            });
            break; // Only one suggestion per ingredient
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error optimizing recipe:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
