

# ZorgAssistent Voice Companion (OpenAI Realtime API)

## Overview
This feature adds a voice interface to the app using **OpenAI's Realtime API with WebRTC**, transforming it into an active "Recovery Companion" that monitors Food, Activity, and Symptoms through natural conversation.

---

## Important: API Key Requirement

The OpenAI Realtime API requires a separate **OpenAI API key** (not available through Lovable AI gateway). You will need to:

1. Have an OpenAI account with API access
2. Enable the Realtime API (currently in beta)
3. Provide your OpenAI API key when prompted during implementation

The implementation will use the secure **ephemeral token** pattern - your API key stays on the server, while short-lived tokens (60 second TTL) are sent to the client for WebRTC connections.

---

## Implementation Steps

### 1. Database Schema for Health Logging

Create three new tables to store voice-logged health data:

**food_logs table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to user |
| items | text[] | Food items logged |
| meal_type | text | breakfast/lunch/dinner/snack |
| estimated_protein | numeric | AI-estimated protein (g) |
| estimated_calories | numeric | AI-estimated calories |
| logged_via | text | 'voice' or 'manual' |
| transcript | text | Original user speech |
| created_at | timestamp | Log timestamp |

**activity_logs table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to user |
| activity_type | text | walking/exercise/physio/etc |
| duration_minutes | integer | Duration |
| intensity | text | low/medium/high |
| notes | text | Additional details |
| logged_via | text | 'voice' or 'manual' |
| transcript | text | Original user speech |
| created_at | timestamp | Log timestamp |

**symptom_logs table:**
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Reference to user |
| symptoms | jsonb | {nausea: 1-10, fatigue: 1-10, pain: 1-10, ...} |
| safety_flags | text[] | fever/red_wound/severe_pain (triggers safety alert) |
| ai_response | text | What ZorgAssistent advised |
| logged_via | text | 'voice' or 'manual' |
| transcript | text | Original user speech |
| created_at | timestamp | Log timestamp |

Each table will have RLS policies requiring user authentication.

---

### 2. Edge Function for Ephemeral Token Generation

**New file:** `supabase/functions/openai-realtime-session/index.ts`

This backend function:
1. Receives request from authenticated client
2. Calls OpenAI's `/v1/realtime/sessions` endpoint with your API key
3. Returns an ephemeral token (valid 60 seconds) to the client
4. Includes the ZorgAssistent persona instructions in the session config

The session configuration will include:
- Voice: A warm, empathetic voice suitable for patient care
- Instructions: Full ZorgAssistent PatientVoice persona
- Tools: `log_food`, `log_activity`, `log_symptom` function definitions

---

### 3. Edge Function for Data Logging

**New file:** `supabase/functions/voice-log-health/index.ts`

This function handles the actual database inserts when the AI triggers tool calls:
- Validates the incoming data
- Checks for safety flags (fever, red wound, severe pain)
- Stores the log in the appropriate table
- Returns confirmation for the AI to speak back

---

### 4. Voice Assistant React Component

**New file:** `src/components/voice/VoiceAssistant.tsx`

Core component with:
- **Push-to-talk button**: Recording only while button is held (privacy-first)
- **WebRTC connection management**: Uses RTCPeerConnection for low-latency audio
- **Visual feedback**: Waveform animation during listening/speaking
- **Status indicators**: Connected, Listening, Processing, Speaking
- **Transcript display**: Shows what was heard and AI responses

**New file:** `src/components/voice/VoiceButton.tsx`

Floating action button component:
- Fixed position at bottom-right of screen
- Microphone icon with pulse animation when active
- Expands to show VoiceAssistant when clicked
- Accessible on all pages (Recovery section primarily)

---

### 5. Voice Conversation Hook

**New file:** `src/hooks/useVoiceConversation.ts`

Custom hook managing:
- Ephemeral token fetching
- WebRTC peer connection setup
- Audio stream handling (microphone input, AI output)
- Data channel for events (tool calls, transcripts)
- Connection state management
- Cleanup on unmount

Flow:
```text
1. User holds microphone button
2. Hook requests ephemeral token from edge function
3. WebRTC connection established with OpenAI
4. Audio streams bidirectionally
5. AI triggers tool calls (log_food, etc.)
6. Tool results sent back to AI
7. AI confirms action verbally
8. Connection closed when button released
```

---

### 6. AI Tool Definitions (Function Calling)

The OpenAI Realtime session will have these tools configured:

**log_food:**
```text
{
  name: "log_food",
  description: "Log food intake when patient mentions eating",
  parameters: {
    items: string[],
    meal_type: "breakfast" | "lunch" | "dinner" | "snack",
    estimated_protein_grams: number,
    estimated_calories: number
  }
}
```

**log_activity:**
```text
{
  name: "log_activity", 
  description: "Log physical activity when patient mentions movement",
  parameters: {
    activity_type: string,
    duration_minutes: number,
    intensity: "low" | "medium" | "high"
  }
}
```

