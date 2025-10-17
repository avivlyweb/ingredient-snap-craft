import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Users, 
  Clock, 
  Utensils, 
  DollarSign, 
  Dumbbell,
  Leaf,
  Target,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContextOption {
  id: string;
  label: string;
  description: string;
  icon: any;
  nutritionalFocus: string;
}

interface NutritionEnhancedContextSelectionProps {
  onSelectContext: (contextId: string, healthGoals?: string[]) => void;
}

const contextOptions: ContextOption[] = [
  {
    id: "date_night",
    label: "Date Night",
    description: "Romantic, impressive dining experience",
    icon: Heart,
    nutritionalFocus: "Mood-enhancing nutrients, moderate portions"
  },
  {
    id: "family_dinner",
    label: "Family Dinner",
    description: "Wholesome meals for the whole family",
    icon: Users,
    nutritionalFocus: "Balanced nutrition, kid-friendly"
  },
  {
    id: "quick_lunch",
    label: "Quick Weeknight",
    description: "Fast, energizing meals under 30 min",
    icon: Clock,
    nutritionalFocus: "Quick energy, sustained fuel"
  },
  {
    id: "meal_prep",
    label: "Meal Prep",
    description: "Batch cooking for the week ahead",
    icon: Utensils,
    nutritionalFocus: "Consistent macros, protein-rich"
  },
  {
    id: "budget_friendly",
    label: "Budget Conscious",
    description: "Delicious on a budget",
    icon: DollarSign,
    nutritionalFocus: "Maximum nutrients per dollar"
  },
  {
    id: "athletic_performance",
    label: "Athletic Performance",
    description: "Fuel your workouts and recovery",
    icon: Dumbbell,
    nutritionalFocus: "High protein, complex carbs, electrolytes"
  },
];

const healthGoalOptions = [
  { id: "heart_health", label: "Heart Health", icon: Heart },
  { id: "muscle_building", label: "Muscle Building", icon: Dumbbell },
  { id: "weight_management", label: "Weight Management", icon: Target },
  { id: "energy_boost", label: "Energy Boost", icon: Sparkles },
  { id: "anti_inflammatory", label: "Anti-Inflammatory", icon: Leaf },
];

export const NutritionEnhancedContextSelection = ({ 
  onSelectContext 
}: NutritionEnhancedContextSelectionProps) => {
  const [selectedContext, setSelectedContext] = useState<string>("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [showGoals, setShowGoals] = useState(false);

  const handleContextSelect = (contextId: string) => {
    setSelectedContext(contextId);
    setShowGoals(true);
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleConfirm = () => {
    if (selectedContext) {
      onSelectContext(selectedContext, selectedGoals);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Context</h2>
        <p className="text-muted-foreground">
          Select the occasion to get a nutrition-optimized recipe
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contextOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedContext === option.id;
          
          return (
            <Card
              key={option.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                isSelected 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleContextSelect(option.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-lg">{option.label}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
                <Badge variant="outline" className="text-xs">
                  {option.nutritionalFocus}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {showGoals && selectedContext && (
        <div className="space-y-4 p-6 bg-muted/30 rounded-lg border-2 border-dashed border-primary/20">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              Optional: Add Health Goals
            </h3>
            <p className="text-sm text-muted-foreground">
              Select additional nutritional objectives for your recipe
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {healthGoalOptions.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.id);
              
              return (
                <Badge
                  key={goal.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
                  onClick={() => toggleGoal(goal.id)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {goal.label}
                </Badge>
              );
            })}
          </div>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleConfirm}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity px-12"
            >
              Continue to Recipe Generation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
