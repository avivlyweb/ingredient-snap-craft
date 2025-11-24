import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IngredientAutocomplete } from "./IngredientAutocomplete";
import { IngredientCategoryPicker } from "./IngredientCategoryPicker";

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

  const removeIngredient = (index: number) => {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addIngredient = (ingredient: string) => {
    if (ingredient.trim() && !ingredients.includes(ingredient.trim())) {
      setIngredients(prev => [...prev, ingredient.trim()]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="p-6 bg-card">
        <h3 className="text-xl font-semibold mb-4">Your Ingredients</h3>
        
        {/* Selected Ingredients Display */}
        {ingredients.length > 0 && (
          <div className="mb-6">
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
          </div>
        )}

        {/* Add Ingredients Tabs */}
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="search">🔍 Search Database</TabsTrigger>
            <TabsTrigger value="categories">📂 Browse Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Search from 2000+ ingredients with nutritional data
              </p>
            </div>
            <IngredientAutocomplete onSelect={addIngredient} />
          </TabsContent>
          
          <TabsContent value="categories" className="space-y-4">
            <IngredientCategoryPicker 
              onSelect={addIngredient}
              selectedIngredients={ingredients}
            />
          </TabsContent>
        </Tabs>
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
