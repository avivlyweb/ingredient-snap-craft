/**
 * Recovery Index (Herstelindex) Calculator
 * 
 * Unified 0-100 score combining:
 * - Protein Adherence (33%)
 * - Step/Activity Goal (33%)
 * - ADL Capability / Activity State (34%)
 */

import { ActivityState } from './activityStateEngine';

export interface RecoveryIndexInputs {
  // Nutrition
  dailyProtein: number;
  proteinTarget: number;
  
  // Activity
  dailySteps: number;
  stepTarget: number;
  
  // Activity state (from state engine)
  activityState: ActivityState;
}

export interface RecoveryIndexResult {
  score: number; // 0-100
  proteinScore: number; // 0-33
  activityScore: number; // 0-33  
  adlScore: number; // 0-34
  trend: 'improving' | 'stable' | 'declining' | 'unknown';
  riskLevel: 'low' | 'medium' | 'high';
}

// ADL score based on activity state
function getAdlScoreFromState(state: ActivityState): number {
  switch (state) {
    case 'ADEQUATE':
      return 34; // 100% of 34
    case 'UNDERSTIMULATED':
      return 20; // ~60%
    case 'STALLING':
      return 14; // ~40%
    case 'FATIGUE_LIMITED':
      return 17; // ~50%
    case 'OVERREACHED':
      return 10; // ~30%
    case 'DATA_SPARSE':
    default:
      return 0;
  }
}

// Calculate Recovery Index
export function calculateRecoveryIndex(inputs: RecoveryIndexInputs): RecoveryIndexResult {
  // Protein score (0-33)
  const proteinRatio = Math.min(inputs.dailyProtein / inputs.proteinTarget, 1);
  const proteinScore = Math.round(proteinRatio * 33);
  
  // Activity score (0-33)
  const activityRatio = Math.min(inputs.dailySteps / inputs.stepTarget, 1);
  const activityScore = Math.round(activityRatio * 33);
  
  // ADL score (0-34)
  const adlScore = getAdlScoreFromState(inputs.activityState);
  
  // Total score
  const score = proteinScore + activityScore + adlScore;
  
  // Risk level based on score
  let riskLevel: 'low' | 'medium' | 'high';
  if (score >= 70) {
    riskLevel = 'low';
  } else if (score >= 50) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  return {
    score,
    proteinScore,
    activityScore,
    adlScore,
    trend: 'unknown', // Would need historical data to calculate
    riskLevel,
  };
}

// Calculate trend from historical scores
export function calculateTrend(
  currentScore: number, 
  previousScores: number[]
): 'improving' | 'stable' | 'declining' | 'unknown' {
  if (previousScores.length < 2) return 'unknown';
  
  // Get average of last 3 scores
  const recentScores = previousScores.slice(-3);
  const avgPrevious = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  
  const diff = currentScore - avgPrevious;
  
  if (diff >= 10) return 'improving';
  if (diff <= -10) return 'declining';
  return 'stable';
}

// Get color for score display
export function getRecoveryIndexColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
}

// Get background color class
export function getRecoveryIndexBgColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

// Get Dutch label for risk level
export function getRiskLevelLabel(riskLevel: 'low' | 'medium' | 'high'): string {
  switch (riskLevel) {
    case 'low':
      return 'Goed herstel';
    case 'medium':
      return 'Aandacht nodig';
    case 'high':
      return 'Escalatie overwegen';
  }
}
