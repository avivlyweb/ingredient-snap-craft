import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import MedicalDisclaimer from "@/components/recovery/MedicalDisclaimer";
import RecoveryGoalCalculator from "@/components/recovery/RecoveryGoalCalculator";
import RecoveryContextSelection from "@/components/recovery/RecoveryContextSelection";
import BarrierTips from "@/components/recovery/BarrierTips";
import ClinicalRationale from "@/components/recovery/ClinicalRationale";
import { ClinicianDashboard } from "@/components/recovery/ClinicianDashboard";
import { CognitiveLightModeUI } from "@/components/recovery/CognitiveLightModeUI";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { IngredientUpload } from "@/components/IngredientUpload";
import { IngredientList } from "@/components/IngredientList";
import { RecipeGenerationAnimation } from "@/components/RecipeGenerationAnimation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NutritionLabel } from "@/components/NutritionLabel";
import { HealthInsights } from "@/components/HealthInsights";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { ArrowLeft, ChefHat, Drumstick, Flame, RefreshCw, Share2, Loader2, Stethoscope, Brain, LogIn } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface RecoveryGoals {
  weight: number;
  proteinTarget: number;
  calorieTarget: number;
}

interface ClinicalRationaleItem {
  topic: string;
  mechanism: string;
  evidence_grade: string;
}

interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  health_insights: Array<{
    title: string;
    description: string;
    type: string;
  }>;
  patient_tips?: string[];
  clinical_rationale?: ClinicalRationaleItem[];
  cuisine_style?: string;
  serving_suggestion?: string;
  context_type?: string;
  plating_guidance?: string;
  time_management?: string;
  ambiance_suggestions?: string;
  leftover_tips?: string;
  image_url?: string;
}

type RecoveryStep = "disclaimer" | "setup" | "context" | "ingredients" | "generating" | "recipe";

interface Profile {
  username: string;
  avatar_url: string | null;
}

