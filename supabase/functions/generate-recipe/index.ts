import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Generating recipe for ingredients:', ingredients);

    const prompt = `Generate a detailed, creative recipe using ONLY these ingredients: ${ingredients.join(', ')}.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "title": "Recipe name",
  "description": "Brief appetizing description (2-3 sentences)",
  "ingredients": ["ingredient 1 with measurement", "ingredient 2 with measurement"],
  "steps": "Step 1: ...\nStep 2: ...\nStep 3: ...",
  "cuisine_style": "cuisine type (e.g., Italian, Asian, Mexican)",
  "serving_suggestion": "serving and pairing tips"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const recipeText = data.choices?.[0]?.message?.content;
    
    console.log('Raw recipe response:', recipeText);
    
    // Parse the JSON from the response
    let recipe;
    try {
      // Remove markdown code blocks if present
      const cleanedText = recipeText.replace(/```json\n?|\n?```/g, '').trim();
      recipe = JSON.parse(cleanedText);
    } catch (e) {
      // If parsing fails, try to extract JSON object from text
      const match = recipeText.match(/\{[\s\S]*\}/);
      if (match) {
        recipe = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse recipe from AI response");
      }
    }

    console.log('Generated recipe:', recipe);

    return new Response(
      JSON.stringify({ recipe }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating recipe:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
