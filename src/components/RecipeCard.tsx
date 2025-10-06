import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  cuisine_style: string;
  serving_suggestion: string;
  image_url?: string;
  created_at: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

export const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  return (
    <Card 
      onClick={onClick}
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 bg-card"
    >
      <div className="relative h-48 overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm">
            {recipe.cuisine_style}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{recipe.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {recipe.description}
        </p>
        <div className="flex flex-wrap gap-1 pt-2">
          {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {ingredient.split(' ')[0]}
            </Badge>
          ))}
          {recipe.ingredients.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{recipe.ingredients.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