const Recovery = () => {
  const [currentStep, setCurrentStep] = useState<RecoveryStep>("disclaimer");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [recoveryGoals, setRecoveryGoals] = useState<RecoveryGoals | null>(null);
  const [selectedContext, setSelectedContext] = useState<string>("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);
  const [addedToGallery, setAddedToGallery] = useState(false);
  const [isClinicianMode, setIsClinicianMode] = useState(() => {
    return localStorage.getItem("recoveryClinicianMode") === "true";
  });
  const [isCognitiveLightMode, setIsCognitiveLightMode] = useState(() => {
    return localStorage.getItem("cognitiveLightMode") === "true";
  });
  const [dailyStats, setDailyStats] = useState({ protein: 0, calories: 0, steps: 0, activityMinutes: 0 });

  // Persist clinician mode preference
  useEffect(() => {
    localStorage.setItem("recoveryClinicianMode", isClinicianMode.toString());
  }, [isClinicianMode]);

  // Persist cognitive light mode preference
  useEffect(() => {
    localStorage.setItem("cognitiveLightMode", isCognitiveLightMode.toString());
  }, [isCognitiveLightMode]);

  // Fetch today's stats for cognitive light mode and voice context
  useEffect(() => {
    const fetchDailyStats = async () => {
      if (!user) return;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();

      const [foodResult, activityResult] = await Promise.all([
        supabase
          .from("food_logs")
          .select("estimated_protein, estimated_calories")
          .eq("user_id", user.id)
          .gte("created_at", todayIso),
        supabase
          .from("activity_logs")
          .select("step_count, duration_minutes")
          .eq("user_id", user.id)
          .gte("created_at", todayIso),
      ]);

      const totalProtein = (foodResult.data || []).reduce((sum, log) => sum + (log.estimated_protein || 0), 0);
      const totalCalories = (foodResult.data || []).reduce((sum, log) => sum + (log.estimated_calories || 0), 0);
      const totalSteps = (activityResult.data || []).reduce((sum, log) => sum + (log.step_count || 0), 0);
      const totalMinutes = (activityResult.data || []).reduce((sum, log) => sum + (log.duration_minutes || 0), 0);

      setDailyStats({
        protein: totalProtein,
        calories: totalCalories,
        steps: totalSteps,
        activityMinutes: totalMinutes,
      });
    };

    fetchDailyStats();
  }, [user]);

  // Get user session and profile
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('user_id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    }
  };

  // Check if user has already accepted disclaimer
  useEffect(() => {
    const accepted = localStorage.getItem("recoveryDisclaimerAccepted");
    const savedGoals = localStorage.getItem("recoveryGoals");
    
    if (accepted === "true") {
      setDisclaimerAccepted(true);
      setCurrentStep("setup");
      
      if (savedGoals) {
        setRecoveryGoals(JSON.parse(savedGoals));
      }
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("recoveryDisclaimerAccepted", "true");
    setDisclaimerAccepted(true);
    setCurrentStep("setup");
  };

  const handleGoalsCalculated = (goals: RecoveryGoals) => {
    setRecoveryGoals(goals);
  };

  const handleContextSelect = (contextId: string) => {
    setSelectedContext(contextId);
  };

  const handleIngredientsExtracted = (newIngredients: string[]) => {
    setIngredients(prev => [...new Set([...prev, ...newIngredients])]);
  };

  const generateRecipe = async (ingredientList: string[]) => {
    if (ingredientList.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }

    setIngredients(ingredientList);
    setCurrentStep("generating");
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: { 
          ingredients: ingredientList, 
          contextType: selectedContext,
          recoveryGoals 
        }
      });

      if (error) throw error;

      const recipe = data.recipe;

      // Generate recipe image
      const { data: imageData, error: imageError } = await supabase.functions.invoke(
        'generate-recipe-image',
        { 
          body: { 
            recipeTitle: recipe.title,
            cuisineStyle: recipe.cuisine_style || "Recovery",
            ingredients: recipe.ingredients
          } 
        }
      );

      if (!imageError && imageData?.imageUrl) {
        recipe.image_url = imageData.imageUrl;
      }

      // Ensure minimum animation time
      await new Promise(resolve => setTimeout(resolve, 8000));

      setCurrentRecipe(recipe);
      setCurrentStep("recipe");
    } catch (error) {
      console.error("Error generating recipe:", error);
      toast.error("Failed to generate recipe. Please try again.");
      setCurrentStep("ingredients");
    } finally {
      setIsGenerating(false);
    }
  };

  const startOver = () => {
    setCurrentStep("setup");
    setSelectedContext("");
    setIngredients([]);
    setCurrentRecipe(null);
    setAddedToGallery(false);
  };

  const handleAddToGallery = async () => {
    if (!currentRecipe) return;
    
    setIsAddingToGallery(true);
    try {
      const { error } = await supabase.from('recipes').insert({
        title: currentRecipe.title,
        description: currentRecipe.description,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        cuisine_style: currentRecipe.cuisine_style || "Recovery Recipe",
        serving_suggestion: currentRecipe.serving_suggestion,
        image_url: currentRecipe.image_url,
        context_type: selectedContext,
        plating_guidance: currentRecipe.plating_guidance,
        time_management: currentRecipe.time_management,
        ambiance_suggestions: currentRecipe.ambiance_suggestions,
        leftover_tips: currentRecipe.leftover_tips,
        user_id: user?.id || null,
        username: profile?.username || "Recovery Chef",
        user_avatar: profile?.avatar_url || null
      });

      if (error) throw error;

      setAddedToGallery(true);
      toast.success("Recipe added to Community Gallery!");
    } catch (error) {
      console.error('Error adding to gallery:', error);
      toast.error("Failed to add recipe to gallery.");
    } finally {
      setIsAddingToGallery(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "context":
        setCurrentStep("setup");
        break;
      case "ingredients":
        setCurrentStep("context");
        break;
      case "recipe":
        setCurrentStep("ingredients");
        break;
    }
  };

  const proceedToContext = () => {
    if (!recoveryGoals) {
      toast.error("Please calculate your recovery goals first");
      return;
    }
    setCurrentStep("context");
  };

  const proceedToIngredients = () => {
    if (!selectedContext) {
      toast.error("Please select a barrier to address");
      return;
    }
    setCurrentStep("ingredients");
  };

  // Render disclaimer
  if (!disclaimerAccepted) {
    return <MedicalDisclaimer onAccept={handleAcceptDisclaimer} />;
  }

  // Render Cognitive Light Mode if enabled
  if (isCognitiveLightMode && recoveryGoals) {
    const proteinProgress = (dailyStats.protein / recoveryGoals.proteinTarget) * 100;
    const stepsProgress = (dailyStats.steps / 2000) * 100; // Default step target
    
    return (
      <CognitiveLightModeUI
        userName={profile?.username || "Patiënt"}
        proteinProgress={Math.min(proteinProgress, 100)}
        stepsProgress={Math.min(stepsProgress, 100)}
        onExitLightMode={() => setIsCognitiveLightMode(false)}
        recoveryContext={{
          proteinTarget: recoveryGoals.proteinTarget,
          calorieTarget: recoveryGoals.calorieTarget,
          stepTarget: 2000,
          contextType: selectedContext,
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Mode Toggles */}
      <div className="container mx-auto px-4 pt-4 max-w-4xl space-y-3">
        {/* Auth Banner for unauthenticated users */}
        {!user && (
          <div className="flex items-center justify-between gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Sign in to save your health logs</p>
                <p className="text-muted-foreground">Track your recovery progress over time</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) toast.error("Sign-in failed");
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border">
          {/* Cognitive Light Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="w-4 h-4" />
              <Label htmlFor="cognitive-light-mode" className="cursor-pointer font-medium">
                Rustige Modus
              </Label>
            </div>
            <Switch
              id="cognitive-light-mode"
              checked={isCognitiveLightMode}
              onCheckedChange={setIsCognitiveLightMode}
            />
          </div>
          
          {/* Clinician Mode Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Stethoscope className="w-4 h-4" />
              <Label htmlFor="clinician-mode" className="cursor-pointer font-medium">
                Clinician View
              </Label>
            </div>
            <Switch
              id="clinician-mode"
              checked={isClinicianMode}
              onCheckedChange={setIsClinicianMode}
            />
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress indicator */}
        {currentStep !== "generating" && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Recovery Progress</span>
              <span>
                {currentStep === "setup" && "Step 1: Set Goals"}
                {currentStep === "context" && "Step 2: Select Challenge"}
                {currentStep === "ingredients" && "Step 3: Add Ingredients"}
                {currentStep === "recipe" && "Your Recipe"}
              </span>
            </div>
            <Progress 
              value={
                currentStep === "setup" ? 25 :
                currentStep === "context" ? 50 :
                currentStep === "ingredients" ? 75 :
                100
              } 
              className="h-2"
            />
          </div>
        )}

        {/* Back button */}
        {(currentStep === "context" || currentStep === "ingredients" || currentStep === "recipe") && (
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <AnimatePresence mode="wait">
          {/* Setup Step */}
          {currentStep === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">Recovery Nutrition Support</h1>
                <p className="text-muted-foreground">
                  Personalized recipes to support your post-operative recovery
                </p>
              </div>

              <RecoveryGoalCalculator 
                onGoalsCalculated={handleGoalsCalculated}
                initialGoals={recoveryGoals}
              />

              {recoveryGoals && (
                <div className="flex justify-center">
                  <Button onClick={proceedToContext} size="lg">
                    Continue to Challenge Selection
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* Context Selection Step */}
          {currentStep === "context" && (
            <motion.div
              key="context"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Show current goals */}
              {recoveryGoals && (
                <Card className="bg-muted/30">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Drumstick className="w-4 h-4 text-secondary" />
                        <span className="font-medium">{recoveryGoals.proteinTarget}g protein</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Flame className="w-4 h-4 text-primary" />
                        <span className="font-medium">{recoveryGoals.calorieTarget} kcal</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Daily targets</span>
                  </CardContent>
                </Card>
              )}

              <RecoveryContextSelection 
                onSelectContext={handleContextSelect}
                selectedContext={selectedContext}
              />

              {selectedContext && (
                <>
                  <BarrierTips barrierId={selectedContext} />
                  <div className="flex justify-center">
                    <Button onClick={proceedToIngredients} size="lg">
                      <ChefHat className="w-4 h-4 mr-2" />
                      Create Recipe for This Challenge
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Ingredients Step */}
          {currentStep === "ingredients" && (
            <motion.div
              key="ingredients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold">Add Your Ingredients</h2>
                <p className="text-muted-foreground">
                  Upload a photo or search from our database
                </p>
              </div>

              <IngredientUpload onIngredientsExtracted={handleIngredientsExtracted} />

              <IngredientList
                ingredients={ingredients}
                onGenerateRecipe={generateRecipe}
                isGenerating={isGenerating}
              />
            </motion.div>
          )}

          {/* Generating Step */}
          {currentStep === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <RecipeGenerationAnimation ingredients={ingredients} />
            </motion.div>
          )}

          {/* Recipe Display Step */}
          {currentStep === "recipe" && currentRecipe && (
            <motion.div
              key="recipe"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Nutrition progress toward daily goals */}
              {recoveryGoals && (
                <Card className="border-secondary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">This Recipe Contributes to Your Daily Goals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Protein</span>
                        <span className="font-medium">
                          {currentRecipe.nutrition.protein}g / {recoveryGoals.proteinTarget}g daily
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((currentRecipe.nutrition.protein / recoveryGoals.proteinTarget) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Calories</span>
                        <span className="font-medium">
                          {currentRecipe.nutrition.calories} / {recoveryGoals.calorieTarget} daily
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((currentRecipe.nutrition.calories / recoveryGoals.calorieTarget) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Custom Recipe Display for Recovery */}
              <Card className="overflow-hidden bg-card shadow-lg">
                {currentRecipe.image_url && (
                  <div className="relative h-[300px] md:h-[400px] overflow-hidden">
                    <img
                      src={currentRecipe.image_url}
                      alt={currentRecipe.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <Badge className="mb-3 bg-secondary text-secondary-foreground">
                        {currentRecipe.cuisine_style || "Recovery Recipe"}
                      </Badge>
                      <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                        {currentRecipe.title}
                      </h2>
                    </div>
                  </div>
                )}

                <div className="p-8 space-y-6">
                  {!currentRecipe.image_url && (
                    <div className="space-y-2">
                      <Badge className="bg-secondary text-secondary-foreground">
                        {currentRecipe.cuisine_style || "Recovery Recipe"}
                      </Badge>
                      <h2 className="text-3xl font-bold">{currentRecipe.title}</h2>
                    </div>
                  )}

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {currentRecipe.description}
                  </p>

                  {currentRecipe.nutrition && (
                    <>
                      <Separator />
                      <NutritionLabel nutrition={currentRecipe.nutrition} servings={4} />
                    </>
                  )}

                  {/* Patient Tips - shown to everyone */}
                  {currentRecipe.patient_tips && currentRecipe.patient_tips.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          💡 Recovery Tips
                        </h3>
                        <ul className="space-y-2">
                          {currentRecipe.patient_tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-secondary mt-0.5">✓</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Clinical Rationale - only shown in clinician mode */}
                  {isClinicianMode && currentRecipe.clinical_rationale && currentRecipe.clinical_rationale.length > 0 && (
                    <>
                      <Separator />
                      <ClinicalRationale 
                        rationale={currentRecipe.clinical_rationale} 
                        recipeTitle={currentRecipe.title} 
                      />
                    </>
                  )}

                  {currentRecipe.health_insights && currentRecipe.health_insights.length > 0 && (
                    <>
                      <Separator />
                      <HealthInsights 
                        insights={currentRecipe.health_insights.map(i => ({
                          ...i,
                          type: i.type as 'benefit' | 'synergy' | 'tip'
                        }))} 
                        contextType={currentRecipe.context_type}
                      />
                    </>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
                    <ul className="space-y-2">
                      {currentRecipe.ingredients.map((ingredient, index) => (
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
                      {currentRecipe.steps}
                    </div>
                  </div>

                  {currentRecipe.serving_suggestion && (
                    <>
                      <Separator />
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">Serving Suggestion</h3>
                        <p className="text-muted-foreground">{currentRecipe.serving_suggestion}</p>
                      </div>
                    </>
                  )}

                  {currentRecipe.time_management && (
                    <>
                      <Separator />
                      <div className="bg-secondary/10 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">⏱️ Time Management</h3>
                        <p className="text-muted-foreground">{currentRecipe.time_management}</p>
                      </div>
                    </>
                  )}

                  {currentRecipe.leftover_tips && (
                    <>
                      <Separator />
                      <div className="bg-muted/30 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2">♻️ Leftover Tips</h3>
                        <p className="text-muted-foreground">{currentRecipe.leftover_tips}</p>
                      </div>
                    </>
                  )}
                </div>
              </Card>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={startOver}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Create Another Recipe
                </Button>
                <Button 
                  onClick={handleAddToGallery} 
                  disabled={isAddingToGallery || addedToGallery}
                >
                  {isAddingToGallery ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : addedToGallery ? (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Added to Gallery
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share to Gallery
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clinician Dashboard - only in clinician mode */}
        {isClinicianMode && recoveryGoals && currentStep !== "generating" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <ClinicianDashboard 
              proteinTarget={recoveryGoals.proteinTarget}
              calorieTarget={recoveryGoals.calorieTarget}
            />
          </motion.div>
        )}
      </main>

      {/* Voice Button - floating action button */}
      {disclaimerAccepted && (
        <VoiceButton
          recoveryContext={{
            contextType: selectedContext,
            proteinTarget: recoveryGoals?.proteinTarget,
            calorieTarget: recoveryGoals?.calorieTarget,
          }}
        />
      )}
    </div>
  );
};

export default Recovery;
