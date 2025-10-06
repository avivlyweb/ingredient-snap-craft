import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  cuisine_style: string;
  serving_suggestion: string;
  image_url?: string;
}

interface RecipeModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RecipeModal = ({ recipe, open, onOpenChange }: RecipeModalProps) => {
  if (!recipe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          {recipe.image_url && (
            <div className="relative h-64 overflow-hidden">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-6 space-y-4">
            <DialogHeader>
              <div className="space-y-2">
                <Badge className="bg-secondary text-secondary-foreground w-fit">
                  {recipe.cuisine_style}
                </Badge>
                <DialogTitle className="text-3xl">{recipe.title}</DialogTitle>
              </div>
            </DialogHeader>

            <p className="text-muted-foreground">{recipe.description}</p>

            <Separator />

            <div>
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
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
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <div className="space-y-3 whitespace-pre-line text-muted-foreground">
                {recipe.steps}
              </div>
            </div>

            {recipe.serving_suggestion && (
              <>
                <Separator />
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Serving Suggestion</h3>
                  <p className="text-sm text-muted-foreground">
                    {recipe.serving_suggestion}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
