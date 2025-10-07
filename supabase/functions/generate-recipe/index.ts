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
    const { ingredients, contextType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Generating recipe for ingredients:', ingredients, 'with context:', contextType);

    const contextInstructions = {
      date_night: "Create a romantic, restaurant-quality dish that's impressive yet achievable. Focus on elegant presentation and intimate atmosphere. Include wine pairing suggestions.",
      family_dinner: "Design a crowd-pleasing, comforting meal with generous portions. Emphasize ease of serving and family-friendly flavors. Suggest how to make it kid-approved.",
      meal_prep: "Develop a batch-friendly recipe that stores and reheats beautifully. Focus on efficiency and how to portion for the week. Include storage tips.",
      quick_lunch: "Create a fast, energizing meal with minimal cleanup. Prioritize speed without sacrificing flavor. Suggest portable options.",
      entertaining: "Design a shareable, conversation-starting dish that's perfect for groups. Focus on impressive presentation and make-ahead elements.",
      experimental: "Push creative boundaries with unique flavor combinations and interesting techniques. Include learning opportunities and skill-building elements."
    };

    const contextInstruction = contextInstructions[contextType as keyof typeof contextInstructions] || contextInstructions.family_dinner;

    const prompt = `You are a professional chef creating a personalized recipe. Context: ${contextInstruction}

Generate a detailed, creative recipe using ONLY these ingredients: ${ingredients.join(', ')}.

CRITICAL: Return ONLY a valid JSON object. Do not use escaped quotes or special characters that would break JSON parsing. Use simple text without complex formatting.

Return this exact structure:
{
  "title": "Recipe name",
  "description": "Brief description",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "steps": "Step 1: Do this. Step 2: Do that.",
  "cuisine_style": "cuisine type",
  "serving_suggestion": "serving tips",
  "context_type": "${contextType}",
  "plating_guidance": "plating instructions",
  "time_management": "timeline tips",
  "ambiance_suggestions": "mood setting tips",
  "leftover_tips": "storage recommendations"
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
      // Remove markdown code blocks and clean the text
      let cleanedText = recipeText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      // Extract JSON object if wrapped in text
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      }
      
      recipe = JSON.parse(cleanedText);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Attempted to parse:", recipeText);
      throw new Error(`Failed to parse recipe: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
