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
  Loader2
} from "lucide-react";

interface ClinicianDashboardProps {
  proteinTarget: number;
  calorieTarget: number;
}

interface FoodLog {
  id: string;
  items: string[];
  meal_type: string | null;
  estimated_protein: number | null;
  estimated_calories: number | null;
  transcript: string | null;
  created_at: string;
}

interface ActivityLog {
  id: string;
  activity_type: string;
  duration_minutes: number | null;
  intensity: string | null;
  transcript: string | null;
  created_at: string;
}

interface SymptomLog {
  id: string;
  symptoms: Record<string, number>;
  safety_flags: string[];
  ai_response: string | null;
  transcript: string | null;
  created_at: string;
}

export function ClinicianDashboard({ proteinTarget, calorieTarget }: ClinicianDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [symptomLogs, setSymptomLogs] = useState<SymptomLog[]>([]);

  const fetchTodayLogs = async () => {
    setIsLoading(true);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();

    try {
      const [foodResult, activityResult, symptomResult] = await Promise.all([
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
      ]);

      if (foodResult.data) setFoodLogs(foodResult.data as FoodLog[]);
      if (activityResult.data) setActivityLogs(activityResult.data as ActivityLog[]);
      if (symptomResult.data) setSymptomLogs(symptomResult.data as SymptomLog[]);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayLogs();
  }, []);

  // Calculate totals
  const totalProtein = foodLogs.reduce((sum, log) => sum + (log.estimated_protein || 0), 0);
  const totalCalories = foodLogs.reduce((sum, log) => sum + (log.estimated_calories || 0), 0);
  const totalActivityMinutes = activityLogs.reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

  // Check for safety flags
  const safetyAlerts = symptomLogs.filter(log => log.safety_flags && log.safety_flags.length > 0);

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
    if (totalActivityMinutes >= 30) return { label: "Active", color: "bg-green-500" };
    if (totalActivityMinutes >= 15) return { label: "Light", color: "bg-yellow-500" };
    if (totalActivityMinutes > 0) return { label: "Minimal", color: "bg-orange-500" };
    return { label: "Sedentary", color: "bg-red-500" };
  };

  const activityLevel = getActivityLevel();

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
          <Button variant="outline" size="sm" onClick={fetchTodayLogs}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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
        </div>

        <Separator />

        {/* Activity Level */}
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

          {activityLogs.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Activities: {activityLogs.map(log => 
                `${log.activity_type}${log.duration_minutes ? ` (${log.duration_minutes}min)` : ""}`
              ).join(", ")}
            </div>
          )}
        </div>

        <Separator />

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
