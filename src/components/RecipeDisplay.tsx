import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  cuisine_style: string;
  serving_suggestion: string;
  image_url?: string;
}

interface RecipeDisplayProps {
  recipe: Recipe;
  onAddToGallery: () => void;
  isAdding: boolean;
}

export const RecipeDisplay = ({ recipe, onAddToGallery, isAdding }: RecipeDisplayProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="overflow-hidden bg-card shadow-lg">
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
