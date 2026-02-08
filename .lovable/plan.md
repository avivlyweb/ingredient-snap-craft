

# Voice Companion Enhancement Plan

## Overview

Based on comparing your detailed specifications with the current implementation, here are the key improvements to upgrade the ZorgAssistent Voice Companion to a more sophisticated, Dutch-localized, and context-aware system.

---

## Current State Analysis

The voice system already has:
- WebRTC connection to OpenAI Realtime API
- Basic ZorgAssistent persona with safety protocols
- Tool definitions for `log_food`, `log_activity`, `log_symptom`
- Clinician Dashboard with daily summaries
- Floating voice button on Recovery page

**What's Missing from Your Specifications:**

| Feature | Status | Priority |
|---------|--------|----------|
| Dutch-only persona with real-time patient stats | Not implemented | High |
| Dynamic context injection (protein %, steps, etc.) | Partially done | High |
| "Adherence Gap" strict nutrition estimates | Not implemented | Medium |
| Fatigue-aware "Seated Prep" recipe suggestions | Not implemented | Medium |
| Activity pacing (anabolic window) | Not implemented | Low |
| Steps tracking integration | Not implemented | Medium |

---

## Implementation Steps

### 1. Upgrade ZorgAssistent System Prompt (Dutch Personality)

**File:** `supabase/functions/openai-realtime-session/index.ts`

Replace the current English-focused prompt with the exact Dutch personality specification:

**New Prompt Structure:**
```text
Je bent ZorgAssistent, een Nederlandstalige spraakassistent 
die patienten ondersteunt bij het herstel na een operatie 
aan het maag-darmkanaal of de longen in Amsterdam UMC.

### Jouw Rol:
- Korte, gesproken antwoorden (Max 3 zinnen)
- Taal: Enkel in het Nederlands
- Toon: Ondersteunend, motiverend, en waarderend

### Context & Regels (ReasoningCore v4):
- Voeding: Als eiwit < 50% van doel, adviseer een snack
- Beweging: Als stappen laag zijn, adviseer wandeling
- Slaap: Koppel slechte slaap aan advies voor rust

### Huidige Patient Status:
- Naam: ${userName}
- Eiwit Vandaag: ${dailyProtein}g / ${proteinTarget}g
- Calorien: ${dailyCalories} / ${calorieTarget}
- Stappen: ${dailySteps} / ${stepTarget}
```

---

### 2. Real-Time Patient Status Injection

**Files:** 
- `src/hooks/useVoiceConversation.ts`
- `supabase/functions/openai-realtime-session/index.ts`

Before connecting to the Realtime API, fetch today's aggregated data:

**New Data Flow:**
```text
1. Client requests voice session
   |
   v
2. Edge function queries today's food_logs, activity_logs
   |
   v
3. Calculate: totalProtein, totalCalories, totalSteps
   |
   v
4. Inject into system prompt dynamically
   |
   v
5. AI knows: "Patient at 45g/90g protein (50%)"
```

**Changes to Edge Function:**
- Accept `dailyStats` in request body
- Calculate percentages and inject into prompt
- AI can now give contextual advice: "Je zit op de helft van je eiwitdoel!"

---

### 3. Add Steps Tracking to Database

**Database Migration:**

Add new columns to `activity_logs`:
- `step_count` (integer) - for step-based activities

Create optional `daily_summaries` table:
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to user |
| date | date | The day |
| total_protein | numeric | Sum from food_logs |
| total_calories | numeric | Sum from food_logs |
| total_steps | integer | Sum from activity_logs |
| total_activity_minutes | integer | Sum from activity_logs |

This enables fast lookups for the voice prompt injection.

---

### 4. Implement "Adherence Gap" Logic

**File:** `supabase/functions/openai-realtime-session/index.ts`

Add explicit instruction to the AI prompt:

```text
**CRITICAL - Adherence Gap Protocol:**
Patients overestimate their protein intake. When they describe food:
- Be conservative with estimates
- If it sounds like 15g of protein, say 15g (do NOT round up)
- Use NEVO 2023 values, not optimistic assumptions
- Example: "1 egg = 6g protein" not "7-8g"
```

