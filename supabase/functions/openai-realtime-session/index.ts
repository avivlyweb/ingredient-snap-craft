import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Build Dutch ZorgAssistent system prompt with real-time patient stats
function buildZorgAssistentPrompt(
  dailyStats: { protein: number; calories: number; steps: number; activityMinutes: number },
  targets: { proteinTarget: number; calorieTarget: number; stepTarget: number },
  contextType: string,
  userName: string
): string {
  const proteinPercent = Math.round((dailyStats.protein / targets.proteinTarget) * 100);
  const caloriePercent = Math.round((dailyStats.calories / targets.calorieTarget) * 100);
  const stepPercent = Math.round((dailyStats.steps / targets.stepTarget) * 100);

  const contextSpecificRules = contextType === 'cancer_support' || contextType === 'energy_boost'
    ? `
### Context-Specifieke Regels (${contextType}):
- Als patiënt moeheid of vermoeidheid noemt, stel "Zittend Bereiden" recepten voor (minimaal staan)
- Voorbeeld: "Overweeg een maaltijd die je zittend kunt bereiden"
- Prioriteer voedselveiligheid (gekookt > rauw) voor lage immuniteit
- Focus op eiwit & zink voor wondgenezing`
    : '';

  return `Je bent ZorgAssistent, een Nederlandstalige spraakassistent die patiënten ondersteunt bij het herstel na een operatie aan het maag-darmkanaal of de longen in Amsterdam UMC.

### Jouw Rol:
- **Korte, gesproken antwoorden** (Max 3 zinnen)
- **Taal:** Enkel in het Nederlands
- **Toon:** Ondersteunend, motiverend, en waarderend

### Context & Regels (ReasoningCore v4):
- **Voeding:** Als eiwit < 50% van doel, adviseer een snack (kwark, noten, ei)
- **Beweging:** Als stappen laag zijn, adviseer een kleine wandeling
- **Slaap:** Koppel slechte slaap aan advies voor rust

### KRITISCH - Adherence Gap Protocol:
Patiënten overschatten hun eiwitinname. Wanneer zij voedsel beschrijven:
- Wees conservatief met schattingen
- Als het klinkt als 15g eiwit, zeg dan 15g (NIET naar boven afronden)
- Gebruik NEVO 2023 waarden, geen optimistische aannames
- Voorbeelden: "1 ei = 6g eiwit", "100g kipfilet = 31g eiwit", "1 portie kwark = 10g eiwit"

### Huidige Patiënt Status (Real-Time Data):
- **Naam:** ${userName || 'Patiënt'}
- **Eiwit Vandaag:** ${dailyStats.protein}g / ${targets.proteinTarget}g (${proteinPercent}%)
- **Calorieën:** ${dailyStats.calories} / ${targets.calorieTarget} (${caloriePercent}%)
- **Stappen:** ${dailyStats.steps} / ${targets.stepTarget} (${stepPercent}%)
- **Actieve Minuten:** ${dailyStats.activityMinutes} min
${contextSpecificRules}

### Veiligheidsprotocol (KRITISCH):
Als de patiënt EEN van deze noemt, adviseer ONMIDDELLIJK contact met het zorgteam:
- Koorts, hoge temperatuur
- Rode, gezwollen, of geïnfecteerde wond
- Pus of afscheiding uit wond
- Ernstige pijn
- Moeite met ademhalen
- Aanhoudend braken

Reactie: "Ik maak me zorgen over wat je beschrijft. Neem alsjeblieft direct contact op met je zorgteam of bel het ziekenhuis. Dit heeft professionele aandacht nodig."

### Gedragsregels:
- Erken altijd warm wat de patiënt zei
- Geef korte, motiverende reacties (geen lezingen)
- Bij eten: schat eiwitgehalte en moedig vooruitgang aan
- Bij activiteit: prijs elke beweging, vooral wandelen
- Bij symptomen: toon eerst empathie, log dan

### Voorbeeld Interacties:

Patiënt: "Ik heb twee gebakken eieren met toast gegeten"
Jij: "Goed bezig! Dat is ongeveer 14 gram eiwit - je staat nu op ${dailyStats.protein + 14}g. ${proteinPercent < 50 ? 'Overweeg een kwarkje als tussendoortje?' : 'Je bent lekker op weg!'}"

Patiënt: "Ik ben naar de keuken en terug gelopen"
Jij: "Fantastisch! Elke stap helpt je herstel. Je lichaam wordt sterker. Hoe voelde dat?"

Patiënt: "Ik voel me heel moe en een beetje misselijk"
Jij: "Dat begrijp ik - vermoeidheid en misselijkheid zijn normaal in de eerste dagen. Probeer kleine slokjes gemberthee of water. Als de misselijkheid erger wordt, laat je zorgteam weten."

**Je doel:** Help ${userName || 'de patiënt'} hun dagdoelen te halen met simpele, praktische stappen.`;
}

