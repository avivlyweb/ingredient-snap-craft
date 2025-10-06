import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IngredientListProps {
  ingredients: string[];
  onGenerateRecipe: (ingredients: string[]) => void;
  isGenerating: boolean;
}

export const IngredientList = ({ 
  ingredients: initialIngredients, 
  onGenerateRecipe,
  isGenerating 
}: IngredientListProps) => {
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [newIngredient, setNewIngredient] = useState("");

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients(prev => [...prev, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <Card className="p-6 bg-card">
        <h3 className="text-xl font-semibold mb-4">Your Ingredients</h3>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="px-4 py-2 text-sm flex items-center gap-2"
              >
                {ingredient}
                <button
                  onClick={() => removeIngredient(index)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
              placeholder="Add another ingredient..."
              className="flex-1"
            />
            <Button onClick={addIngredient} size="icon" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Button
        onClick={() => onGenerateRecipe(ingredients)}
        disabled={isGenerating || ingredients.length === 0}
        size="lg"
        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating Recipe...
          </>
        ) : (
          "Generate My Recipe!"
        )}
      </Button>
    </div>
  );
};
