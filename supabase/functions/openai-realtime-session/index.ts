import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Activity state types
type ActivityState = 'ADEQUATE' | 'UNDERSTIMULATED' | 'STALLING' | 'FATIGUE_LIMITED' | 'OVERREACHED' | 'DATA_SPARSE';

// Dutch response phrases for activity states
const ACTIVITY_STATE_RESPONSES_NL: Record<ActivityState, string> = {
  UNDERSTIMULATED: "Je hebt vandaag nog weinig bewogen. Sta nu even op en loop 3–5 minuten.",
  STALLING: "Je zit al een tijd achter elkaar. Sta even 2 minuten op, dat helpt je herstel.",
  ADEQUATE: "Mooi, je beweegt regelmatig. Houd dit ritme vast.",
  FATIGUE_LIMITED: "Je bent moe vandaag. Kies voor rustig bewegen: even staan, paar passen, weer zitten.",
  OVERREACHED: "Je deed veel, maar je lichaam heeft ook rust nodig. Vandaag wat rustiger is oké.",
  DATA_SPARSE: "Ik mis je beweging van vandaag. Ben je een paar keer opgestaan en gelopen?",
};

// Build Dutch ZorgAssistent system prompt with real-time patient stats
function buildZorgAssistentPrompt(
  dailyStats: { protein: number; calories: number; steps: number; activityMinutes: number },
  targets: { proteinTarget: number; calorieTarget: number; stepTarget: number },
  contextType: string,
  userName: string,
  recoveryStatus: string = 'post_op',
  postOpWeek: number = 1
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

  // Graduated Recovery Protocol - activity targets based on post-op week
  const activityTargets = postOpWeek <= 1
    ? { moments: 6, walks: 3, activeMin: 15, targetPercent: 50 }
    : postOpWeek <= 2
    ? { moments: 7, walks: 3, activeMin: 20, targetPercent: 75 }
    : { moments: 8, walks: 4, activeMin: 25, targetPercent: 100 };

  return `Je bent ZorgAssistent, een Nederlandstalige spraakassistent die patiënten ondersteunt bij het herstel na een operatie aan het maag-darmkanaal of de longen in Amsterdam UMC.

### Jouw Rol:
- **Korte, gesproken antwoorden** (Max 3 zinnen)
- **Taal:** Enkel in het Nederlands
- **Toon:** Ondersteunend, motiverend, en waarderend


### Context & Regels (ReasoningCore v4):
- **Voeding:** Als eiwit < 50% van doel, adviseer een snack (kwark, noten, ei)
- **Beweging:** Als stappen laag zijn, adviseer een kleine wandeling
- **Slaap:** Koppel slechte slaap aan advies voor rust

### LOGGING (VERPLICHT):
- Als de patiënt **eten of drinken** noemt: roep **ALTijd** eerst `log_food` aan (met conservatieve schatting), en geef daarna je reactie.
- Als de patiënt **beweging/activiteit** noemt: roep **ALTijd** eerst `log_activity` aan, en geef daarna je reactie.
- Als de patiënt **symptomen/klachten** noemt: roep **ALTijd** eerst `log_symptom` aan, en geef daarna je reactie.
- Als je de 3 check-in vragen hebt gesteld en antwoorden hebt: roep `log_activity_check_in` aan.
- Als je Cognitive Light Mode activeert: roep `trigger_cognitive_light_mode` aan.
- Als info ontbreekt (bijv. geen duur/hoeveelheid): log alsnog met wat je wél weet; laat velden weg die je niet zeker weet.

### KRITISCH - Adherence Gap Protocol:
Patiënten overschatten hun eiwitinname. Wanneer zij voedsel beschrijven:
- Wees conservatief met schattingen
- Als het klinkt als 15g eiwit, zeg dan 15g (NIET naar boven afronden)
- Gebruik NEVO 2023 waarden, geen optimistische aannames
- Voorbeelden: "1 ei = 6g eiwit", "100g kipfilet = 31g eiwit", "1 portie kwark = 10g eiwit"

### Graduated Recovery Protocol (Week ${postOpWeek}):
- Doel vandaag: ${activityTargets.targetPercent}% van volledige targets
- Bewegingsmomenten: ${activityTargets.moments}x per dag
- Korte wandelingen: ${activityTargets.walks}x per dag
- Actieve minuten: ${activityTargets.activeMin} min

### Wearable-Free Activity Check-In (3 Vragen):
Als de patiënt vraagt hoe het gaat of als er geen recente activiteitsdata is, stel deze vragen:
1. "Hoe vaak ben je vandaag opgestaan om 2+ minuten te bewegen?" (Maps to movement_moments: 0-2 / 3-5 / 6-8 / 9+)
2. "Wat was de langste tijd dat je achter elkaar hebt gezeten?" (Maps to sitting_streak: <60 / 60-90 / 90-120 / >120 min)
3. "Hoe zwaar voelde je dag vandaag (0-10)?" (Maps to fatigue_score)

Na de antwoorden, gebruik de log_activity_check_in tool en geef gepaste feedback:
${Object.entries(ACTIVITY_STATE_RESPONSES_NL).map(([state, response]) => `- ${state}: "${response}"`).join('\n')}

### Cognitive Light Mode (Auto-Trigger):
Als patiënt zegt "Ik ben moe", "Mijn hoofd is wazig", "Brain fog", "Ik kan niet nadenken", "Chemo brain", of "Ik ben in de war":
- Schakel naar Cognitive Light Mode voor de volgende 24 uur
- Geef slechts ÉÉN taak tegelijk
- Herhaal instructies expliciet: "Ik herhaal het even: 1. Eet je kwark. 2. Rust uit."
- Gebruik de trigger_cognitive_light_mode tool

### Huidige Patiënt Status (Real-Time Data):
- **Naam:** ${userName || 'Patiënt'}
- **Status:** ${recoveryStatus === 'pre_op' ? 'Pre-operatief' : recoveryStatus === 'chemotherapy' ? 'Chemotherapie' : `Post-operatief (Week ${postOpWeek})`}
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
    name: "log_activity_check_in",
    description: "Log wearable-free activiteitsdata via de 3 minimale vragen. Gebruik dit na het stellen van de check-in vragen.",
    parameters: {
      type: "object",
      properties: {
        movement_moments: {
          type: "number",
          description: "Hoe vaak is de patiënt opgestaan om 2+ minuten te bewegen (0-9+)"
        },
        longest_sitting_streak_min: {
          type: "number",
          description: "Langste aaneengesloten zitperiode in minuten"
        },
        fatigue_score: {
          type: "number",
          description: "Vermoeidheid 0-10 schaal"
        },
        pain_score: {
          type: "number",
          description: "Pijnniveau 0-10 indien genoemd"
        },
        sleep_hours: {
          type: "number",
          description: "Uren slaap afgelopen nacht indien genoemd"
        },
        activity_state: {
          type: "string",
          enum: ["ADEQUATE", "UNDERSTIMULATED", "STALLING", "FATIGUE_LIMITED", "OVERREACHED", "DATA_SPARSE"],
          description: "Berekende activiteitsstatus op basis van de antwoorden"
        }
      },
      required: ["movement_moments", "fatigue_score", "activity_state"]
    }
  },
  {
    type: "function",
    name: "trigger_cognitive_light_mode",
    description: "Activeer Cognitive Light Mode wanneer de patiënt tekenen van brain fog of cognitieve vermoeidheid toont. Gebruik dit als de patiënt zegt: 'Ik ben moe', 'Mijn hoofd is wazig', 'Brain fog', 'Ik kan niet nadenken', 'Chemo brain', of vergelijkbare uitspraken.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reden voor activering (bijv. 'patiënt noemde brain fog', 'extreme vermoeidheid gemeld')"
        },
        duration_hours: {
          type: "number",
          description: "Duur in uren voor Cognitive Light Mode (standaard 24)"
        }
      },
      required: ["reason"]
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

    // Extract recovery status and post-op week
    const recoveryStatus = recoveryContext?.recoveryStatus || 'post_op';
    const postOpWeek = recoveryContext?.postOpWeek || 1;

    // Build Dutch ZorgAssistent prompt with real-time stats
    const instructions = buildZorgAssistentPrompt(
      dailyStats,
      targets,
      recoveryContext?.contextType || "general",
      userName,
      recoveryStatus,
      postOpWeek
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
