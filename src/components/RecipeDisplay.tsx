import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NutritionLabel } from "@/components/NutritionLabel";
import { HealthInsights } from "@/components/HealthInsights";

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  cuisine_style: string;
  serving_suggestion: string;
  image_url?: string;
  context_type?: string;
  plating_guidance?: string;
  time_management?: string;
  ambiance_suggestions?: string;
  leftover_tips?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  health_insights?: Array<{
    title: string;
    description: string;
    type: 'benefit' | 'synergy' | 'tip';
  }>;
}

interface RecipeDisplayProps {
  recipe: Recipe;
  onAddToGallery: () => void;
  isAdding: boolean;
}

export const RecipeDisplay = ({ recipe, onAddToGallery, isAdding }: RecipeDisplayProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Card className="overflow-hidden bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
        {recipe.image_url && (
          <div className="relative h-[400px] overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <Badge className="mb-3 bg-secondary text-secondary-foreground">
                {recipe.cuisine_style}
              </Badge>
              <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                {recipe.title}
              </h2>
            </div>
          </div>
        )}

        <div className="p-8 space-y-6">
          {!recipe.image_url && (
            <div className="space-y-2">
              <Badge className="bg-secondary text-secondary-foreground">
                {recipe.cuisine_style}
              </Badge>
              <h2 className="text-3xl font-bold">{recipe.title}</h2>
            </div>
          )}

          <p className="text-lg text-muted-foreground leading-relaxed">
            {recipe.description}
          </p>

          {recipe.nutrition && (
            <>
              <Separator />
              <NutritionLabel nutrition={recipe.nutrition} servings={4} />
            </>
          )}

          {recipe.health_insights && recipe.health_insights.length > 0 && (
            <>
              <Separator />
              <HealthInsights 
                insights={recipe.health_insights} 
                contextType={recipe.context_type}
              />
            </>
          )}

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div>
            <h3 className="text-xl font-semibold mb-3">Instructions</h3>
            <div className="space-y-3 whitespace-pre-line text-muted-foreground">
              {recipe.steps}
            </div>
          </div>

          {recipe.serving_suggestion && (
            <>
              <Separator />
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Serving Suggestion</h3>
                <p className="text-muted-foreground">{recipe.serving_suggestion}</p>
              </div>
            </>
          )}

          {recipe.plating_guidance && (
            <>
              <Separator />
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-5 rounded-lg border border-primary/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  🎨 Plating Guidance
                </h3>
                <p className="text-muted-foreground">{recipe.plating_guidance}</p>
              </div>
            </>
          )}

          {recipe.time_management && (
            <>
              <Separator />
              <div className="bg-gradient-to-br from-secondary/5 to-accent/5 p-5 rounded-lg border border-secondary/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  ⏱️ Time Management
                </h3>
                <p className="text-muted-foreground">{recipe.time_management}</p>
              </div>
            </>
          )}

          {recipe.ambiance_suggestions && (
            <>
              <Separator />
              <div className="bg-gradient-to-br from-accent/5 to-primary/5 p-5 rounded-lg border border-accent/10">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  ✨ Ambiance Suggestions
                </h3>
                <p className="text-muted-foreground">{recipe.ambiance_suggestions}</p>
              </div>
            </>
          )}

          {recipe.leftover_tips && (
            <>
              <Separator />
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-5 rounded-lg border">
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  ♻️ Leftover Magic
                </h3>
                <p className="text-muted-foreground">{recipe.leftover_tips}</p>
              </div>
            </>
          )}
        </div>
      </Card>

      <Button
        onClick={onAddToGallery}
        disabled={isAdding}
        size="lg"
        className="w-full bg-gradient-to-r from-secondary to-accent hover:opacity-90 transition-opacity"
      >
        {isAdding ? "Adding to Gallery..." : "Add to Community Gallery"}
      </Button>
    </div>
  );
};
