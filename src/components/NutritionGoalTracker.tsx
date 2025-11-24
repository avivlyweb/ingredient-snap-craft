import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Beef, Wheat, Droplet, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeIngredientPortion } from "@/utils/portionConverter";

interface NutritionGoals {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

interface NutritionGoalTrackerProps {
  ingredients: string[];
  healthGoals: string[];
  servings?: number;
}

const goalDefaults: Record<string, NutritionGoals> = {
  muscle_building: { calories: 2500, protein: 150, carbs: 250, fat: 80, fiber: 30 },
  weight_loss: { calories: 1800, protein: 120, carbs: 150, fat: 60, fiber: 35 },
  high_protein: { calories: 2200, protein: 160, carbs: 180, fat: 70, fiber: 30 },
  heart_health: { calories: 2000, protein: 100, carbs: 220, fat: 65, fiber: 40 },
  energy_boost: { calories: 2300, protein: 110, carbs: 280, fat: 70, fiber: 30 },
  default: { calories: 2000, protein: 100, carbs: 250, fat: 70, fiber: 30 },
};

export const NutritionGoalTracker = ({ 
  ingredients, 
  healthGoals,
  servings = 4 
}: NutritionGoalTrackerProps) => {
  const [currentNutrition, setCurrentNutrition] = useState<NutritionGoals>({});
  const [targetGoals, setTargetGoals] = useState<NutritionGoals>({});
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    // Set target goals based on health goals
    const primaryGoal = healthGoals[0] || 'default';
    setTargetGoals(goalDefaults[primaryGoal] || goalDefaults.default);
    
    // Calculate current nutrition from ingredients
    calculateNutrition();
  }, [ingredients, healthGoals]);

  const calculateNutrition = async () => {
    if (ingredients.length === 0) {
      setCurrentNutrition({});
      return;
    }

    setIsCalculating(true);
    try {
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;

      for (const ingredient of ingredients) {
        const { name, gramsPerServing } = normalizeIngredientPortion(ingredient);
        
        // Search NEVO database
        const { data } = await supabase
          .from('nevo_foods')
          .select('*')
          .ilike('food_name_en', `%${name}%`)
          .limit(1)
          .maybeSingle();

        if (data) {
          // NEVO data is per 100g, so we need to scale it
          const scaleFactor = gramsPerServing / 100;
          
          totalCalories += (data.energy_kcal || 0) * scaleFactor;
          totalProtein += (data.protein_total || 0) * scaleFactor;
          totalCarbs += (data.carbohydrate_available || 0) * scaleFactor;
          totalFat += (data.fat_total || 0) * scaleFactor;
          totalFiber += (data.fiber_dietary_total || 0) * scaleFactor;
        }
      }

      setCurrentNutrition({
        calories: Math.round(totalCalories),
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
        fiber: Math.round(totalFiber),
      });
    } catch (error) {
      console.error('Error calculating nutrition:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getNutrientProgress = (current: number = 0, target: number = 1) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return "bg-red-500";
    if (percentage < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const nutrients = [
    {
      key: 'calories',
      label: 'Calories',
      icon: Flame,
      color: 'text-orange-500',
      unit: 'kcal',
    },
    {
      key: 'protein',
      label: 'Protein',
      icon: Beef,
      color: 'text-red-500',
      unit: 'g',
    },
    {
      key: 'carbs',
      label: 'Carbs',
      icon: Wheat,
      color: 'text-amber-500',
      unit: 'g',
    },
    {
      key: 'fat',
      label: 'Fat',
      icon: Droplet,
      color: 'text-blue-500',
      unit: 'g',
    },
    {
      key: 'fiber',
      label: 'Fiber',
      icon: Apple,
      color: 'text-green-500',
      unit: 'g',
    },
  ];

  if (ingredients.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Nutrition Preview</h3>
          {isCalculating && (
            <Badge variant="secondary" className="animate-pulse">
              Calculating...
            </Badge>
          )}
        </div>

        <div className="grid gap-4">
          {nutrients.map(({ key, label, icon: Icon, color, unit }) => {
            const current = currentNutrition[key as keyof NutritionGoals] || 0;
            const target = targetGoals[key as keyof NutritionGoals] || 0;
            const progress = getNutrientProgress(current, target);
            const difference = target - current;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">{current}</span>
                    <span className="text-muted-foreground"> / {target}{unit}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={progress} className="h-2" />
                  {difference > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round(difference)}{unit} away from your goal
                    </p>
                  )}
                  {difference < 0 && (
                    <p className="text-xs text-green-600">
                      ✓ Goal exceeded by {Math.abs(Math.round(difference))}{unit}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Based on NEVO nutritional database • Per serving ({servings} servings total)
          </p>
        </div>
      </div>
    </Card>
  );
};
