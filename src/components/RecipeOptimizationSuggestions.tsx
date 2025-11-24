import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Lightbulb, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SwapSuggestion {
  original: string;
  replacement: string;
  reason: string;
  nutritionImprovement: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
}

interface RecipeOptimizationSuggestionsProps {
  ingredients: string[];
  healthGoals: string[];
  onApplySwap: (original: string, replacement: string) => void;
}

export const RecipeOptimizationSuggestions = ({
  ingredients,
  healthGoals,
  onApplySwap,
}: RecipeOptimizationSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SwapSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ingredients.length > 0 && healthGoals.length > 0) {
      loadSuggestions();
    }
  }, [ingredients, healthGoals]);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimize-recipe-nutrition', {
        body: { ingredients, healthGoals }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error loading optimization suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNutritionChange = (improvement: SwapSuggestion['nutritionImprovement']) => {
    const changes: string[] = [];
    
    if (improvement.protein && improvement.protein > 0) {
      changes.push(`+${improvement.protein}g protein`);
    }
    if (improvement.fiber && improvement.fiber > 0) {
      changes.push(`+${improvement.fiber}g fiber`);
    }
    if (improvement.fat && improvement.fat < 0) {
      changes.push(`${improvement.fat}g fat`);
    }
    
    return changes.join(', ');
  };

  if (suggestions.length === 0 || healthGoals.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-yellow-500 animate-pulse" />
          <h3 className="text-lg font-semibold">Smart Ingredient Swaps</h3>
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length} {suggestions.length === 1 ? 'suggestion' : 'suggestions'}
          </Badge>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Finding optimizations...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => {
              const nutritionChange = formatNutritionChange(suggestion.nutritionImprovement);
              
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-background/50 hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{suggestion.original}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-primary">{suggestion.replacement}</span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {suggestion.reason}
                      </p>
                      
                      {nutritionChange && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">
                            {nutritionChange}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onApplySwap(suggestion.original, suggestion.replacement)}
                      className="shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Suggestions based on your health goals and NEVO nutritional data
          </p>
        </div>
      </div>
    </Card>
  );
};
