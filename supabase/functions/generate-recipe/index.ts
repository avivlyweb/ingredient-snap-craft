import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Nutritional goals for each context type
const nutritionalGoals: Record<string, string> = {
  date_night: `NUTRITIONAL OBJECTIVES: Include mood-enhancing nutrients (tryptophan, magnesium, zinc), omega-3s for brain health. Target 500-700 kcal/serving, balanced macros. Avoid heavy/bloating ingredients.`,
  family_dinner: `NUTRITIONAL OBJECTIVES: High iron, calcium, fiber, vitamin C for immune support. Target 400-600 kcal/serving, kid-friendly. Balance: 30% protein, 40% carbs, 30% healthy fats.`,
  meal_prep: `NUTRITIONAL OBJECTIVES: Balanced macros for consistency, 25-30g protein/serving, slow-release carbs, healthy fats for satiety. Target 500-600 kcal/serving.`,
  quick_lunch: `NUTRITIONAL OBJECTIVES: Quick proteins, complex carbs for energy, B vitamins. Target 450-550 kcal/serving, ready in 30 minutes.`,
  entertaining: `NUTRITIONAL OBJECTIVES: Nutrient-dense sharing foods, antioxidant-rich ingredients, balanced presentation. Moderate portions for groups.`,
  experimental: `NUTRITIONAL OBJECTIVES: Explore nutrient synergies, nutrient-preserving cooking methods, superfood combinations. Educational approach to nutrition.`,
  // Recovery contexts
  nausea_support: `NUTRITIONAL OBJECTIVES: HIGH PROTEIN (1.5g/kg body weight). Gentle, easy-to-digest foods. Cold or room temperature dishes preferred. Avoid strong aromas and greasy foods. Small portions, calorie-dense. Include ginger, citrus for stomach settling. Target 30-40g protein per meal.`,
  low_appetite: `NUTRITIONAL OBJECTIVES: MAXIMIZE PROTEIN DENSITY (1.5g/kg body weight). Calorie-dense, nutrient-rich small portions. Fortified foods. Every bite counts. Focus on high-protein ingredients like eggs, Greek yogurt, cheese, nuts. Target 35-45g protein per meal in small volume.`,
  energy_boost: `NUTRITIONAL OBJECTIVES: HIGH PROTEIN with complex carbs for sustained energy. Include iron-rich foods with vitamin C for absorption. B vitamins for energy metabolism. Balanced blood sugar. Target 30-40g protein per meal.`,
  easy_prep: `NUTRITIONAL OBJECTIVES: HIGH PROTEIN (1.5g/kg body weight) with minimal cooking required. Simple preparation, batch-friendly. Ready-to-eat or quick-cook options. Nutrient-dense convenience. Target 30-35g protein per meal.`,
  cancer_support: `NUTRITIONAL OBJECTIVES: STRICT PROTEIN TARGET (1.5g/kg body weight per ERAS/ESPEN guidelines). FOOD SAFETY is critical for immunocompromised patients - all foods must be thoroughly cooked (cooked > raw). Focus on wound healing nutrients: protein, zinc, vitamin C, and collagen-supporting amino acids (Glutamine, Arginine). Include immunonutrition: Arginine-rich foods (eggs, nuts, seeds) and Omega-3s (fatty fish, walnuts). Manage treatment side effects: soft textures for mucositis, mild flavors for taste changes, avoid acidic/spicy foods. Target 35-45g protein per meal.`
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

    const contextInstructions: Record<string, string> = {
      date_night: "Create a romantic, restaurant-quality dish that's impressive yet achievable. Focus on elegant presentation and intimate atmosphere. Include wine pairing suggestions.",
      family_dinner: "Design a crowd-pleasing, comforting meal with generous portions. Emphasize ease of serving and family-friendly flavors. Suggest how to make it kid-approved.",
      meal_prep: "Develop a batch-friendly recipe that stores and reheats beautifully. Focus on efficiency and how to portion for the week. Include storage tips.",
      quick_lunch: "Create a fast, energizing meal with minimal cleanup. Prioritize speed without sacrificing flavor. Suggest portable options.",
      entertaining: "Design a shareable, conversation-starting dish that's perfect for groups. Focus on impressive presentation and make-ahead elements.",
      experimental: "Push creative boundaries with unique flavor combinations and interesting techniques. Include learning opportunities and skill-building elements.",
      // Recovery-specific instructions
      nausea_support: "Create a GENTLE, easy-to-digest recipe specifically for someone experiencing nausea. CRITICAL REQUIREMENTS: Cold or room-temperature serving preferred. Minimal strong aromas. Avoid greasy, fried, or heavy foods. Small portions that are calorie and protein dense. Include soothing ingredients like ginger, bland carbs. Make it visually appealing but not overwhelming. Focus on foods that stay down easily.",
      low_appetite: "Create a NUTRIENT-DENSE recipe for someone with very low appetite. CRITICAL REQUIREMENTS: Small portion sizes but PACKED with protein and calories. Every ingredient must count nutritionally. Include protein-rich foods like eggs, Greek yogurt, cheese, nut butters. Consider smoothie-style or easy-to-consume format. Make it appealing even when not hungry. Suggest fortification options (add protein powder, etc.).",
      energy_boost: "Create an ENERGIZING recipe for someone experiencing fatigue during recovery. CRITICAL REQUIREMENTS: Include iron-rich foods paired with vitamin C for absorption. Complex carbohydrates for sustained energy. High protein for muscle support. B-vitamin rich ingredients. Avoid sugar spikes. Make it satisfying but not heavy.",
      easy_prep: "Create a SIMPLE recipe requiring minimal effort for someone with limited energy. CRITICAL REQUIREMENTS: 15 minutes or less active cooking time. Few ingredients. Simple techniques. Can use pre-made components (rotisserie chicken, canned beans, pre-cut vegetables). Still high in protein and nutrients. Suggest batch cooking options.",
      cancer_support: "You are the 'ZorgAssistent' AI, an Evidence-Based Clinical Nutritionist specializing in Dutch Post-Operative Recovery following ERAS/ESPEN guidelines. Create a SAFE, HEALING-FOCUSED recipe for cancer/surgical recovery patients. CRITICAL REQUIREMENTS: FOOD SAFETY - All ingredients must be thoroughly cooked (no raw foods, cooked > raw) for immunocompromised patients. WOUND HEALING - Prioritize protein (1.5g/kg target), zinc, vitamin C, and collagen-supporting amino acids (Glutamine, Arginine). IMMUNONUTRITION - Include Arginine-rich foods (eggs, poultry, nuts) and Omega-3 sources (cooked salmon, walnuts). SYMPTOM MANAGEMENT - Soft textures for mucositis, mild flavors for taste changes, avoid acidic/spicy foods. Make it appetizing despite treatment side effects."
    };

    const contextInstruction = contextInstructions[contextType as keyof typeof contextInstructions] || contextInstructions.family_dinner;
    const nutritionalGoal = nutritionalGoals[contextType as keyof typeof nutritionalGoals] || nutritionalGoals.family_dinner;
    
    // Check if this is a recovery context that needs dual-layer output
    const isRecoveryContext = ['nausea_support', 'low_appetite', 'energy_boost', 'easy_prep', 'cancer_support'].includes(contextType);

const prompt = `You are ${isRecoveryContext ? "the 'ZorgAssistent' AI, an Evidence-Based Clinical Nutritionist specializing in Dutch Post-Operative Recovery. You follow ERAS (Enhanced Recovery After Surgery) and ESPEN (European Society for Clinical Nutrition and Metabolism) guidelines" : "a professional chef with nutrition expertise"} creating a personalized recipe.

Context: ${contextInstruction}

${nutritionalGoal}

NUTRITIONAL OPTIMIZATION GUIDELINES:
- Choose cooking methods that preserve nutrients (steaming > boiling, roasting > frying)
- Consider nutrient synergies (vitamin C helps iron absorption, healthy fats help vitamin absorption)
- Highlight key nutritional benefits in the description
- Ensure ingredient quantities align with nutritional objectives
${isRecoveryContext ? `
EVIDENCE-BASED PRACTICE RULES (ZorgAssistent Protocols):
- Protein Targets: Strictly adhere to 1.5g/kg target for post-operative recovery (Ref: ESPEN guidelines for surgical patients)
- Data Source: Prioritize NEVO 2023 (v8.0) nutritional values where possible
- For cancer_support context: Apply immunonutrition principles, prioritize Arginine/Omega-3s as per ERAS protocols
- Generate DUAL-LAYER INSIGHTS for both patients and clinicians
` : ''}

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
  "leftover_tips": "storage recommendations",
  "nutrition": {
    "calories": 600,
    "protein": 35,
    "carbs": 45,
    "fat": 20,
    "fiber": 8
  },
  "health_insights": [
    {
      "title": "Insight title",
      "description": "Insight description",
      "type": "benefit"
    }
  ]${isRecoveryContext ? `,
  "patient_tips": [
    "Encouraging, clear tip for the patient about this recipe",
    "Another motivating health tip written in friendly language"
  ],
  "clinical_rationale": [
    {
      "topic": "Topic name (e.g., Wound Healing, Food Safety, Immunonutrition)",
      "mechanism": "Technical explanation of the nutritional mechanism for clinicians",
      "evidence_grade": "Grade A (Systematic Review), Grade B (Clinical Consensus), or Grade C (Expert Opinion)"
    }
  ]` : ''}
}

NUTRITION FIELD REQUIREMENTS:
- Calculate total nutrition for ALL servings (assume 4 servings)
- Use realistic estimates based on ingredients
- Calories should align with the nutritional objectives above
- Protein, carbs, fat in grams for total recipe
- Fiber in grams for total recipe

HEALTH INSIGHTS REQUIREMENTS:
- Provide 3-5 health insights
- Types: "benefit" (health benefits), "synergy" (nutrient combinations), "tip" (cooking/preparation tips)
- Focus on key nutrients in the ingredients
- Explain specific health benefits backed by nutritional science
- Mention nutrient preservation techniques used
${isRecoveryContext ? `
PATIENT TIPS REQUIREMENTS (patient_tips array):
- Provide 3-5 encouraging, clear tips for the patient
- Use friendly, motivating language (ZorgAssistent PatientVoice style)
- Focus on why this recipe helps their recovery
- Include practical eating/serving suggestions
- Dutch-localized tips if appropriate

CLINICAL RATIONALE REQUIREMENTS (clinical_rationale array):
- Provide 2-4 clinical rationale items for healthcare professionals
- Topics should cover: wound healing, food safety, immunonutrition, symptom management as relevant
- Mechanism should explain the nutritional science (amino acids, nutrient functions, etc.)
- Evidence grades: Grade A (systematic reviews/RCTs), Grade B (clinical consensus/guidelines), Grade C (expert opinion)
- Reference ERAS/ESPEN guidelines where applicable
` : ''}`;

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