**log_symptom:**
```text
{
  name: "log_symptom",
  description: "Log symptoms when patient describes how they feel",
  parameters: {
    symptoms: { [symptom: string]: 1-10 },
    safety_flags: string[] // "fever", "red_wound", "severe_pain"
  }
}
```

---

### 7. ZorgAssistent Persona Configuration

The AI will be configured with these instructions:

**Core Identity:**
- Name: ZorgAssistent
- Role: Empathetic Dutch Recovery Companion
- Tone: Warm, encouraging, clinically informed but patient-friendly
- Language: Dutch or English based on user preference

**Behavioral Rules:**
- Always acknowledge what the patient said
- Extract and log data silently (don't announce "I'm logging...")
- Provide relevant tips from recovery protocols
- Check protein intake against daily target
- Immediately escalate safety concerns (fever, wound issues)

**Context Awareness:**
- Access to user's recovery goals (protein target, calorie target)
- Knowledge of their selected challenge (nausea, cancer support, etc.)
- References ERAS/ESPEN guidelines for advice

---

### 8. Safety Net Protocol

When the AI detects safety flags:

**Trigger words:** "fever", "temperature", "hot", "red wound", "infected", "pus", "severe pain", "can't breathe"

**Response:**
1. AI immediately acknowledges concern
2. Logs symptom with safety_flag=true
3. Speaks clear escalation message: "I'm concerned about what you're describing. Please contact your care team or call [emergency number] right away."
4. Optionally: Displays emergency contact card in UI

---

### 9. Clinician Dashboard Component

**New file:** `src/components/recovery/ClinicianDashboard.tsx`

When Clinician Mode is enabled, show a new "Daily Rounding Summary" section:

**Data Aggregation:**
- Query food_logs, activity_logs, symptom_logs for the day
- Calculate total protein vs. target
- Aggregate symptoms into a cloud/list

**Display Sections:**
- **Nutritional Trend:** Progress bar and mini-chart (protein intake over time)
- **Symptom Summary:** Tags showing reported symptoms with severity
- **Activity Level:** Summary of movement (sedentary/light/active)
- **AI Conversation Notes:** Key excerpts from voice interactions
- **Safety Alerts:** Highlighted section if any flags were triggered

---

### 10. Privacy & Consent Implementation

**Consent Flow:**
1. First time using voice: Show consent modal explaining what happens
2. Explain: "Recording only while button held, audio is not stored"
3. User must explicitly accept before microphone access is requested
4. Store consent acknowledgment in localStorage

**Privacy Features:**
- Push-to-talk only (no always-listening)
- Raw audio is streamed but not stored
- Only transcripts/summaries are saved
- User can delete their logs anytime

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/openai-realtime-session/index.ts` | Generate ephemeral tokens |
| `supabase/functions/voice-log-health/index.ts` | Handle AI tool calls, save logs |
| `src/components/voice/VoiceAssistant.tsx` | Main voice interface component |
| `src/components/voice/VoiceButton.tsx` | Floating microphone FAB |
| `src/components/voice/VoiceWaveform.tsx` | Visual audio feedback |
| `src/components/voice/VoiceConsentModal.tsx` | Privacy consent dialog |
| `src/components/recovery/ClinicianDashboard.tsx` | Daily rounding summary |
| `src/hooks/useVoiceConversation.ts` | WebRTC + Realtime API logic |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Recovery.tsx` | Add VoiceButton, add ClinicianDashboard for clinician mode |
| `src/components/Navigation.tsx` | Optional: Add voice indicator |
| `supabase/config.toml` | Add new edge functions |

---

## User Flow Summary

```text
Patient opens Recovery section
        |
        v
Floating mic button visible in corner
        |
        v
Patient holds button and speaks:
"I had scrambled eggs and toast for breakfast"
        |
        v
ZorgAssistent responds:
"Great choice! That's about 18g of protein. 
You're at 35% of your daily target. Keep it up!"
        |
   (Behind scenes: log_food tool called, 
    data saved to food_logs table)
        |
        v
Later, patient says:
"I feel really tired and a bit dizzy"
        |
        v
ZorgAssistent responds:
"I understand, fatigue can be common during recovery.
Make sure you're staying hydrated. How's your pain level?"
        |
   (Behind scenes: log_symptom called with 
    fatigue=high, dizziness=moderate)
        |
        v
Clinician enables Clinician Mode
        |
        v
Dashboard shows:
- Protein: 45g / 90g target
- Symptoms: fatigue (high), dizziness (moderate)
- Activity: Light (10 min walking)
- AI Notes: "Suggested hydration for fatigue"
```

---

## API Key Setup

During implementation, you'll be prompted to add your OpenAI API key:

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key with Realtime API access
3. When prompted in Lovable, enter your key as `OPENAI_API_KEY`

The key will be stored securely as a backend secret and never exposed to the client.

---

## Notes on Cost & Usage

- OpenAI Realtime API is billed per minute of audio
- Ephemeral tokens have 60-second TTL for security
- Push-to-talk design minimizes accidental usage
- Consider adding usage tracking/limits for production

