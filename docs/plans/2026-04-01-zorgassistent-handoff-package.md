# ZorgAssistent Handoff Package

Date: 2026-04-01
Project: `ingredient-snap-craft`
Lovable project: `https://lovable.dev/projects/2b954398-0dfa-436f-9abd-017b6d009b31`

## Goal

Separate the consumer recipe product from the post-operative recovery support product at the experience level, while keeping the clinical reasoning layer explicit, source-linked, and auditable.

Recommended split:

- Lovable owns UI, workflows, navigation, forms, dashboards, and product shell changes.
- Repo code owns evidence registry, rule engine definitions, labels, scoring, validation, and clinician-comparison logic.

## Product Decision

The current app mixes three identities:

- `Recipe Creator`
- `Recipe Community`
- `ZorgAssistent` / recovery support

Recommendation:

- Keep the core app as a nutrition recipe generator.
- Position recovery support as a specialized sub-product or clearly separated mode.
- Do not let recovery, clinician view, and voice support dominate the default consumer funnel.

## Proposed App Restructure

### Core App

Keep in the core app:

- ingredient upload
- manual ingredient entry
- recipe context and health-goal selection
- recipe generation
- recipe saving and sharing
- community gallery
- sign-in and account basics

### Recovery Sub-Product

Move into the recovery sub-product:

- medical disclaimer
- recovery goal calculator
- symptom/challenge-specific recipe support
- patient-day logging
- clinician dashboard
- cognitive-light mode
- voice assistant
- clinical rationale and evidence UI

## UX Changes

### Core Funnel

Replace the current auto-generate flow with:

1. Upload photos or choose manual entry
2. Review and edit ingredients inline
3. Choose context and optional health goals
4. Review card with:
   - ingredients
   - selected context
   - selected goals
   - free generations remaining
5. One dominant `Generate Recipe` button

Post-generation actions:

- Save
- Start over
- Edit ingredients
- Try another context

### Recovery Funnel

Recovery first-run flow should be:

1. Disclaimer
2. Baseline goals
3. Today's main challenge
4. Recommended action
5. Recipe support and logging

Secondary features only after setup:

- clinician view
- cognitive-light mode
- voice assistant

### Acceptance Criteria

1. Context selection no longer triggers recipe generation.
2. Upload and selection controls are semantic and keyboard accessible.
3. API failures show inline recovery states, not toast-only states.
4. Recovery evidence UI only renders source-backed claims.
5. Gallery is secondary to generation on the homepage.

## Data Model

### Table: `patient_day_data`

One row per patient per calendar day.

Required fields:

- `id` uuid primary key
- `patient_id` uuid
- `care_path_id` uuid nullable
- `calendar_date` date
- `postop_day` integer
- `cancer_type` text
- `surgery_type` text
- `treatment_phase` text
- `weight_kg` numeric nullable
- `protein_target_g` numeric
- `calorie_target_kcal` numeric
- `protein_actual_g` numeric nullable
- `calories_actual_kcal` numeric nullable
- `steps_actual` integer nullable
- `activity_minutes` integer nullable
- `sleep_hours` numeric nullable
- `hydration_ml` numeric nullable
- `nausea_score` integer nullable
- `pain_score` integer nullable
- `fatigue_score` integer nullable
- `appetite_score` integer nullable
- `vomiting_flag` boolean default false
- `constipation_flag` boolean default false
- `diarrhea_flag` boolean default false
- `fever_flag` boolean default false
- `free_text_notes` text nullable
- `missingness_flag` boolean default false
- `created_at` timestamptz default now()
- `updated_at` timestamptz default now()

### Table: `patient_day_labels`

Clinician or adjudicated labels for validation.

Required fields:

- `id` uuid primary key
- `patient_day_id` uuid references `patient_day_data(id)`
- `labeled_by` uuid nullable
- `main_problem` text
- `secondary_problem` text nullable
- `urgency` text
- `best_action` text
- `actions_to_avoid` text[] default '{}'
- `best_action_reason` text
- `clinician_confidence` integer nullable
- `algorithm_prediction` jsonb nullable
- `agreement_class` text nullable
- `unsafe_mismatch` boolean default false
- `created_at` timestamptz default now()

### Table: `evidence_sources`

- `id` uuid primary key
- `citation_key` text unique
- `title` text
- `year` integer nullable
- `source_type` text
- `population` text nullable
- `intervention` text nullable
- `finding_summary` text
- `evidence_strength` text
- `url` text nullable
- `local_path` text nullable

### Table: `reasoning_rules`

- `id` uuid primary key
- `rule_key` text unique
- `rule_name` text
- `rule_version` text
- `condition_json` jsonb
- `recommended_action` text
- `actions_to_avoid` text[] default '{}'
- `rationale` text
- `source_ids` uuid[] default '{}'
- `active` boolean default true
- `created_at` timestamptz default now()

## Label Taxonomy

### `main_problem`

- `protein_intake_low`
- `calorie_intake_low`
- `combined_low_intake`
- `low_activity`
- `high_symptom_burden`
- `nausea_limiting_intake`
- `pain_limiting_activity`
- `fatigue_limiting_intake_or_activity`
- `low_appetite_limiting_intake`
- `possible_dehydration`
- `safety_escalation_needed`
- `stable_progress`
- `insufficient_data`

### `urgency`

- `routine`
- `same_day_attention`
- `urgent_clinical_review`

### `best_action`

- `encourage_high_protein_snack`
- `recommend_high_energy_small_meal`
- `suggest_protein_shake_or_oral_nutrition_supplement`
- `recommend_short_walk`
- `recommend_light_activity_breaks`
- `suggest_rest_and_recovery_pacing`
- `suggest_nausea_friendly_foods`
- `suggest_low_effort_meal_strategy`
- `prompt_hydration_support`
- `prompt_symptom_check_in`
- `alert_care_team`
- `dietitian_referral`
- `physio_or_activity_adjustment`
- `no_change_continue_plan`

