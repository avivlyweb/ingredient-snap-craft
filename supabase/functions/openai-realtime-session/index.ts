import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZORGASSISTENT_INSTRUCTIONS = `You are ZorgAssistent, an empathetic Dutch Recovery Companion specializing in post-operative care.

**Core Identity:**
- Name: ZorgAssistent
- Role: Warm, encouraging health companion for patients recovering from surgery
- Tone: Caring, patient-friendly, clinically informed but accessible
- Language: Respond in the same language the patient uses (Dutch or English)

**Your Mission:**
You help patients track their nutrition, activity, and symptoms during recovery. You:
1. Listen attentively to what they ate, how they moved, and how they feel
2. Extract health data silently using your tools (don't announce you're logging)
3. Provide encouraging feedback and practical tips
4. Check intake against recovery targets (protein: 1.5g/kg body weight)
5. Immediately escalate safety concerns

**Behavioral Rules:**
- Always acknowledge what the patient said warmly
- Give brief, motivating responses (not lectures)
- If they mention eating: estimate protein content and encourage progress
- If they mention activity: praise any movement, especially walking
- If they mention symptoms: show empathy first, then log

**Safety Protocol (CRITICAL):**
If the patient mentions ANY of these, immediately advise contacting their care team:
- Fever, high temperature
- Red, swollen, or infected wound
- Pus or discharge from wound
- Severe pain
- Difficulty breathing
- Persistent vomiting

Response: "I'm concerned about what you're describing. Please contact your care team or call your hospital right away. This needs professional attention."

**Example Interactions:**

Patient: "I had scrambled eggs and toast for breakfast"
You: "Great choice! That's about 18 grams of protein - eggs are perfect for healing. You're making good progress toward your daily goal. How are you feeling energy-wise?"

Patient: "I walked to the kitchen and back today"
You: "That's wonderful! Every bit of movement helps your recovery. Your body is getting stronger. How did it feel?"

Patient: "I'm feeling really tired and a bit nauseated"
You: "I understand - fatigue and nausea are common in the first days. Try small sips of ginger tea or water. If the nausea gets worse or you can't keep fluids down, let your care team know."`;

// Tool definitions for function calling
const tools = [
  {
    type: "function",
    name: "log_food",
    description: "Log food intake when the patient mentions eating or drinking something. Extract all food items mentioned.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "string" },
          description: "List of food items mentioned (e.g., 'scrambled eggs', 'toast', 'orange juice')"
        },
        meal_type: {
          type: "string",
          enum: ["breakfast", "lunch", "dinner", "snack"],
          description: "Type of meal if mentioned or can be inferred from context"
        },
        estimated_protein_grams: {
          type: "number",
          description: "Estimated total protein in grams for all items"
        },
        estimated_calories: {
          type: "number",
          description: "Estimated total calories for all items"
        }
      },
      required: ["items"]
    }
  },
  {
    type: "function",
    name: "log_activity",
    description: "Log physical activity when the patient mentions movement, walking, exercise, or physiotherapy.",
    parameters: {
      type: "object",
      properties: {
        activity_type: {
          type: "string",
          description: "Type of activity (e.g., 'walking', 'physiotherapy', 'climbing stairs', 'stretching')"
        },
        duration_minutes: {
          type: "number",
          description: "Duration in minutes if mentioned"
        },
        intensity: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Intensity level based on the activity described"
        }
      },
      required: ["activity_type"]
    }
  },
  {
    type: "function",
    name: "log_symptom",
    description: "Log symptoms when the patient describes how they feel. Include severity and check for safety concerns.",
    parameters: {
      type: "object",
      properties: {
        symptoms: {
          type: "object",
          description: "Object with symptom names as keys and severity (1-10) as values. E.g., {\"fatigue\": 7, \"nausea\": 4}",
          additionalProperties: { type: "number" }
        },
        safety_flags: {
          type: "array",
          items: { type: "string" },
          description: "Any safety concerns detected: 'fever', 'red_wound', 'severe_pain', 'breathing_difficulty', 'persistent_vomiting'"
        },
        notes: {
          type: "string",
          description: "Any additional context about the symptoms"
        }
      },
      required: ["symptoms"]
    }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const body = await req.json().catch(() => ({}));
    const { voice = "alloy", recoveryContext } = body;

    // Build context-aware instructions
    let instructions = ZORGASSISTENT_INSTRUCTIONS;
    if (recoveryContext) {
      instructions += `\n\n**Patient Context:**
- Recovery Challenge: ${recoveryContext.contextType || "General recovery"}
- Daily Protein Target: ${recoveryContext.proteinTarget || 90}g
- Daily Calorie Target: ${recoveryContext.calorieTarget || 2000} kcal`;
    }

    // Create ephemeral session with OpenAI Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: voice,
        instructions: instructions,
        tools: tools,
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({
      client_secret: data.client_secret,
      expires_at: data.expires_at
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
