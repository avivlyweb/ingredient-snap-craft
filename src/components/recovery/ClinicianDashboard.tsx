import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Apple, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare,
  RefreshCw,
  Loader2,
  Footprints,
  Moon,
  Lightbulb,
  Printer,
  Gauge
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { RecoveryBalanceGauge } from "./RecoveryBalanceGauge";
import { HerstelindexCard } from "./HerstelindexCard";
import { 
  inferActivityState, 
  ActivityState, 
  getActivityStateLabel 
} from "@/utils/activityStateEngine";
import { calculateRecoveryIndex, RecoveryIndexResult } from "@/utils/recoveryIndex";

interface ClinicianDashboardProps {
  proteinTarget: number;
  calorieTarget: number;
  stepTarget?: number;
}

interface FoodLog {
  id: string;
  items: string[];
  meal_type: string | null;
  estimated_protein: number | null;
  estimated_calories: number | null;
  protein_confidence: string | null;
  data_source: string | null;
  transcript: string | null;
  created_at: string;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  duration_minutes: number | null;
  intensity: string | null;
  step_count: number | null;
  movement_moments: number | null;
  longest_sitting_streak_min: number | null;
  fatigue_score: number | null;
  pain_score: number | null;
  sleep_hours: number | null;
  activity_state: string | null;
  transcript: string | null;
  created_at: string;
}

interface SymptomLog {
  id: string;
  symptoms: Record<string, number>;
  safety_flags: string[];
  sleep_quality: number | null;
  suggested_action: string | null;
  ai_response: string | null;
  transcript: string | null;
  created_at: string;
}

interface WeeklyDataPoint {
  date: string;
  protein: number;
  calories: number;
  steps: number;
  activityMinutes: number;
  activityState?: string;
}

