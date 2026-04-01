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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User, Session } from "@supabase/supabase-js";
import { demoRecipe, demoIngredients, demoIngredientImages } from "@/components/DemoRecipe";
import {
  Sparkles,
  Flame,
  Heart,
  ChefHat,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Edit,
} from "lucide-react";

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
    type: "benefit" | "synergy" | "tip";
  }>;
}

type FunnelStep = "upload" | "ingredients" | "context" | "review" | "generating" | "recipe";

const contextLabels: Record<string, string> = {
  date_night: "Date Night",
  family_dinner: "Family Dinner",
  quick_lunch: "Quick Weeknight",
  meal_prep: "Meal Prep",
  budget_friendly: "Budget Conscious",
  athletic_performance: "Athletic Performance",
};

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const [step, setStep] = useState<FunnelStep>("upload");
  const [extractedIngredients, setExtractedIngredients] = useState<string[]>([]);
  const [ingredientImages, setIngredientImages] = useState<string[]>([]);
  const [selectedContext, setSelectedContext] = useState<string>("");
  const [selectedHealthGoals, setSelectedHealthGoals] = useState<string[]>([]);
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);
  const [recipeCount, setRecipeCount] = useState(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  useEffect(() => {
    setRecipeCount(parseInt(localStorage.getItem("recipeCount") || "0"));
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) setTimeout(() => fetchProfile(session.user.id), 0);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("username, avatar_url").eq("user_id", userId).single();
    if (data) setProfile(data);
  };

  const handleIngredientsExtracted = (ingredients: string[], imageUrls: string[]) => {
    setExtractedIngredients(ingredients);
    setIngredientImages(imageUrls);
    setStep("ingredients");
  };

  // Context confirmed — no auto-generation, go to review
  const handleContextConfirmed = (contextType: string, healthGoals?: string[]) => {
    setSelectedContext(contextType);
    setSelectedHealthGoals(healthGoals || []);
    setStep("review");
  };

  const freeRemaining = Math.max(0, 3 - recipeCount);

  const handleGenerate = async () => {
    if (!user && recipeCount >= 3) {
      toast.error("You've reached your free recipe limit!", {
        description: "Sign up to generate unlimited recipes",
      });
      navigate("/auth");
      return;
    }
    setIsGenerating(true);
    setGenerationError(null);
    setStep("generating");
    try {
      const { data: recipeData, error: recipeError } = await supabase.functions.invoke("generate-recipe", {
        body: { ingredients: extractedIngredients, contextType: selectedContext, healthGoals: selectedHealthGoals },
      });
      if (recipeError) throw recipeError;
      if (recipeData?.error) throw new Error(recipeData.error);
      const recipe = recipeData.recipe;

      const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-recipe-image", {
        body: { recipeTitle: recipe.title, cuisineStyle: recipe.cuisine_style, ingredients: recipe.ingredients },
      });
      if (!imageError && imageData?.imageUrl) recipe.image_url = imageData.imageUrl;

      setGeneratedRecipe(recipe);
      setStep("recipe");

      if (!user) {
        const newCount = recipeCount + 1;
        setRecipeCount(newCount);
        localStorage.setItem("recipeCount", newCount.toString());
        if (newCount >= 3) toast.info("This was your last free recipe!", { description: "Sign up for unlimited recipes" });
      }
      toast.success("Recipe generated successfully!");
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      setGenerationError(error.message || "Failed to generate recipe. Please try again.");
      setStep("review"); // Stay actionable
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddToGallery = async () => {
    if (!generatedRecipe) return;
    setIsAddingToGallery(true);
    try {
      const { error } = await supabase.from("recipes").insert({
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
        user_avatar: profile?.avatar_url || null,
      });
      if (error) throw error;
      toast.success("Recipe added to gallery!");
      handleStartOver();
    } catch (error) {
      console.error("Error adding to gallery:", error);
      toast.error("Failed to add recipe to gallery.");
    } finally {
      setIsAddingToGallery(false);
    }
  };

  const handleStartOver = () => {
    setStep("upload");
    setExtractedIngredients([]);
    setIngredientImages([]);
    setSelectedContext("");
    setSelectedHealthGoals([]);
    setGeneratedRecipe(null);
    setGenerationError(null);
  };

  const handleTryDemo = () => {
    setExtractedIngredients(demoIngredients);
    setIngredientImages(demoIngredientImages);
    setSelectedContext("athletic_performance");
    setSelectedHealthGoals(["muscle_building", "heart_health", "energy_boost"]);
    setGeneratedRecipe(demoRecipe);
    setStep("recipe");
    toast.success("Demo loaded! Check out the nutrition-optimized recipe 🚀");
  };

  const goBack = () => {
    switch (step) {
      case "ingredients": setStep("upload"); break;
      case "context": setStep("ingredients"); break;
      case "review": setStep("context"); break;
      case "recipe": setStep("review"); break;
    }
  };

  const stepIndex = { upload: 1, ingredients: 2, context: 3, review: 4, generating: 4, recipe: 5 };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Hero — upload step only */}
          {step === "upload" && (
            <div className="text-center space-y-6 mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-full mb-4 animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-sm font-medium">Powered by Scientific Nutrition Data</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
                Create Nutrition-Optimized Recipes
              </h1>

              <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in">
                Upload photos of your ingredients and get AI-generated recipes with detailed nutritional analysis
              </p>

              {!user && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full animate-fade-in">
                  <span className="text-sm font-medium">
                    🎉 {freeRemaining} free {freeRemaining === 1 ? "recipe" : "recipes"} remaining
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

              <div className="pt-4">
                <Button onClick={handleTryDemo} size="lg" variant="outline" className="group">
                  <Sparkles className="h-4 w-4 mr-2 group-hover:animate-pulse" />
                  Try Interactive Demo
                </Button>
              </div>
            </div>
          )}

          {/* Progress bar — steps 2–5 */}
          {step !== "upload" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                {step !== "generating" && (
                  <Button variant="ghost" size="sm" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleStartOver}>
                  Start Over
                </Button>
              </div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i <= stepIndex[step] ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === "upload" && <IngredientUpload onIngredientsExtracted={handleIngredientsExtracted} />}

          {/* Step 2: Ingredients */}
          {step === "ingredients" && (
            <IngredientList
              ingredients={extractedIngredients}
              onGenerateRecipe={(ingredients) => {
                setExtractedIngredients(ingredients);
                setStep("context");
              }}
              isGenerating={false}
            />
          )}

          {/* Step 3: Context & goals */}
          {step === "context" && (
            <div className="space-y-6">
              <NutritionGoalTracker ingredients={extractedIngredients} healthGoals={selectedHealthGoals} servings={4} />
              <RecipeOptimizationSuggestions
                ingredients={extractedIngredients}
                healthGoals={selectedHealthGoals}
                onApplySwap={(original, replacement) => {
                  setExtractedIngredients((prev) => prev.map((ing) => (ing === original ? replacement : ing)));
                }}
              />
              <NutritionEnhancedContextSelection onSelectContext={handleContextConfirmed} />
            </div>
          )}

          {/* Step 4: Review card */}
          {step === "review" && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Review & Generate</h2>
                <p className="text-muted-foreground">Confirm your selections before generating your recipe</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recipe Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Ingredients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Ingredients ({extractedIngredients.length})</h4>
                      <Button variant="ghost" size="sm" onClick={() => setStep("ingredients")}>
                        <Edit className="w-3 h-3 mr-1" /> Edit
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {extractedIngredients.map((ing, i) => (
                        <Badge key={i} variant="secondary">{ing}</Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Context */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Context</h4>
                      <Button variant="ghost" size="sm" onClick={() => setStep("context")}>
                        <Edit className="w-3 h-3 mr-1" /> Change
                      </Button>
                    </div>
                    <Badge>{contextLabels[selectedContext] || selectedContext}</Badge>
                  </div>

                  {/* Health goals */}
                  {selectedHealthGoals.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Health Goals</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedHealthGoals.map((goal) => (
                            <Badge key={goal} variant="outline">{goal.replace(/_/g, " ")}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Free remaining */}
                  {!user && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        🎉 {freeRemaining} free {freeRemaining === 1 ? "recipe" : "recipes"} remaining
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Generation error inline */}
              {generationError && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-destructive font-medium">{generationError}</p>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleGenerate}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Retry
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStep("ingredients")}>
                        <Edit className="w-3 h-3 mr-1" /> Edit ingredients
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Primary CTA */}
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-5 h-5 mr-2" /> Generate My Recipe
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step: Generating */}
          {step === "generating" && <RecipeGenerationAnimation ingredients={extractedIngredients} />}

          {/* Step 5: Recipe result */}
          {step === "recipe" && generatedRecipe && (
            <div className="space-y-6">
              <RecipeDisplay recipe={generatedRecipe} onAddToGallery={handleAddToGallery} isAdding={isAddingToGallery} />
              <div className="flex justify-center gap-4 flex-wrap">
                <Button variant="outline" onClick={handleStartOver}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Create Another
                </Button>
                <Button variant="outline" onClick={() => setStep("context")}>
                  <Edit className="w-4 h-4 mr-2" /> Try Another Context
                </Button>
              </div>
            </div>
          )}

          {/* Community Gallery — below the fold */}
          <div className="pt-12">
            <Separator className="mb-8" />
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="create" onClick={() => step !== "upload" && handleStartOver()}>
                  <ChefHat className="w-4 h-4 mr-2" /> Create
                </TabsTrigger>
                <TabsTrigger value="gallery">
                  <Heart className="w-4 h-4 mr-2" /> Community Gallery
                </TabsTrigger>
              </TabsList>
              <TabsContent value="gallery" className="mt-8">
                <div className="text-center space-y-2 mb-8">
                  <h2 className="text-3xl font-bold">Community Recipe Gallery</h2>
                  <p className="text-muted-foreground">See what the community is cooking!</p>
                </div>
                <RecipeGallery />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
