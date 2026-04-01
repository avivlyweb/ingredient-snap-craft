export type AdviceMode = "coach" | "specific_action" | "escalate";

export type EvidenceStrength = "A" | "B" | "C" | "consensus";

export type ActionKey =
  | "eat_protein_now"
  | "take_small_energy_dense_snack"
  | "walk_3_minutes_now"
  | "drink_now"
  | "contact_care_team_now"
  | "keep_checking_in";

export interface EvidenceSource {
  id: string;
  citationKey: string;
  title: string;
  evidenceStrength: EvidenceStrength;
  summary?: string;
}

export interface ReasoningRule {
  id: string;
  key: string;
  adviceMode: AdviceMode;
  actionKey: ActionKey;
  rationale: string;
  sourceIds: string[];
}

export interface PatientDaySnapshot {
  proteinActualG?: number;
  proteinTargetG?: number;
  calorieActualKcal?: number;
  calorieTargetKcal?: number;
  stepsActual?: number;
  stepTarget?: number;
  activityMinutes?: number;
  fatigueScore?: number;
  nauseaScore?: number;
  appetiteScore?: number;
  hydrationMl?: number;
  feverFlag?: boolean;
  woundConcernFlag?: boolean;
  breathingConcernFlag?: boolean;
  severePainFlag?: boolean;
  persistentVomitingFlag?: boolean;
}

export interface RuleEvaluation {
  adviceMode: AdviceMode;
  actionKey: ActionKey;
  rationale: string;
  sourceIds: string[];
  ruleKey: string;
}
