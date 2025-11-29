import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calculator, Target, Flame, Drumstick } from "lucide-react";

interface RecoveryGoals {
  weight: number;
  proteinTarget: number;
  calorieTarget: number;
}

interface RecoveryGoalCalculatorProps {
  onGoalsCalculated: (goals: RecoveryGoals) => void;
  initialGoals?: RecoveryGoals | null;
}

const RecoveryGoalCalculator = ({ onGoalsCalculated, initialGoals }: RecoveryGoalCalculatorProps) => {
  const [weight, setWeight] = useState(initialGoals?.weight?.toString() || "");
  const [goals, setGoals] = useState<RecoveryGoals | null>(initialGoals || null);

  // Clinical targets based on research: 1.5g protein/kg, 27.5 kcal/kg
  const PROTEIN_PER_KG = 1.5;
  const CALORIES_PER_KG = 27.5;

  const calculateGoals = () => {
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return;

    const newGoals: RecoveryGoals = {
      weight: weightNum,
      proteinTarget: Math.round(weightNum * PROTEIN_PER_KG),
      calorieTarget: Math.round(weightNum * CALORIES_PER_KG),
    };

    setGoals(newGoals);
    onGoalsCalculated(newGoals);
    
    // Save to localStorage
    localStorage.setItem("recoveryGoals", JSON.stringify(newGoals));
  };

  useEffect(() => {
    // Load saved goals from localStorage
    const savedGoals = localStorage.getItem("recoveryGoals");
    if (savedGoals && !initialGoals) {
      const parsed = JSON.parse(savedGoals);
      setGoals(parsed);
      setWeight(parsed.weight.toString());
      onGoalsCalculated(parsed);
    }
  }, []);

  return (
    <Card className="border-secondary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-secondary" />
          Your Recovery Goals
        </CardTitle>
        <CardDescription>
          Calculate personalized protein and calorie targets based on clinical guidelines
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="weight">Your Current Weight (kg)</Label>
          <div className="flex gap-2">
            <Input
              id="weight"
              type="number"
              placeholder="e.g., 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="flex-1"
              min="30"
              max="250"
            />
            <Button onClick={calculateGoals} disabled={!weight}>
              Calculate
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Based on clinical guidelines: 1.5g protein/kg and 27.5 kcal/kg body weight
          </p>
        </div>

        {goals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="bg-secondary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-secondary">
                <Drumstick className="w-5 h-5" />
                <span className="font-medium">Daily Protein Target</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{goals.proteinTarget}</span>
                <span className="text-muted-foreground">grams/day</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Essential for tissue repair and immune function
              </p>
            </div>

            <div className="bg-primary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Flame className="w-5 h-5" />
                <span className="font-medium">Daily Calorie Target</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{goals.calorieTarget}</span>
                <span className="text-muted-foreground">kcal/day</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Supports energy needs during recovery
              </p>
            </div>
          </div>
        )}

        {goals && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Why These Targets?</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Research shows that post-operative patients often need higher protein intake (1.5g/kg vs normal 0.8g/kg) 
              to support wound healing, maintain muscle mass, and optimize immune function. 
              These personalized targets are a starting point—your healthcare team may adjust them based on your specific needs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecoveryGoalCalculator;
