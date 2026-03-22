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
    const { images } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Extracting ingredients from images:', images.length);

    // Build content with all images
    const content = [
      {
        type: "text",
        text: "Extract a list of edible ingredients from the uploaded images. Only include recognizable, commonly-used food items. Return ONLY a JSON array of ingredient names, nothing else. Example: [\"tomatoes\", \"chicken breast\", \"garlic\"]"
      },
      ...images.map((imageUrl: string) => ({
        type: "image_url",
        image_url: { url: imageUrl }
      }))
    ];

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
            content: content
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
    const ingredientsText = data.choices?.[0]?.message?.content;
    
    console.log('Raw AI response:', ingredientsText);
    
    // Parse the JSON array from the response
    let ingredients: string[];
    try {
      ingredients = JSON.parse(ingredientsText);
    } catch (e) {
      // If parsing fails, try to extract JSON array from text
      const match = ingredientsText.match(/\[.*\]/s);
      if (match) {
        ingredients = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse ingredients from AI response");
      }
    }

    console.log('Extracted ingredients:', ingredients);

    return new Response(
      JSON.stringify({ ingredients }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error extracting ingredients:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