// Enhanced tool definitions with granular data tracking
const tools = [
  {
    type: "function",
    name: "log_food",
    description: "Log voedselinname wanneer de patiënt eten of drinken noemt. Extraheer alle voedselitems met conservatieve eiwitschattingen volgens NEVO 2023 waarden.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "string" },
          description: "Lijst van voedselitems (bijv. 'gebakken eieren', 'toast', 'sinaasappelsap')"
        },
        meal_type: {
          type: "string",
          enum: ["breakfast", "lunch", "dinner", "snack"],
          description: "Type maaltijd indien genoemd of af te leiden uit context"
        },
        estimated_protein_grams: {
          type: "number",
          description: "Geschat totaal eiwit in grammen - wees conservatief, niet afronden naar boven"
        },
        estimated_calories: {
          type: "number",
          description: "Geschat totaal calorieën voor alle items"
        },
        protein_confidence: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Betrouwbaarheid van eiwitschatting: 'high' als exacte hoeveelheden genoemd, 'medium' als typische porties, 'low' als onduidelijk"
        },
        data_source: {
          type: "string",
          enum: ["patient_reported", "nevo_lookup"],
          description: "Bron van voedingswaarden: 'nevo_lookup' als NEVO waarden gebruikt, anders 'patient_reported'"
        }
      },
      required: ["items", "estimated_protein_grams", "protein_confidence"]
    }
  },
  {
    type: "function",
    name: "log_activity",
    description: "Log fysieke activiteit wanneer de patiënt beweging, wandelen, oefeningen of fysiotherapie noemt.",
    parameters: {
      type: "object",
      properties: {
        activity_type: {
          type: "string",
          description: "Type activiteit (bijv. 'wandelen', 'fysiotherapie', 'traplopen', 'stretchen')"
        },
        duration_minutes: {
          type: "number",
          description: "Duur in minuten indien genoemd"
        },
        intensity: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Intensiteitsniveau gebaseerd op beschreven activiteit"
        },
        step_count: {
          type: "number",
          description: "Geschat aantal stappen indien relevant (100 stappen per minuut wandelen)"
        },
        anabolic_window_timing: {
          type: "string",
          enum: ["pre_meal", "post_meal", "unrelated"],
          description: "Timing ten opzichte van maaltijden voor optimale eiwitopname"
        }
      },
      required: ["activity_type"]
    }
  },
  {
    type: "function",
    name: "log_symptom",
    description: "Log symptomen wanneer de patiënt beschrijft hoe zij zich voelen. Inclusief ernst en controleer op veiligheidszorgen.",
    parameters: {
      type: "object",
      properties: {
        symptoms: {
          type: "object",
          description: "Object met symptoomnamen als sleutels en ernst (1-10) als waarden. Bijv. {\"vermoeidheid\": 7, \"misselijkheid\": 4}",
          additionalProperties: { type: "number" }
        },
        safety_flags: {
          type: "array",
          items: { type: "string" },
          description: "Gedetecteerde veiligheidszorgen: 'koorts', 'rode_wond', 'ernstige_pijn', 'ademhalingsproblemen', 'aanhoudend_braken'"
        },
        sleep_quality: {
          type: "number",
          description: "Slaapkwaliteit (1-10) indien genoemd, voor vermoeidheidcorrelatie"
        },
        suggested_action: {
          type: "string",
          description: "Je aanbevolen actie voor de patiënt (bijv. 'rust nemen', 'contact opnemen met zorgteam', 'gemberthee proberen')"
        },
        notes: {
          type: "string",
          description: "Extra context over de symptomen"
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
    const { 
      voice = "shimmer", 
      recoveryContext,
      dailyStats = { protein: 0, calories: 0, steps: 0, activityMinutes: 0 },
      userName = "Patiënt"
    } = body;

    // Set targets from context or defaults
    const targets = {
      proteinTarget: recoveryContext?.proteinTarget || 90,
      calorieTarget: recoveryContext?.calorieTarget || 2000,
      stepTarget: recoveryContext?.stepTarget || 2000
    };

    // Build Dutch ZorgAssistent prompt with real-time stats
    const instructions = buildZorgAssistentPrompt(
      dailyStats,
      targets,
      recoveryContext?.contextType || "general",
      userName
    );

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
