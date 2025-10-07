import { useState } from "react";
import { IngredientUpload } from "@/components/IngredientUpload";
import { IngredientList } from "@/components/IngredientList";
import { ContextSelection } from "@/components/ContextSelection";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import { RecipeGallery } from "@/components/RecipeGallery";
import { RecipeGenerationAnimation } from "@/components/RecipeGenerationAnimation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";

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
}

const Index = () => {
  const [step, setStep] = useState<'upload' | 'ingredients' | 'context' | 'recipe'>('upload');
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>([]);
  const [ingredientImages, setIngredientImages] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);

  const handleIngredientsExtracted = (ingredients: string[], imageUrls: string[]) => {
    setExtractedIngredients(ingredients);
    setIngredientImages(imageUrls);
    setStep('ingredients');
  };

  const handleContextSelected = (contextType: string) => {
    setSelectedContext(contextType);
    setStep('context');
  };

  const handleProceedToRecipe = () => {
    handleGenerateRecipe(extractedIngredients, selectedContext);
  };

  const handleGenerateRecipe = async (ingredients: string[], contextType: string) => {
    setIsGenerating(true);
    setStep('recipe');
    try {
      // Generate recipe
      const { data: recipeData, error: recipeError } = await supabase.functions.invoke(
        'generate-recipe',
        { body: { ingredients, contextType } }
      );

      if (recipeError) throw recipeError;
      if (recipeData?.error) {
        toast.error(recipeData.error);
        return;
      }

      const recipe = recipeData.recipe;

      // Generate recipe image
      const { data: imageData, error: imageError } = await supabase.functions.invoke(
        'generate-recipe-image',
        { 
          body: { 
            recipeTitle: recipe.title,
            cuisineStyle: recipe.cuisine_style,
            ingredients: recipe.ingredients
          } 
        }
      );

      if (!imageError && imageData?.imageUrl) {
        recipe.image_url = imageData.imageUrl;
      }

      setGeneratedRecipe(recipe);
      setStep('recipe');
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error('Error generating recipe:', error);
      toast.error("Failed to generate recipe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToGallery = async () => {
    if (!generatedRecipe) return;

    setIsAddingToGallery(true);
    try {
      const { error } = await supabase.from('recipes').insert({
        title: generatedRecipe.title,
        description: generatedRecipe.description,
        ingredients: generatedRecipe.ingredients,
        steps: generatedRecipe.steps,
        cuisine_style: generatedRecipe.cuisine_style,
        serving_suggestion: generatedRecipe.serving_suggestion,
        image_url: generatedRecipe.image_url,
        ingredient_images: ingredientImages,
        context_type: generatedRecipe.context_type,
        plating_guidance: generatedRecipe.plating_guidance,
        time_management: generatedRecipe.time_management,
        ambiance_suggestions: generatedRecipe.ambiance_suggestions,
        leftover_tips: generatedRecipe.leftover_tips
      });

      if (error) throw error;

      toast.success("Recipe added to gallery!");
      
      // Reset to start
      setStep('upload');
      setExtractedIngredients([]);
      setIngredientImages([]);
      setGeneratedRecipe(null);
    } catch (error) {
      console.error('Error adding to gallery:', error);
      toast.error("Failed to add recipe to gallery.");
    } finally {
      setIsAddingToGallery(false);
    }
  };

  const handleStartOver = () => {
    setStep('upload');
    setExtractedIngredients([]);
    setIngredientImages([]);
    setSelectedContext('');
    setGeneratedRecipe(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Recipe Creator</h1>
            </div>
            {step !== 'upload' && (
              <button
                onClick={handleStartOver}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          {step === 'upload' && (
            <div className="text-center space-y-4 mb-8">
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Create a Recipe from Your Ingredients
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload photos of your ingredients and instantly get a unique, AI-generated recipe
              </p>
            </div>
          )}

          {/* Step Content */}
          {step === 'upload' && (
            <IngredientUpload onIngredientsExtracted={handleIngredientsExtracted} />
          )}

          {step === 'ingredients' && (
            <IngredientList
              ingredients={extractedIngredients}
              onGenerateRecipe={(ingredients) => {
                setExtractedIngredients(ingredients);
                setStep('context');
              }}
              isGenerating={false}
            />
          )}

          {step === 'context' && (
            <>
              <ContextSelection onSelectContext={handleContextSelected} />
              {selectedContext && (
                <div className="flex justify-center">
                  <Button
                    onClick={handleProceedToRecipe}
                    disabled={isGenerating}
                    size="lg"
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity px-12"
                  >
                    {isGenerating ? "Generating Recipe..." : "Generate My Recipe!"}
                  </Button>
                </div>
              )}
            </>
          )}

          {step === 'recipe' && (
            <>
              {isGenerating ? (
                <RecipeGenerationAnimation ingredients={extractedIngredients} />
              ) : generatedRecipe ? (
                <RecipeDisplay
                  recipe={generatedRecipe}
                  onAddToGallery={handleAddToGallery}
                  isAdding={isAddingToGallery}
                />
              ) : null}
            </>
          )}

          {/* Community Gallery */}
          <div className="pt-12">
            <Separator className="mb-8" />
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Community Recipe Gallery</h2>
              <p className="text-muted-foreground">
                See what the community is cooking!
              </p>
            </div>
            <RecipeGallery />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
