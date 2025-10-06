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

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "title": "Recipe name that reflects the context",
  "description": "Brief appetizing description tailored to the occasion (2-3 sentences)",
  "ingredients": ["ingredient 1 with measurement", "ingredient 2 with measurement"],
  "steps": "Step 1: ...\nStep 2: ...\nStep 3: ...",
  "cuisine_style": "cuisine type (e.g., Italian, Asian, Mexican)",
  "serving_suggestion": "context-appropriate serving and pairing tips",
  "context_type": "${contextType}",
  "plating_guidance": "Specific plating instructions tailored to ${contextType}. Be detailed about presentation.",
  "time_management": "Timeline and prep tips specific to ${contextType}. Include what can be done ahead.",
  "ambiance_suggestions": "Mood-setting tips for ${contextType} (music, lighting, table setting ideas)",
  "leftover_tips": "Creative ways to transform leftovers or storage recommendations"
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
