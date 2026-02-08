# ZorgAssistent Recovery Enhancement Plan

## Implementation Status: ✅ COMPLETE

---

## Features Implemented

### 1. Database Schema Enhancements ✅
Added new columns to support wearable-free activity tracking and cognitive light mode:

**activity_logs:**
- `movement_moments` - Times patient got up and moved 2+ minutes
- `longest_sitting_streak_min` - Longest uninterrupted sitting period
- `perceived_exertion_rpe` - Rate of Perceived Exertion 0-10
- `fatigue_score` - Fatigue level 0-10
- `pain_score` - Pain level 0-10
- `sleep_hours` - Hours of sleep last night
- `activity_state` - Calculated state (ADEQUATE, UNDERSTIMULATED, STALLING, etc.)

**profiles:**
- `cognitive_light_mode` - Simplified UI mode for brain fog patients
- `surgery_date` - For post-op week calculation
- `recovery_status` - Current phase: pre_op, post_op, chemotherapy

---

### 2. Activity State Engine ✅
**File:** `src/utils/activityStateEngine.ts`

Wearable-free inference engine with priority-ordered state rules:
1. DATA_SPARSE - Not enough data
2. OVERREACHED - High activity + poor recovery
3. FATIGUE_LIMITED - High fatigue/pain limits activity
4. STALLING - Long sedentary streaks (>90 min)
5. UNDERSTIMULATED - Too little activity
6. ADEQUATE - Meeting goals with good tolerance

Includes Dutch response phrases for each state.

---

### 3. Recovery Index (Herstelindex) ✅
**File:** `src/utils/recoveryIndex.ts`

Unified 0-100 score calculation:
- Protein Adherence: 33%
- Step/Activity Goal: 33%
- ADL Capability (based on activity state): 34%

Risk levels: low (70+), medium (50-70), high (<50)

---

### 4. Cognitive Light Mode UI ✅
**File:** `src/components/recovery/CognitiveLightModeUI.tsx`

Simplified "Low Power Mode" for patients with chemo brain/brain fog:
- Single "What to do now?" button
- Binary choices (Eat/Move/Rest)
- Voice-first interaction
- Memory aids with repeated instructions
- Big icons, large text, no graphs

Toggle available in Recovery page header ("Rustige Modus")

---

### 5. Voice AI Enhancements ✅
**File:** `supabase/functions/openai-realtime-session/index.ts`

Updated ZorgAssistent prompt with:
- Wearable-free activity check-in (3 questions)
- Cognitive Light Mode auto-detection
- Graduated Recovery Protocol (week-based targets)
- Activity state-aware responses

New tools added:
- `log_activity_check_in` - Wearable-free activity data
- `trigger_cognitive_light_mode` - Activate simplified UI

---

### 6. Recovery Balance Gauge ✅
**File:** `src/components/recovery/RecoveryBalanceGauge.tsx`

Visual gauge showing current activity state:
- Green Zone = ADEQUATE
- Orange Zone = STALLING / UNDERSTIMULATED
- Red Zone = OVERREACHED / FATIGUE_LIMITED

---

### 7. Herstelindex Card ✅
**File:** `src/components/recovery/HerstelindexCard.tsx`

Displays unified Recovery Index with:
- Large score display (0-100)
- Trend indicator
- Breakdown by protein/activity/ADL
- Risk level badge

---

### 8. Enhanced Clinician Dashboard ✅
**File:** `src/components/recovery/ClinicianDashboard.tsx`

New sections:
- Herstelindex and Recovery Balance at top
- Activity state history
- Weekly trend charts
- Safety alerts
- AI suggested actions

---

## Graduated Recovery Protocol

Activity targets based on post-op week:

| Week | Moments | Walks | Active Min | Target % |
|------|---------|-------|------------|----------|
| 1    | 6       | 3     | 15         | 50%      |
| 2    | 7       | 3     | 20         | 75%      |
| 3+   | 8       | 4     | 25         | 100%     |

---

## Voice Check-In Questions (Dutch)

1. "Hoe vaak ben je vandaag opgestaan om 2+ minuten te bewegen?"
2. "Wat was de langste tijd dat je achter elkaar hebt gezeten?"
3. "Hoe zwaar voelde je dag vandaag (0-10)?"

---

## Activity State Responses (Dutch)

| State | Response |
|-------|----------|
| UNDERSTIMULATED | "Je hebt vandaag nog weinig bewogen. Sta nu even op en loop 3–5 minuten." |
| STALLING | "Je zit al een tijd achter elkaar. Sta even 2 minuten op, dat helpt je herstel." |
| ADEQUATE | "Mooi, je beweegt regelmatig. Houd dit ritme vast." |
| FATIGUE_LIMITED | "Je bent moe vandaag. Kies voor rustig bewegen: even staan, paar passen, weer zitten." |
| OVERREACHED | "Je deed veel, maar je lichaam heeft ook rust nodig. Vandaag wat rustiger is oké." |

---

## Next Steps (Future Enhancements)

1. **Pre-Hab Mode** - Add pre-surgery toggle for building reserve capacity
2. **Immunonutrition Tracking** - Track Arginine/Omega-3 intake for first 14 days post-op
3. **Surgery Date Integration** - Auto-calculate post-op week from surgery_date
4. **ADL Milestones** - Weekly functional independence questions
5. **Adherence Alerts** - Proactive coaching if targets missed 2+ consecutive days
