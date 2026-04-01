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
import { PatientDayDataEntry } from "@/components/recovery/PatientDayDataEntry";
import { ClinicianReviewShell } from "@/components/recovery/ClinicianReviewShell";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NutritionLabel } from "@/components/NutritionLabel";
import { HealthInsights } from "@/components/HealthInsights";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChefHat,
  Drumstick,
  Flame,
  RefreshCw,
  Share2,
  Loader2,
  Stethoscope,
  Brain,
  LogIn,
  UtensilsCrossed,
  HeartPulse,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
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
  nutrition: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  health_insights: Array<{ title: string; description: string; type: string }>;
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
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAddingToGallery, setIsAddingToGallery] = useState(false);
  const [addedToGallery, setAddedToGallery] = useState(false);
  const [loggedAsEaten, setLoggedAsEaten] = useState(false);
  const [isLoggingAsEaten, setIsLoggingAsEaten] = useState(false);
  const [activeTab, setActiveTab] = useState("cooking");
  const [isCognitiveLightMode, setIsCognitiveLightMode] = useState(
    () => localStorage.getItem("cognitiveLightMode") === "true"
  );
  const [dailyStats, setDailyStats] = useState({ protein: 0, calories: 0, steps: 0, activityMinutes: 0 });

  // Persist cognitive light mode
  useEffect(() => {
    localStorage.setItem("cognitiveLightMode", isCognitiveLightMode.toString());
  }, [isCognitiveLightMode]);

  // Fetch daily stats
  useEffect(() => {
    const fetchDailyStats = async () => {
      if (!user) return;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayIso = today.toISOString();
      const [foodResult, activityResult] = await Promise.all([
        supabase.from("food_logs").select("estimated_protein, estimated_calories").eq("user_id", user.id).gte("created_at", todayIso),
        supabase.from("activity_logs").select("step_count, duration_minutes").eq("user_id", user.id).gte("created_at", todayIso),
      ]);
      const totalProtein = (foodResult.data || []).reduce((sum, log) => sum + (log.estimated_protein || 0), 0);
      const totalCalories = (foodResult.data || []).reduce((sum, log) => sum + (log.estimated_calories || 0), 0);
      const totalSteps = (activityResult.data || []).reduce((sum, log) => sum + (log.step_count || 0), 0);
      const totalMinutes = (activityResult.data || []).reduce((sum, log) => sum + (log.duration_minutes || 0), 0);
      setDailyStats({ protein: totalProtein, calories: totalCalories, steps: totalSteps, activityMinutes: totalMinutes });
    };
    fetchDailyStats();
  }, [user]);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("username, avatar_url").eq("user_id", userId).single();
    if (data) setProfile(data);
  };

  // Restore state
  useEffect(() => {
    const accepted = localStorage.getItem("recoveryDisclaimerAccepted");
    const savedGoals = localStorage.getItem("recoveryGoals");
    if (accepted === "true") {
      setDisclaimerAccepted(true);
      setCurrentStep("setup");
      if (savedGoals) setRecoveryGoals(JSON.parse(savedGoals));
    }
  }, []);

  const handleAcceptDisclaimer = () => {
    localStorage.setItem("recoveryDisclaimerAccepted", "true");
    setDisclaimerAccepted(true);
    setCurrentStep("setup");
  };

  const handleGoalsCalculated = (goals: RecoveryGoals) => setRecoveryGoals(goals);

  const handleContextSelect = (contextId: string) => setSelectedContext(contextId);

  const handleIngredientsExtracted = (newIngredients: string[]) => {
    setIngredients((prev) => [...new Set([...prev, ...newIngredients])]);
  };

  const generateRecipe = async (ingredientList: string[]) => {
    if (ingredientList.length === 0) {
      toast.error("Please add at least one ingredient");
      return;
    }
    setIngredients(ingredientList);
    setCurrentStep("generating");
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const { data, error } = await supabase.functions.invoke("generate-recipe", {
        body: { ingredients: ingredientList, contextType: selectedContext, recoveryGoals },
      });
      if (error) throw error;
      const recipe = data.recipe;

      const { data: imageData, error: imageError } = await supabase.functions.invoke("generate-recipe-image", {
        body: { recipeTitle: recipe.title, cuisineStyle: recipe.cuisine_style || "Recovery", ingredients: recipe.ingredients },
      });
      if (!imageError && imageData?.imageUrl) recipe.image_url = imageData.imageUrl;

      setCurrentRecipe(recipe);
      setCurrentStep("recipe");
    } catch (error: any) {
      console.error("Error generating recipe:", error);
      setGenerationError(error.message || "Failed to generate recipe. Please try again.");
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
    setLoggedAsEaten(false);
    setGenerationError(null);
  };

  const handleLogAsEaten = async () => {
    if (!currentRecipe || !user) {
      toast.error("Please sign in to log meals");
      return;
    }
    setIsLoggingAsEaten(true);
    try {
      const { error } = await supabase.from("food_logs").insert({
        user_id: user.id,
        items: currentRecipe.ingredients,
        meal_type: "meal",
        estimated_protein: currentRecipe.nutrition?.protein || 0,
        estimated_calories: currentRecipe.nutrition?.calories || 0,
        logged_via: "recipe",
        protein_confidence: "medium",
        data_source: "recipe_generated",
      });
      if (error) throw error;
      setLoggedAsEaten(true);
      toast.success("Maaltijd gelogd! Je Herstelindex wordt bijgewerkt.");
    } catch {
      toast.error("Kon maaltijd niet loggen. Probeer opnieuw.");
    } finally {
      setIsLoggingAsEaten(false);
    }
  };

  const handleAddToGallery = async () => {
    if (!currentRecipe) return;
    setIsAddingToGallery(true);
    try {
      const { error } = await supabase.from("recipes").insert({
        title: currentRecipe.title,
        description: currentRecipe.description,
        ingredients: currentRecipe.ingredients,
        steps: currentRecipe.steps,
        cuisine_style: currentRecipe.cuisine_style || "Recovery Recipe",
        serving_suggestion: currentRecipe.serving_suggestion,
        image_url: currentRecipe.image_url,
        context_type: selectedContext,
        user_id: user?.id || null,
        username: profile?.username || "Recovery Chef",
        user_avatar: profile?.avatar_url || null,
      });
      if (error) throw error;
      setAddedToGallery(true);
      toast.success("Recipe added to Community Gallery!");
    } catch {
      toast.error("Failed to add recipe to gallery.");
    } finally {
      setIsAddingToGallery(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case "context": setCurrentStep("setup"); break;
      case "ingredients": setCurrentStep("context"); break;
      case "recipe": setCurrentStep("ingredients"); break;
    }
  };

  const proceedToContext = () => {
    if (!recoveryGoals) { toast.error("Please calculate your recovery goals first"); return; }
    setCurrentStep("context");
  };

  const proceedToIngredients = () => {
    if (!selectedContext) { toast.error("Please select a barrier to address"); return; }
    setCurrentStep("ingredients");
  };

  // Disclaimer
  if (!disclaimerAccepted) {
    return <MedicalDisclaimer onAccept={handleAcceptDisclaimer} />;
  }

  // Cognitive Light Mode
  if (isCognitiveLightMode && recoveryGoals) {
    const proteinProgress = (dailyStats.protein / recoveryGoals.proteinTarget) * 100;
    const stepsProgress = (dailyStats.steps / 2000) * 100;
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
    <div className="min-h-screen bg-gradient-to-b from-secondary/5 to-background">
      <Navigation />

      {/* Recovery header band */}
      <div className="border-b border-secondary/20 bg-secondary/5">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <HeartPulse className="w-6 h-6 text-secondary" />
              <div>
                <h1 className="text-lg font-bold leading-tight">Recovery Support</h1>
                <p className="text-xs text-muted-foreground">Post-operative nutrition & wellbeing</p>
              </div>
            </div>

            {/* Secondary feature toggles */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="clm-toggle" className="text-xs cursor-pointer hidden sm:inline">Rustige Modus</Label>
                <Switch id="clm-toggle" checked={isCognitiveLightMode} onCheckedChange={setIsCognitiveLightMode} />
              </div>
            </div>
          </div>

          {/* Auth banner */}
          {!user && (
            <div className="flex items-center justify-between gap-3 mt-3 p-3 bg-card rounded-lg border">
              <div className="flex items-center gap-3">
                <LogIn className="w-4 h-4 text-primary" />
                <p className="text-sm">Sign in to save your health logs</p>
              </div>
              <Button
                size="sm"
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                  if (error) toast.error("Sign-in failed");
                }}
              >
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Tabs: Cooking / Dashboard / Patient Data / Clinician */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="cooking">
              <ChefHat className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Cook</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard">
              <HeartPulse className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="patient-data">
              <ClipboardList className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Patient Day</span>
            </TabsTrigger>
            <TabsTrigger value="clinician">
              <Stethoscope className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Clinician</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Cooking flow */}
          <TabsContent value="cooking">
            {/* Step progress */}
            {currentStep !== "generating" && (
              <div className="mb-6">
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
                    currentStep === "ingredients" ? 75 : 100
                  }
                  className="h-2"
                />
              </div>
            )}

            {/* Back button */}
            {(currentStep === "context" || currentStep === "ingredients" || currentStep === "recipe") && (
              <Button variant="ghost" size="sm" onClick={goBack} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}

            <AnimatePresence mode="wait">
              {/* Setup */}
              {currentStep === "setup" && (
                <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold">Recovery Nutrition Support</h2>
                    <p className="text-muted-foreground">Personalized recipes to support your post-operative recovery</p>
                  </div>
                  <RecoveryGoalCalculator onGoalsCalculated={handleGoalsCalculated} initialGoals={recoveryGoals} />
                  {recoveryGoals && (
                    <div className="flex justify-center">
                      <Button onClick={proceedToContext} size="lg">Continue to Challenge Selection</Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Context */}
              {currentStep === "context" && (
                <motion.div key="context" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
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
                  <RecoveryContextSelection onSelectContext={handleContextSelect} selectedContext={selectedContext} />
                  {selectedContext && (
                    <>
                      <BarrierTips barrierId={selectedContext} />
                      <div className="flex justify-center">
                        <Button onClick={proceedToIngredients} size="lg">
                          <ChefHat className="w-4 h-4 mr-2" /> Create Recipe for This Challenge
                        </Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* Ingredients */}
              {currentStep === "ingredients" && (
                <motion.div key="ingredients" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold">Add Your Ingredients</h2>
                    <p className="text-muted-foreground">Upload a photo or search from our database</p>
                  </div>

                  {/* Inline error from failed generation */}
                  {generationError && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-sm">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p className="text-destructive font-medium">{generationError}</p>
                        <Button size="sm" onClick={() => { setGenerationError(null); generateRecipe(ingredients); }}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Retry
                        </Button>
                      </div>
                    </div>
                  )}

                  <IngredientUpload onIngredientsExtracted={handleIngredientsExtracted} />
                  <IngredientList ingredients={ingredients} onGenerateRecipe={generateRecipe} isGenerating={isGenerating} />
                </motion.div>
              )}

              {/* Generating */}
              {currentStep === "generating" && (
                <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RecipeGenerationAnimation ingredients={ingredients} />
                </motion.div>
              )}

              {/* Recipe */}
              {currentStep === "recipe" && currentRecipe && (
                <motion.div key="recipe" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                  {/* Nutrition progress */}
                  {recoveryGoals && (
                    <Card className="border-secondary/30">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">This Recipe Contributes to Your Daily Goals</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Protein</span>
                            <span className="font-medium">{currentRecipe.nutrition.protein}g / {recoveryGoals.proteinTarget}g</span>
                          </div>
                          <Progress value={Math.min((currentRecipe.nutrition.protein / recoveryGoals.proteinTarget) * 100, 100)} className="h-2" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Calories</span>
                            <span className="font-medium">{currentRecipe.nutrition.calories} / {recoveryGoals.calorieTarget}</span>
                          </div>
                          <Progress value={Math.min((currentRecipe.nutrition.calories / recoveryGoals.calorieTarget) * 100, 100)} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Recipe card */}
                  <Card className="overflow-hidden bg-card shadow-lg">
                    {currentRecipe.image_url && (
                      <div className="relative h-[300px] md:h-[400px] overflow-hidden">
                        <img src={currentRecipe.image_url} alt={currentRecipe.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                          <Badge className="mb-3 bg-secondary text-secondary-foreground">{currentRecipe.cuisine_style || "Recovery Recipe"}</Badge>
                          <h2 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{currentRecipe.title}</h2>
                        </div>
                      </div>
                    )}
                    <div className="p-8 space-y-6">
                      {!currentRecipe.image_url && (
                        <div className="space-y-2">
                          <Badge className="bg-secondary text-secondary-foreground">{currentRecipe.cuisine_style || "Recovery Recipe"}</Badge>
                          <h2 className="text-3xl font-bold">{currentRecipe.title}</h2>
                        </div>
                      )}
                      <p className="text-lg text-muted-foreground leading-relaxed">{currentRecipe.description}</p>
                      {currentRecipe.nutrition && (<><Separator /><NutritionLabel nutrition={currentRecipe.nutrition} servings={4} /></>)}
                      {currentRecipe.patient_tips && currentRecipe.patient_tips.length > 0 && (
                        <><Separator />
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold">💡 Recovery Tips</h3>
                            <ul className="space-y-2">
                              {currentRecipe.patient_tips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <span className="text-secondary mt-0.5">✓</span>{tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                      {currentRecipe.clinical_rationale && currentRecipe.clinical_rationale.length > 0 && (
                        <><Separator /><ClinicalRationale rationale={currentRecipe.clinical_rationale} recipeTitle={currentRecipe.title} /></>
                      )}
                      {currentRecipe.health_insights && currentRecipe.health_insights.length > 0 && (
                        <><Separator />
                          <HealthInsights
                            insights={currentRecipe.health_insights.map((i) => ({ ...i, type: i.type as "benefit" | "synergy" | "tip" }))}
                            contextType={currentRecipe.context_type}
                          />
                        </>
                      )}
                      <Separator />
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Ingredients</h3>
                        <ul className="space-y-2">
                          {currentRecipe.ingredients.map((ingredient, i) => (
                            <li key={i} className="flex items-start gap-2"><span className="text-primary mt-1">•</span><span>{ingredient}</span></li>
                          ))}
                        </ul>
                      </div>
                      <Separator />
                      <div>
                        <h3 className="text-xl font-semibold mb-3">Instructions</h3>
                        <div className="space-y-3 whitespace-pre-line text-muted-foreground">{currentRecipe.steps}</div>
                      </div>
                      {currentRecipe.serving_suggestion && (<><Separator /><div className="bg-muted/50 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-2">Serving Suggestion</h3><p className="text-muted-foreground">{currentRecipe.serving_suggestion}</p></div></>)}
                    </div>
                  </Card>

                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button variant="outline" onClick={startOver}><RefreshCw className="w-4 h-4 mr-2" /> Create Another</Button>
                    {user && (
                      <Button variant="secondary" onClick={handleLogAsEaten} disabled={isLoggingAsEaten || loggedAsEaten}>
                        {isLoggingAsEaten ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging...</>) :
                          loggedAsEaten ? (<><UtensilsCrossed className="w-4 h-4 mr-2" />Logged ✓</>) :
                          (<><UtensilsCrossed className="w-4 h-4 mr-2" />Log as Eaten</>)}
                      </Button>
                    )}
                    <Button onClick={handleAddToGallery} disabled={isAddingToGallery || addedToGallery}>
                      {isAddingToGallery ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</>) :
                        addedToGallery ? (<><Share2 className="w-4 h-4 mr-2" />Added</>) :
                        (<><Share2 className="w-4 h-4 mr-2" />Share to Gallery</>)}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Tab: Dashboard */}
          <TabsContent value="dashboard">
            {user && recoveryGoals ? (
              <ClinicianDashboard proteinTarget={recoveryGoals.proteinTarget} calorieTarget={recoveryGoals.calorieTarget} />
            ) : !user ? (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <LogIn className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Sign in to view your recovery dashboard</p>
                  <Button onClick={async () => {
                    const { error } = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
                    if (error) toast.error("Sign-in failed");
                  }}>Sign in with Google</Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <HeartPulse className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Set your recovery goals first to see the dashboard</p>
                  <Button onClick={() => { setActiveTab("cooking"); setCurrentStep("setup"); }}>Set Goals</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Patient Day Data */}
          <TabsContent value="patient-data">
            {user ? (
              <PatientDayDataEntry proteinTarget={recoveryGoals?.proteinTarget} calorieTarget={recoveryGoals?.calorieTarget} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <LogIn className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Sign in to enter patient day data</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Clinician Review */}
          <TabsContent value="clinician">
            {user ? (
              <ClinicianReviewShell />
            ) : (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <LogIn className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Sign in to access clinician tools</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Voice Button */}
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
