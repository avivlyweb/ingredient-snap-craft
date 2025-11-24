import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { IngredientUpload } from "@/components/IngredientUpload";
import { IngredientList } from "@/components/IngredientList";
import { NutritionEnhancedContextSelection } from "@/components/NutritionEnhancedContextSelection";
import { NutritionGoalTracker } from "@/components/NutritionGoalTracker";
import { RecipeOptimizationSuggestions } from "@/components/RecipeOptimizationSuggestions";
import { RecipeDisplay } from "@/components/RecipeDisplay";
import { RecipeGallery } from "@/components/RecipeGallery";
import { RecipeGenerationAnimation } from "@/components/RecipeGenerationAnimation";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { User, Session } from "@supabase/supabase-js";
import { demoRecipe, demoIngredients, demoIngredientImages } from "@/components/DemoRecipe";
import { Sparkles, Flame, Heart } from "lucide-react";

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

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [step, setStep] = useState<'upload' | 'ingredients' | 'context' | 'recipe'>('upload');
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>([]);
  const [ingredientImages, setIngredientImages] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>('');
  const [selectedHealthGoals, setSelectedHealthGoals] = useState<string[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);

  // Track recipe generation count for free users
  useEffect(() => {
    const count = parseInt(localStorage.getItem('recipeCount') || '0');
    setRecipeCount(count);
  }, []);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfile(data);
    }
  };

  const handleIngredientsExtracted = (ingredients: string[], imageUrls: string[]) => {
    setExtractedIngredients(ingredients);
    setIngredientImages(imageUrls);
    setStep('ingredients');
  };

  const handleContextSelected = (contextType: string, healthGoals?: string[]) => {
    // Check if user is logged in or within free limit
    if (!user && recipeCount >= 3) {
      toast.error("You've reached your free recipe limit!", {
        description: "Sign up to generate unlimited recipes"
      });
      navigate("/auth");
      return;
    }
    
    setSelectedContext(contextType);
    setSelectedHealthGoals(healthGoals || []);
    handleGenerateRecipe(extractedIngredients, contextType, healthGoals);
  };

  const handleGenerateRecipe = async (
    ingredients: string[], 
    contextType: string, 
    healthGoals?: string[]
  ) => {
    setIsGenerating(true);
    setStep('recipe');
    try {
      // Generate recipe with health goals
      const { data: recipeData, error: recipeError } = await supabase.functions.invoke(
        'generate-recipe',
        { body: { ingredients, contextType, healthGoals } }
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
      
      // Increment recipe count for free users
      if (!user) {
        const newCount = recipeCount + 1;
        setRecipeCount(newCount);
        localStorage.setItem('recipeCount', newCount.toString());
        
        if (newCount >= 3) {
          toast.info("This was your last free recipe!", {
            description: "Sign up to continue generating unlimited recipes"
          });
        }
      }
      
      toast.success("Recipe generated successfully!");
    } catch (error) {
      console.error('Error generating recipe:', error);
      toast.error("Failed to generate recipe. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToGallery = async () => {
    if (!generatedRecipe) {
      toast.error("No recipe to save");
      return;
    }

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
        leftover_tips: generatedRecipe.leftover_tips,
        user_id: user?.id || null,
        username: profile?.username || "Anonymous Chef",
        user_avatar: profile?.avatar_url || null
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
    setSelectedHealthGoals([]);
    setGeneratedRecipe(null);
  };

  const handleTryDemo = () => {
    setExtractedIngredients(demoIngredients);
    setIngredientImages(demoIngredientImages);
    setSelectedContext('athletic_performance');
    setSelectedHealthGoals(['muscle_building', 'heart_health', 'energy_boost']);
    setGeneratedRecipe(demoRecipe);
    setStep('recipe');
    toast.success("Demo loaded! Check out the nutrition-optimized recipe 🚀", {
      description: "Notice the detailed nutritional breakdown and health insights"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero Section */}
          {step === 'upload' && (
            <div className="text-center space-y-6 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-full mb-4 animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Powered by Scientific Nutrition Data</span>
                <Badge variant="secondary" className="text-xs">NEVO 2023</Badge>
              </div>
              
              <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                Create Nutrition-Optimized Recipes
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
                Upload photos of your ingredients and get AI-generated recipes with detailed nutritional analysis and health insights
              </p>
              
              {!user && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full animate-fade-in">
                  <span className="text-sm font-medium">
                    🎉 {3 - recipeCount} free {3 - recipeCount === 1 ? 'recipe' : 'recipes'} remaining
                  </span>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-3 pt-4 animate-fade-in">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Calorie Tracking</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span className="text-sm font-medium">Health Insights</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Nutrient Synergies</span>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  onClick={handleTryDemo}
                  size="lg"
                  variant="outline"
                  className="group hover:scale-105 transition-all hover:border-primary hover:bg-primary/5"
                >
                  <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  Try Interactive Demo
                  <Badge variant="secondary" className="ml-2">See it in action!</Badge>
                </Button>
              </div>
            </div>
          )}

          {step !== 'upload' && (
            <div className="flex justify-center mb-4">
              <Button variant="outline" onClick={handleStartOver}>
                Start Over
              </Button>
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
            <div className="space-y-6">
              <NutritionGoalTracker 
                ingredients={extractedIngredients}
                healthGoals={selectedHealthGoals}
                servings={4}
              />
              
              <RecipeOptimizationSuggestions
                ingredients={extractedIngredients}
                healthGoals={selectedHealthGoals}
                onApplySwap={(original, replacement) => {
                  setExtractedIngredients(prev =>
                    prev.map(ing => ing === original ? replacement : ing)
                  );
                }}
              />
              
              <NutritionEnhancedContextSelection onSelectContext={handleContextSelected} />
            </div>
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
