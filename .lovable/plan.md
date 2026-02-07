
# Evidence-Based Cancer Recovery (ABC-TOM Integration)

## Overview
This upgrade transforms the Recovery section into a professional-grade tool for both **patients** and **clinicians**, introducing Evidence-Based Practice (EBP) logic and a specialized "Cancer & Surgical Recovery" mode with dual-layer outputs.

---

## Implementation Steps

### 1. Add "Cancer & Surgical Recovery" Context Card

**File:** `src/components/recovery/RecoveryContextSelection.tsx`

Add a new recovery context to the existing array:
- **ID:** `cancer_support`
- **Label:** "Cancer & Surgical Care"
- **Description:** "Safe nutrition for wound healing and immune support"
- **Icon:** Shield icon (imported from lucide-react)
- **Color:** A distinct color (e.g., `text-rose-500`)
- **Tips:**
  - "Prioritize food safety (cooked > raw) for low immunity"
  - "Focus on protein & zinc for surgical wound healing"
  - "Manage side effects like mucositis or taste changes"
  - "Immunonutrition with Arginine & Omega-3s supports recovery"

---

### 2. Add Clinician Mode Toggle

**File:** `src/pages/Recovery.tsx`

Add a toggle switch in the Recovery page header:

- New state: `isClinicianMode` (boolean, default: false)
- Position: Top-right of the page, after Navigation
- Label: "Clinician View" with a stethoscope icon
- Persist preference in localStorage for returning users
- The toggle will conditionally render clinical rationale cards when viewing recipes

---

### 3. Create Clinical Rationale Display Component

**New File:** `src/components/recovery/ClinicalRationale.tsx`

A new component to display evidence-based clinical information:

- **Display when:** `isClinicianMode` is true
- **Content structure:**
  - Topic heading
  - Mechanism explanation (technical, monospace styling)
  - Evidence grade badge (Grade A, B, C styling)
- **Features:**
  - Clean gray borders, professional styling
  - "Print for Chart" button that opens browser print dialog
  - Collapsible sections for each rationale topic

---

### 4. Update Generate Recipe Edge Function

**File:** `supabase/functions/generate-recipe/index.ts`

Upgrade the AI prompt to generate dual-layer outputs:

**New prompt elements:**
- Role: "ZorgAssistent AI, an Evidence-Based Clinical Nutritionist"
- Core knowledge: ERAS/ESPEN guidelines for post-operative recovery
- Dual output requirement:
  - `patient_tips`: Motivating, clear advice for patients
  - `clinical_rationale`: Technical data for clinicians with evidence grades

**New JSON structure returned:**
```text
{
  "title": "Recipe Name",
  "patient_tips": ["Easy to digest", "High protein for healing"],
  "clinical_rationale": [
    {
      "topic": "Wound Healing",
      "mechanism": "Provides essential amino acids for collagen synthesis",
      "evidence_grade": "Grade B (Clinical Consensus)"
    }
  ],
  // ... existing fields
}
```

**Context-specific rules for `cancer_support`:**
- Prioritize food safety (cooked over raw)
- Immunonutrition focus (Arginine, Omega-3s)
- Symptom management (mucositis, taste changes)
- Strict protein targets: 1.5g/kg body weight
- Use NEVO 2023 nutritional data where possible

---

### 5. Add BarrierTips Data for Cancer Support

**File:** `src/components/recovery/BarrierTips.tsx`

Add new entry to `barrierTipsData` for `cancer_support`:

- **Title:** "Cancer & Surgical Recovery Nutrition"
- **Description:** "Safe, healing-focused nutrition during treatment"
- **Tips:**
  - Food safety guidelines for immunocompromised patients
  - Wound healing nutrients (protein, zinc, vitamin C)
  - Managing treatment side effects
  - Importance of consistent protein intake
- **Food suggestions:** Cooked vegetables, lean proteins, eggs, fortified foods, bone broth, salmon, Greek yogurt, cooked fruits

---

### 6. Update Recipe Interface & Display

**File:** `src/pages/Recovery.tsx`

Extend the Recipe interface with new fields:
- `patient_tips: string[]`
- `clinical_rationale: Array<{ topic: string; mechanism: string; evidence_grade: string }>`

Update the recipe display section:
- **Default view:** Show `patient_tips` as friendly health insights (styled like current health_insights)
- **Clinician view:** Show additional "Clinical Mechanism & Evidence" section using the new ClinicalRationale component

---

### 7. Database Schema Update (Optional)

If saving recipes with clinical data to the gallery:
- Add `patient_tips` column (text array)
- Add `clinical_rationale` column (JSONB)
- These fields would be stored when adding recovery recipes to the community gallery

---

## User Flow Summary

```text
1. User enters Recovery section
   |
   +--> Accepts medical disclaimer
   |
2. Configures recovery goals (weight, protein target)
   |
3. Selects challenge context
   |    +-- Nausea Support
   |    +-- Low Appetite  
   |    +-- Energy Boost
   |    +-- Minimal Effort
   |    +-- Cancer & Surgical Care (NEW)
   |
4. Optional: Toggles "Clinician View"
   |
5. Adds ingredients
   |
6. Generates recipe with dual-layer output
   |
7. Views recipe:
   +-- Patient: Sees patient_tips as friendly insights
   +-- Clinician: Also sees clinical_rationale with evidence grades
   |
8. Optional: Prints clinical summary for medical chart
```

---

## Technical Details

### Files to Create:
| File | Purpose |
|------|---------|
| `src/components/recovery/ClinicalRationale.tsx` | Display clinical evidence cards |

### Files to Modify:
| File | Changes |
|------|---------|
| `src/components/recovery/RecoveryContextSelection.tsx` | Add cancer_support context card |
| `src/components/recovery/BarrierTips.tsx` | Add cancer_support tips data |
| `src/pages/Recovery.tsx` | Add clinician toggle, update Recipe interface, conditional rendering |
| `supabase/functions/generate-recipe/index.ts` | Add cancer_support context, dual-layer prompts |

### Dependencies:
- No new packages required
- Uses existing UI components (Switch, Card, Badge)
- Uses existing lucide-react icons (Shield, Stethoscope)

### Edge Function Changes:
- Enhanced prompt for Evidence-Based Practice
- New JSON fields: `patient_tips`, `clinical_rationale`
- Cancer-specific nutritional rules and safety guidelines

---

## Compliance Notes
- Medical disclaimer remains mandatory before accessing recovery tools
- Clinical rationale is clearly labeled as supportive guidance, not medical advice
- Evidence grades help clinicians understand the strength of recommendations
- "Print for Chart" feature supports clinical documentation workflows
