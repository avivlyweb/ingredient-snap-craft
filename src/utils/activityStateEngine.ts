/**
 * Wearable-Free Activity State Engine
 * 
 * Infers patient activity state based on simple questions rather than wearable data.
 * Based on clinical research for post-operative recovery tracking.
 */

export type ActivityState = 
  | 'ADEQUATE'
  | 'UNDERSTIMULATED' 
  | 'STALLING'
  | 'FATIGUE_LIMITED'
  | 'OVERREACHED'
  | 'DATA_SPARSE';

export interface ActivityInputs {
  stepsCount?: number | null;
  stepsTarget?: number | null;
  activeMinutes?: number | null;
  movementMoments?: number | null;
  longestSittingStreakMin?: number | null;
  sitToStandCount?: number | null;
  perceivedExertionRpe?: number | null; // 0-10
  fatigue?: number | null; // 0-10
  pain?: number | null; // 0-10
  sleepHours?: number | null;
  postOpWeek?: number | null;
}

export interface ActivityGoals {
  goalMomentsPerDay: number;
  maxSittingStreakMin: number;
  microWalkMin: number;
  activeMinutesTarget: number;
}

export interface DerivedMetrics {
  stepsRatio: number;
  momentFrequencyScore: number;
  sedentaryRisk: boolean;
  loadIndicator: number;
  toleranceIndicator: number;
}

// Default goals based on post-op week (Graduated Recovery Protocol)
export function getActivityGoals(postOpWeek?: number | null): ActivityGoals {
  const week = postOpWeek || 1;
  
  if (week <= 1) {
    return {
      goalMomentsPerDay: 6,
      maxSittingStreakMin: 90,
      microWalkMin: 3,
      activeMinutesTarget: 15,
    };
  } else if (week <= 2) {
    return {
      goalMomentsPerDay: 7,
      maxSittingStreakMin: 90,
      microWalkMin: 4,
      activeMinutesTarget: 20,
    };
  } else {
    return {
      goalMomentsPerDay: 8,
      maxSittingStreakMin: 90,
      microWalkMin: 5,
      activeMinutesTarget: 25,
    };
  }
}

// Calculate derived metrics from inputs
export function calculateDerivedMetrics(
  inputs: ActivityInputs, 
  goals: ActivityGoals
): DerivedMetrics {
  const stepsRatio = inputs.stepsTarget && inputs.stepsCount
    ? inputs.stepsCount / inputs.stepsTarget
    : 0;
  
  const momentFrequencyScore = inputs.movementMoments
    ? inputs.movementMoments / goals.goalMomentsPerDay
    : 0;
  
  const sedentaryRisk = (inputs.longestSittingStreakMin || 0) >= goals.maxSittingStreakMin;
  
  const activeMinutesRatio = inputs.activeMinutes
    ? inputs.activeMinutes / goals.activeMinutesTarget
    : 0;
  
  const loadIndicator = Math.max(stepsRatio, activeMinutesRatio, momentFrequencyScore);
  
  // Tolerance based on fatigue, pain, and sleep
  const fatiguePenalty = (inputs.fatigue || 0) / 10;
  const painPenalty = (inputs.pain || 0) / 10;
  const sleepPenalty = inputs.sleepHours && inputs.sleepHours < 6 ? 0.3 : 0;
  const toleranceIndicator = 1 - (fatiguePenalty + painPenalty + sleepPenalty) / 3;
  
  return {
    stepsRatio,
    momentFrequencyScore,
    sedentaryRisk,
    loadIndicator,
    toleranceIndicator,
  };
}