### `actions_to_avoid`

- `avoid_raw_or_high_risk_foods`
- `avoid_large_meals`
- `avoid_greasy_foods`
- `avoid_overexertion`
- `avoid_delayed_escalation`
- `avoid_generic_reassurance_only`

### `agreement_class`

- `exact_match`
- `acceptable_alternative`
- `partial_match`
- `unsafe_mismatch`

## Study Design Support

### Study 1: Feasibility

Minimum required data:

- meal/protein logging completeness
- wearable/step data completeness
- missingness by patient-day
- adherence rate
- usability score

### Study 2: Clinical Reasoning Validation

Unit of analysis:

- 100 patient-days

Clinicians label:

- main problem
- urgency
- best action
- actions to avoid
- confidence 1-5

Compare:

- algorithm vs clinician
- exact match
- acceptable alternative
- unsafe mismatch

### Study 3: Pilot RCT

Arms:

- tracking-only app
- reasoning-enabled app

Primary outcomes:

- protein target attainment
- recovery in steps/activity
- adherence

Secondary outcomes:

- complications
- readmissions
- symptom burden

## Evidence and Source Strategy

Current useful local materials:

- `NCP-37-183.pdf`
- `PostoperativeRecoverySupport.json`
- `PostoperativeRecoverySupport_v3.json`
- `ZorgAssistent_PatientVoice_NL_v4.json`
- current recovery prompt logic in `supabase/functions/generate-recipe/index.ts`

Current problem:

- the app uses broad ERAS/ESPEN-style claims and synthetic evidence grades
- those claims are not yet stored as explicit source-linked rules

Required change:

- every clinical claim shown in UI should map to one or more `evidence_sources`
- every recommendation should map to one or more `reasoning_rules`
- `Grade A/B/C` should not be shown unless grounded in a stored source decision

## Voice Advice Policy

The voice assistant should use three explicit advice modes:

- `coach`
- `specific_action`
- `escalate`

Specific action advice is allowed only when a rule evaluation explicitly unlocks it.

Examples:

- `eat_protein_now`
- `take_small_energy_dense_snack`
- `walk_3_minutes_now`
- `drink_now`
- `contact_care_team_now`

The LLM may handle tone and phrasing, but the allowed action and escalation boundary should come from structured rule evaluation rather than prompt improvisation.

## Initial Rule Candidates

### Rule: low protein intake

Condition:

- `protein_actual_g < 0.7 * protein_target_g`

Action:

- `suggest_protein_shake_or_oral_nutrition_supplement`

Avoid:

- `avoid_generic_reassurance_only`

### Rule: nausea limiting intake

Condition:

- `nausea_score >= 6` and `protein_actual_g < protein_target_g`

Action:

- `suggest_nausea_friendly_foods`

Avoid:

- `avoid_large_meals`
- `avoid_greasy_foods`

### Rule: low activity with fatigue

Condition:

- `steps_actual < target_steps` and `fatigue_score >= 6`

Action:

- `recommend_light_activity_breaks`

Avoid:

- `avoid_overexertion`

### Rule: safety escalation

Condition:

- `fever_flag = true` or `vomiting_flag = true` with inability to maintain intake

Action:

- `alert_care_team`

Avoid:

- `avoid_delayed_escalation`

## Lovable Handoff

Lovable should implement:

- homepage and funnel redesign
- recovery shell separation
- navigation updates
- data-entry forms and dashboards
- empty/loading/error states
- improved patient-facing Dutch and English copy

Lovable should not own:

- source interpretation
- evidence grading
- rule authoring
- clinician-validation scoring
- audit trail logic

## Lovable Prompt Draft

Use this as the first implementation prompt in Lovable:

```text
Refactor this app into two clearly separated product surfaces within the same codebase:

1. Core product: nutrition recipe generator
2. Recovery product: post-operative recovery support

Do not invent new clinical reasoning. Focus on product structure, UX, and data-entry workflows only.

Goals:
- Unify product identity across navigation, metadata, auth, and main screens.
- Remove auto-generation on context selection. Users must review ingredients, context, goals, and free usage before pressing a single primary Generate button.
- Improve accessibility by replacing clickable div/card/badge controls with semantic controls.
- Make the homepage prioritize recipe creation over community browsing.
- Move the community gallery lower on the page or behind a secondary tab.
- Give the recovery flow its own shell, naming, and navigation treatment.
- Keep the recovery first-run flow limited to disclaimer, goals, challenge, recommendation, recipe/logging tools.
- Move clinician mode, cognitive-light mode, and voice assistant behind secondary entry points after setup.
- Add strong empty, loading, and error states for upload, generation, and gallery flows.
- Preserve Supabase integration patterns already present in the repo.

Screens/workflows to implement:
- Core homepage funnel redesign
- Recovery landing and step flow redesign
- Patient-day data entry screens
- Clinician review dashboard shell

Constraints:
- Do not add or imply unsupported evidence grades.
- Do not rewrite the medical logic layer.
- Keep placeholders where rule-engine outputs will later be injected from code.

Deliverables:
- updated routing and navigation
- improved homepage hierarchy
- accessible onboarding controls
- recovery sub-product shell
- forms/tables/components for patient_day_data capture
- clean loading/error/empty states
```

## Recommendation

Commit this package first.

Then:

1. Use the package as the source of truth.
2. Hand the Lovable prompt to Lovable for the shell and workflow work.
3. Review the generated changes in git.
4. Implement the reasoning layer in code, not in Lovable prompts.