This makes the AI a stricter, more accurate nutritional scribe.

---

### 5. Fatigue-Aware Recipe Suggestions

**File:** `supabase/functions/openai-realtime-session/index.ts`

Add conditional logic to the prompt based on `contextType`:

```text
**Context-Specific Rules:**
If contextType is 'cancer_support' OR 'energy_boost':
  - Check if patient mentions fatigue or tiredness
  - If yes, suggest "Seated Prep" recipes (minimal standing)
  - Example: "Overweeg een maaltijd die je zittend kunt bereiden"
```

---

### 6. Enhanced Tool Definitions

**File:** `supabase/functions/openai-realtime-session/index.ts`

Upgrade tool parameters for more granular data:

**log_food improvements:**
- Add `protein_estimate_confidence`: "low" | "medium" | "high"
- Add `data_source`: "patient_reported" | "nevo_lookup"

**log_activity improvements:**
- Add `step_count` parameter
- Add `anabolic_window_timing`: "pre_meal" | "post_meal" | "unrelated"

**log_symptom improvements:**
- Add `sleep_quality` (1-10) for fatigue correlation
- Add `suggested_action` for AI to record its own advice

---

### 7. Update Client to Fetch Daily Stats Before Connection

**File:** `src/hooks/useVoiceConversation.ts`

Before calling `openai-realtime-session`, query today's logs:

```text
1. Query food_logs for today -> sum protein, calories
2. Query activity_logs for today -> sum steps, minutes
3. Pass as dailyStats to edge function
4. AI receives real-time context
```

This ensures every conversation starts with accurate patient status.

---

### 8. Clinician Dashboard Enhancements

**File:** `src/components/recovery/ClinicianDashboard.tsx`

Add new sections based on specification:

**New Features:**
- Steps tracking graph (if steps data exists)
- "AI Suggested Actions" section (from `suggested_action` field)
- Sleep quality correlation (if logged)
- Weekly trend mini-charts using recharts

---

## Technical Details

### Files to Modify:
| File | Changes |
|------|---------|
| `supabase/functions/openai-realtime-session/index.ts` | Dutch prompt, real-time stats injection, enhanced tools |
| `src/hooks/useVoiceConversation.ts` | Fetch daily stats before connection |
| `src/components/recovery/ClinicianDashboard.tsx` | Steps display, AI actions section |
| `supabase/functions/voice-log-health/index.ts` | Handle new tool parameters |

### Database Changes:
- Add `step_count` column to `activity_logs`
- Add `suggested_action` column to `symptom_logs`
- Optional: Create `daily_summaries` table for fast aggregation

### No New Dependencies Required

---

## User Flow After Enhancement

```text
Patient opens Recovery section
        |
        v
Opens Voice Assistant
        |
        v
System fetches today's data:
- Protein: 32g / 90g (36%)
- Calories: 800 / 2000
- Steps: 500 / 2000
        |
        v
ZorgAssistent greets in Dutch:
"Goedemorgen! Je zit nu op 36% van je eiwit. 
Wat heb je vandaag al gegeten?"
        |
        v
Patient: "Ik heb twee eieren gegeten"
        |
        v
ZorgAssistent (strict estimate):
"Prima! Dat is ongeveer 12 gram eiwit. 
Je staat nu op 44g - nog 46g te gaan.
Overweeg kwark als tussendoortje?"
        |
   (Behind scenes: log_food with 
    estimated_protein: 12, confidence: "high")
```

---

## Summary of Improvements

1. **Dutch-First Personality** - Complete NL-only persona with short, spoken responses
2. **Real-Time Context** - AI knows current protein/calorie/step progress
3. **Strict Nutrition Tracking** - "Adherence Gap" protocol prevents over-estimation
4. **Smart Suggestions** - Context-aware tips (seated prep, snacks, hydration)
5. **Enhanced Logging** - More granular data for clinical insights
6. **Steps Integration** - Track mobility alongside nutrition