// Main state inference function (priority-ordered rules)
export function inferActivityState(inputs: ActivityInputs): ActivityState {
  const goals = getActivityGoals(inputs.postOpWeek);
  const derived = calculateDerivedMetrics(inputs, goals);
  
  // Priority 1: DATA_SPARSE - Not enough data
  if (
    inputs.stepsCount == null && 
    inputs.activeMinutes == null && 
    inputs.movementMoments == null
  ) {
    return 'DATA_SPARSE';
  }
  
  // Priority 2: OVERREACHED - High activity + poor recovery
  if (
    derived.loadIndicator >= 1.2 && 
    ((inputs.sleepHours != null && inputs.sleepHours < 6) || (inputs.fatigue != null && inputs.fatigue >= 7))
  ) {
    return 'OVERREACHED';
  }
  
  // Priority 3: FATIGUE_LIMITED - High fatigue/pain limits activity
  if (
    ((inputs.fatigue != null && inputs.fatigue >= 7) || (inputs.pain != null && inputs.pain >= 7)) &&
    (derived.stepsRatio < 0.8 || derived.momentFrequencyScore < 1)
  ) {
    return 'FATIGUE_LIMITED';
  }
  
  // Priority 4: STALLING - Long sedentary streaks
  if (
    derived.sedentaryRisk && 
    inputs.movementMoments != null && 
    inputs.movementMoments < 4
  ) {
    return 'STALLING';
  }
  
  // Priority 5: UNDERSTIMULATED - Too little activity
  if (
    derived.stepsRatio < 0.6 || 
    derived.momentFrequencyScore < 0.6
  ) {
    return 'UNDERSTIMULATED';
  }
  
  // Priority 6: ADEQUATE - Meeting goals with good tolerance
  return 'ADEQUATE';
}

// Dutch response phrases for each state
export const ACTIVITY_STATE_RESPONSES_NL: Record<ActivityState, string> = {
  UNDERSTIMULATED: "Je hebt vandaag nog weinig bewogen. Sta nu even op en loop 3–5 minuten.",
  STALLING: "Je zit al een tijd achter elkaar. Sta even 2 minuten op, dat helpt je herstel.",
  ADEQUATE: "Mooi, je beweegt regelmatig. Houd dit ritme vast.",
  FATIGUE_LIMITED: "Je bent moe vandaag. Kies voor rustig bewegen: even staan, paar passen, weer zitten.",
  OVERREACHED: "Je deed veel, maar je lichaam heeft ook rust nodig. Vandaag wat rustiger is oké.",
  DATA_SPARSE: "Ik mis je beweging van vandaag. Ben je een paar keer opgestaan en gelopen?",
};

// Action recommendations for each state
export const ACTIVITY_STATE_ACTIONS: Record<ActivityState, string[]> = {
  DATA_SPARSE: ['ASK_ACTIVITY_MINIMUM_INPUT', 'DEFAULT_MICRO_MOMENTS_PLAN'],
  UNDERSTIMULATED: ['PROMPT_MICRO_WALK', 'BREAK_SITTING_PLAN', 'PAIR_WITH_SNACK_IF_LOW_PROTEIN'],
  STALLING: ['STAND_UP_EACH_HOUR', 'TWO_MINUTE_UPRIGHT_PLAN', 'SEATED_EXERCISES_OPTION'],
  ADEQUATE: ['PRAISE_MAINTAIN', 'DISTRIBUTE_ACTIVITY', 'LIGHT_STRENGTH_ADDON_OPTION'],
  FATIGUE_LIMITED: ['PROTECT_ENERGY', 'GENTLE_MOBILITY', 'PAIN_CHECK_AND_ESCALATE_IF_RED_FLAGS'],
  OVERREACHED: ['ACTIVE_RECOVERY_DAY', 'HYDRATION_REST', 'NO_GOAL_ESCALATION'],
};

// Get color for state visualization
export function getActivityStateColor(state: ActivityState): 'green' | 'orange' | 'red' | 'gray' {
  switch (state) {
    case 'ADEQUATE':
      return 'green';
    case 'UNDERSTIMULATED':
    case 'STALLING':
      return 'orange';
    case 'FATIGUE_LIMITED':
    case 'OVERREACHED':
      return 'red';
    case 'DATA_SPARSE':
    default:
      return 'gray';
  }
}

// Get label for state
export function getActivityStateLabel(state: ActivityState): string {
  switch (state) {
    case 'ADEQUATE':
      return 'Op koers';
    case 'UNDERSTIMULATED':
      return 'Meer beweging nodig';
    case 'STALLING':
      return 'Te lang gezeten';
    case 'FATIGUE_LIMITED':
      return 'Vermoeidheid';
    case 'OVERREACHED':
      return 'Rustdag nodig';
    case 'DATA_SPARSE':
      return 'Check-in nodig';
  }
}