export function ClinicianDashboard({ proteinTarget, calorieTarget, stepTarget = 2000 }: ClinicianDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);

  const fetchTodayLogs = async () => {
    setIsLoading(true);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    // Get 7 days ago for weekly trends
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekAgoIso = weekAgo.toISOString();

    try {
      const [foodResult, activityResult, symptomResult, weeklyFoodResult, weeklyActivityResult] = await Promise.all([
        supabase
          .from("food_logs")
          .select("*")
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false }),
        supabase
          .from("activity_logs")
          .select("*")
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false }),
        supabase
          .from("symptom_logs")
          .select("*")
          .gte("created_at", todayIso)
          .order("created_at", { ascending: false }),
        // Weekly data for trends
        supabase
          .from("food_logs")
          .select("estimated_protein, estimated_calories, created_at")
          .gte("created_at", weekAgoIso)
          .order("created_at", { ascending: true }),
        supabase
          .from("activity_logs")
          .select("duration_minutes, step_count, created_at")
          .gte("created_at", weekAgoIso)
          .order("created_at", { ascending: true }),
      ]);

      if (foodResult.data) setFoodLogs(foodResult.data as FoodLog[]);
      if (activityResult.data) setActivityLogs(activityResult.data as ActivityLog[]);
      if (symptomResult.data) setSymptomLogs(symptomResult.data as SymptomLog[]);

      // Process weekly data
      if (weeklyFoodResult.data || weeklyActivityResult.data) {
        const dailyAggregates: Record<string, WeeklyDataPoint> = {};
        
        // Initialize last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split("T")[0];
          dailyAggregates[dateKey] = {
            date: date.toLocaleDateString("nl-NL", { weekday: "short" }),
            protein: 0,
            calories: 0,
            steps: 0,
            activityMinutes: 0,
          };
        }

        // Aggregate food data
        (weeklyFoodResult.data || []).forEach((log: any) => {
          const dateKey = log.created_at.split("T")[0];
          if (dailyAggregates[dateKey]) {
            dailyAggregates[dateKey].protein += log.estimated_protein || 0;
            dailyAggregates[dateKey].calories += log.estimated_calories || 0;
          }
        });

        // Aggregate activity data
        (weeklyActivityResult.data || []).forEach((log: any) => {
          const dateKey = log.created_at.split("T")[0];
          if (dailyAggregates[dateKey]) {
            dailyAggregates[dateKey].steps += log.step_count || 0;
            dailyAggregates[dateKey].activityMinutes += log.duration_minutes || 0;
          }
        });

        setWeeklyData(Object.values(dailyAggregates));
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayLogs();

    // Subscribe to realtime updates for all health log tables
    const channel = supabase
      .channel('health-logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'food_logs' },
        () => {
          console.log('New food log detected, refreshing...');
          fetchTodayLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        () => {
          console.log('New activity log detected, refreshing...');
          fetchTodayLogs();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'symptom_logs' },
        () => {
          console.log('New symptom log detected, refreshing...');
          fetchTodayLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Calculate totals
  const totalProtein = foodLogs.reduce((sum, log) => sum + (log.estimated_protein || 0), 0);
  const totalCalories = foodLogs.reduce((sum, log) => sum + (log.estimated_calories || 0), 0);
  const totalActivityMinutes = activityLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
  const totalSteps = activityLogs.reduce((sum, log) => sum + (log.step_count || 0), 0);

  // Get latest activity check-in data for state calculation
  const latestCheckIn = activityLogs.find(log => log.activity_type === "daily_check_in");
  
  // Calculate current activity state
  const currentActivityState: ActivityState = latestCheckIn?.activity_state as ActivityState || 
    inferActivityState({
      stepsCount: totalSteps,
      stepsTarget: stepTarget,
      activeMinutes: totalActivityMinutes,
      movementMoments: latestCheckIn?.movement_moments,
      longestSittingStreakMin: latestCheckIn?.longest_sitting_streak_min,
      fatigue: latestCheckIn?.fatigue_score,
      pain: latestCheckIn?.pain_score,
      sleepHours: latestCheckIn?.sleep_hours,
    });

  // Calculate Herstelindex
  const herstelindexResult: RecoveryIndexResult = calculateRecoveryIndex({
    dailyProtein: totalProtein,
    proteinTarget,
    dailySteps: totalSteps,
    stepTarget,
    activityState: currentActivityState,
  });

  // Check for safety flags
  const safetyAlerts = symptomLogs.filter(log => log.safety_flags && log.safety_flags.length > 0);

  // Get AI suggested actions
  const suggestedActions = symptomLogs
    .filter(log => log.suggested_action)
    .map(log => ({
      action: log.suggested_action!,
      time: new Date(log.created_at).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }),
    }));

  // Get sleep quality if reported
  const sleepQualityLogs = symptomLogs.filter(log => log.sleep_quality !== null);
  const avgSleepQuality = sleepQualityLogs.length > 0
    ? sleepQualityLogs.reduce((sum, log) => sum + (log.sleep_quality || 0), 0) / sleepQualityLogs.length
    : null;

  // Aggregate symptoms
  const allSymptoms: Record<string, number[]> = {};
  symptomLogs.forEach(log => {
    if (log.symptoms) {
      Object.entries(log.symptoms).forEach(([symptom, severity]) => {
        if (!allSymptoms[symptom]) allSymptoms[symptom] = [];
        allSymptoms[symptom].push(severity);
      });
    }
  });

  // Calculate average severity for each symptom
  const symptomAverages = Object.entries(allSymptoms).map(([symptom, severities]) => ({
    symptom,
    average: severities.reduce((a, b) => a + b, 0) / severities.length,
  })).sort((a, b) => b.average - a.average);

  // Determine activity level
  const getActivityLevel = () => {
    if (totalActivityMinutes >= 30 || totalSteps >= stepTarget) return { label: "Active", color: "bg-secondary" };
    if (totalActivityMinutes >= 15 || totalSteps >= stepTarget * 0.5) return { label: "Light", color: "bg-accent" };
    if (totalActivityMinutes > 0 || totalSteps > 0) return { label: "Minimal", color: "bg-primary" };
    return { label: "Sedentary", color: "bg-destructive" };
  };

  const activityLevel = getActivityLevel();

  // Print for chart functionality
  const handlePrintForChart = () => {
    const printContent = `
DAILY ROUNDING SUMMARY - ${new Date().toLocaleDateString("nl-NL")}
=====================================

NUTRITIONAL INTAKE:
- Protein: ${totalProtein}g / ${proteinTarget}g (${Math.round((totalProtein / proteinTarget) * 100)}%)
- Calories: ${totalCalories} / ${calorieTarget} (${Math.round((totalCalories / calorieTarget) * 100)}%)
- Meals logged: ${foodLogs.length}

ACTIVITY LEVEL: ${activityLevel.label}
- Total activity: ${totalActivityMinutes} minutes
- Steps: ${totalSteps} / ${stepTarget}

SYMPTOMS REPORTED:
${symptomAverages.map(s => `- ${s.symptom}: ${s.average.toFixed(1)}/10`).join("\n") || "- None reported"}

${safetyAlerts.length > 0 ? `
⚠️ SAFETY CONCERNS:
${safetyAlerts.flatMap(log => log.safety_flags).join(", ")}
` : ""}

${suggestedActions.length > 0 ? `
AI SUGGESTED ACTIONS:
${suggestedActions.map(a => `- ${a.time}: ${a.action}`).join("\n")}
` : ""}

${avgSleepQuality !== null ? `
SLEEP QUALITY: ${avgSleepQuality.toFixed(1)}/10
` : ""}
    `;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; white-space: pre-wrap;">${printContent}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              📋 Daily Rounding Summary
            </CardTitle>
            <CardDescription>
              Voice-logged health data from today
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintForChart}>
              <Printer className="w-4 h-4 mr-2" />
              Print for Chart
            </Button>
            <Button variant="outline" size="sm" onClick={fetchTodayLogs}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Herstelindex and Recovery Balance - Top Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HerstelindexCard result={herstelindexResult} />
          <RecoveryBalanceGauge activityState={currentActivityState} />
        </div>

        {/* Safety Alerts */}
        {safetyAlerts.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-destructive font-medium">
              <AlertTriangle className="w-5 h-5" />
              Safety Concerns Reported
            </div>
            <div className="flex flex-wrap gap-2">
              {safetyAlerts.flatMap(log => log.safety_flags).map((flag, i) => (
                <Badge key={i} variant="destructive">
                  {flag.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Review patient status and consider follow-up
            </p>
          </div>
        )}

        {/* Nutritional Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Apple className="w-5 h-5 text-secondary" />
            <h4 className="font-medium">Nutritional Intake</h4>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Protein</span>
                <span className="font-medium">
                  {totalProtein}g / {proteinTarget}g ({Math.round((totalProtein / proteinTarget) * 100)}%)
                </span>
              </div>
              <Progress 
                value={Math.min((totalProtein / proteinTarget) * 100, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Calories</span>
                <span className="font-medium">
                  {totalCalories} / {calorieTarget} ({Math.round((totalCalories / calorieTarget) * 100)}%)
                </span>
              </div>
              <Progress 
                value={Math.min((totalCalories / calorieTarget) * 100, 100)} 
                className="h-2"
              />
            </div>
          </div>

          {foodLogs.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">{foodLogs.length} meal(s) logged:</span>{" "}
              {foodLogs.map(log => log.items.join(", ")).join("; ")}
            </div>
          )}

          {/* Protein confidence indicators */}
          {foodLogs.some(log => log.protein_confidence) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {foodLogs.filter(log => log.protein_confidence).map((log, i) => (
                <Badge 
                  key={i} 
                  variant="outline"
                  className={
                    log.protein_confidence === "high" ? "border-green-500 text-green-600" :
                    log.protein_confidence === "medium" ? "border-yellow-500 text-yellow-600" :
                    "border-orange-500 text-orange-600"
                  }
                >
                  {log.items[0]}: {log.protein_confidence} confidence
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Activity Level with Steps */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <h4 className="font-medium">Activity Level</h4>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge className={`${activityLevel.color} text-white`}>
              {activityLevel.label}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {totalActivityMinutes} minutes of activity today
            </span>
          </div>

          {/* Steps tracking */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Footprints className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Steps</span>
              <span className="font-medium ml-auto">
                {totalSteps} / {stepTarget} ({Math.round((totalSteps / stepTarget) * 100)}%)
              </span>
            </div>
            <Progress 
              value={Math.min((totalSteps / stepTarget) * 100, 100)} 
              className="h-2"
            />
          </div>

          {activityLogs.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Activities: {activityLogs.map(log => 
                `${log.activity_type}${log.duration_minutes ? ` (${log.duration_minutes}min)` : ""}${log.step_count ? ` - ${log.step_count} steps` : ""}`
              ).join(", ")}
            </div>
          )}
        </div>

        <Separator />

        {/* Sleep Quality */}
        {avgSleepQuality !== null && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-500" />
                <h4 className="font-medium">Sleep Quality</h4>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline"
                  className={
                    avgSleepQuality >= 7 ? "border-green-500 text-green-600" :
                    avgSleepQuality >= 4 ? "border-yellow-500 text-yellow-600" :
                    "border-red-500 text-red-600"
                  }
                >
                  {avgSleepQuality.toFixed(1)}/10
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {avgSleepQuality >= 7 ? "Good sleep reported" : 
                   avgSleepQuality >= 4 ? "Moderate sleep quality" : 
                   "Poor sleep - consider fatigue management"}
                </span>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* AI Suggested Actions */}
        {suggestedActions.length > 0 && (
          <>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h4 className="font-medium">AI Suggested Actions</h4>
              </div>
              <div className="space-y-2">
                {suggestedActions.map((action, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 p-2 rounded"
                  >
                    <span className="text-muted-foreground text-xs">{action.time}</span>
                    <span>{action.action}</span>
                  </div>
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Symptom Summary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h4 className="font-medium">Symptom Summary</h4>
          </div>
          
          {symptomAverages.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {symptomAverages.map(({ symptom, average }) => (
                <Badge 
                  key={symptom}
                  variant="outline"
                  className={
                    average >= 7 ? "border-destructive text-destructive" :
                    average >= 4 ? "border-orange-500 text-orange-600" :
                    "border-muted-foreground"
                  }
                >
                  {symptom} ({average.toFixed(1)}/10)
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No symptoms reported today</p>
          )}
        </div>

        {/* Weekly Trends */}
        {weeklyData.length > 0 && weeklyData.some(d => d.protein > 0 || d.steps > 0) && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium">Weekly Trends</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Protein Trend */}
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Protein Intake (g)</span>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Bar dataKey="protein" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Activity Trend */}
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Activity (minutes)</span>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="activityMinutes" 
                          stroke="hsl(var(--secondary))" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* AI Notes */}
        {symptomLogs.some(log => log.ai_response) && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <h4 className="font-medium">AI Conversation Notes</h4>
              </div>
              
              <div className="space-y-2">
                {symptomLogs
                  .filter(log => log.ai_response)
                  .slice(0, 3)
                  .map(log => (
                    <div 
                      key={log.id} 
                      className="text-sm text-muted-foreground bg-muted/30 p-2 rounded"
                    >
                      "{log.ai_response}"
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}

        {/* Empty state */}
        {foodLogs.length === 0 && activityLogs.length === 0 && symptomLogs.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <p>No voice logs recorded today.</p>
            <p className="text-sm mt-1">Patient can use the voice assistant to log meals, activity, and symptoms.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
