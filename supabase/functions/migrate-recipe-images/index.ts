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
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch recipes with base64 images (they start with 'data:')
    const { data: recipes, error: fetchError } = await supabase
      .from('recipes')
      .select('id, image_url')
      .like('image_url', 'data:%');

    if (fetchError) {
      throw new Error(`Failed to fetch recipes: ${fetchError.message}`);
    }

    console.log(`Found ${recipes?.length || 0} recipes with base64 images to migrate`);

    const results = {
      total: recipes?.length || 0,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const recipe of recipes || []) {
      try {
        if (!recipe.image_url || !recipe.image_url.startsWith('data:')) {
          continue;
        }

        // Extract base64 data
        const base64Data = recipe.image_url.replace(/^data:image\/\w+;base64,/, '');
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        // Generate unique filename
        const timestamp = Date.now();
        const randomId = crypto.randomUUID().slice(0, 8);
        const fileName = `recipe-${recipe.id}-${timestamp}-${randomId}.png`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageBytes, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName);

        // Update recipe with new URL
        const { error: updateError } = await supabase
          .from('recipes')
          .update({ image_url: publicUrlData.publicUrl })
          .eq('id', recipe.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        results.migrated++;
        console.log(`Migrated recipe ${recipe.id}`);

      } catch (error) {
        results.failed++;
        results.errors.push(`Recipe ${recipe.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error(`Failed to migrate recipe ${recipe.id}:`, error);
      }
    }

    console.log(`Migration complete: ${results.migrated} migrated, ${results.failed} failed`);

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
