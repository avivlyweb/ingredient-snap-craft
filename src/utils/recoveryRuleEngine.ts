import type { PatientDaySnapshot, RuleEvaluation } from "@/types/recoveryReasoning";

const RULE_SOURCE_IDS = {
  protein: ["espen-postop-protein", "postop-support-v3"],
  calories: ["postop-support-v3"],
  activity: ["ncp-37-183", "postop-support-v3"],
  hydration: ["postop-support-v3"],
  escalation: ["voice-safety-protocol"],
  coaching: ["patient-voice-nl-v4"],
} as const;

export function evaluateRecoveryRules(snapshot: PatientDaySnapshot): RuleEvaluation {
  if (
    snapshot.feverFlag ||
    snapshot.woundConcernFlag ||
    snapshot.breathingConcernFlag ||
    snapshot.severePainFlag ||
    snapshot.persistentVomitingFlag
  ) {
    return {
      adviceMode: "escalate",
      actionKey: "contact_care_team_now",
      rationale: "Red-flag symptoms are present and require direct care-team follow-up.",
      sourceIds: [...RULE_SOURCE_IDS.escalation],
      ruleKey: "safety-escalation",
    };
  }

  const proteinTarget = snapshot.proteinTargetG ?? 0;
  const proteinActual = snapshot.proteinActualG ?? 0;
  if (proteinTarget > 0 && proteinActual / proteinTarget < 0.5) {
    return {
      adviceMode: "specific_action",
      actionKey: "eat_protein_now",
      rationale: "Protein intake is below 50% of the current target, so a simple protein action is appropriate now.",
      sourceIds: [...RULE_SOURCE_IDS.protein],
      ruleKey: "low-protein-intake",
    };
  }

  const calorieTarget = snapshot.calorieTargetKcal ?? 0;
  const calorieActual = snapshot.calorieActualKcal ?? 0;
  if (calorieTarget > 0 && calorieActual / calorieTarget < 0.5) {
    return {
      adviceMode: "specific_action",
      actionKey: "take_small_energy_dense_snack",
      rationale: "Energy intake is well below target, so a small energy-dense snack is the safest next step.",
      sourceIds: [...RULE_SOURCE_IDS.calories],
      ruleKey: "low-calorie-intake",
    };
  }

  const stepTarget = snapshot.stepTarget ?? 0;
  const stepsActual = snapshot.stepsActual ?? 0;
  const fatigueScore = snapshot.fatigueScore ?? 0;
  if (stepTarget > 0 && stepsActual / stepTarget < 0.5 && fatigueScore < 7) {
    return {
      adviceMode: "specific_action",
      actionKey: "walk_3_minutes_now",
      rationale: "Movement is low and fatigue is not marked, so a short walking action is appropriate.",
      sourceIds: [...RULE_SOURCE_IDS.activity],
      ruleKey: "low-activity",
    };
  }

  const hydrationMl = snapshot.hydrationMl ?? 0;
  if (hydrationMl > 0 && hydrationMl < 750) {
    return {
      adviceMode: "specific_action",
      actionKey: "drink_now",
      rationale: "Hydration appears low, so a simple drink-now action is appropriate.",
      sourceIds: [...RULE_SOURCE_IDS.hydration],
      ruleKey: "low-hydration",
    };
  }

  return {
    adviceMode: "coach",
    actionKey: "keep_checking_in",
    rationale: "Use supportive coaching and logging when no specific action or escalation rule is triggered.",
    sourceIds: [...RULE_SOURCE_IDS.coaching],
    ruleKey: "default-coaching",
  };
}
