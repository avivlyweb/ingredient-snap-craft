/**
 * Cognitive Light Mode UI
 * 
 * Simplified "Low Power Mode" for patients experiencing chemo brain/brain fog.
 * Removes clutter, shows only one task at a time, prioritizes voice interaction.
 * Actions now log real data to the database for dashboard tracking.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Utensils, Footprints, Moon, ChevronRight, Check } from "lucide-react";
import { VoiceButton } from "@/components/voice/VoiceButton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CognitiveLightModeUIProps {
  userName?: string;
  proteinProgress: number;
  stepsProgress: number;
  onExitLightMode: () => void;
  recoveryContext?: {
    proteinTarget: number;
    calorieTarget: number;
    stepTarget: number;
    contextType?: string;
  };
}

type SimpleTask = 'eat' | 'move' | 'rest' | null;

// Estimated nutrition for simple snack options
const snackNutrition: Record<string, { protein: number; calories: number }> = {
  "Kwark": { protein: 12, calories: 80 },
  "Gekookt ei": { protein: 7, calories: 78 },
  "Noten": { protein: 6, calories: 170 },
};

// Estimated activity for movement options
const movementEstimates: Record<string, { minutes: number; steps: number }> = {
  "Naar de keuken": { minutes: 2, steps: 50 },
  "Door de gang": { minutes: 5, steps: 150 },
  "Even staan": { minutes: 3, steps: 10 },
};

export function CognitiveLightModeUI({
  userName = "Patiënt",
  proteinProgress,
  stepsProgress,
  onExitLightMode,
  recoveryContext,
}: CognitiveLightModeUIProps) {
  const [currentTask, setCurrentTask] = useState<SimpleTask>(null);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const getSuggestedTask = (): SimpleTask => {
    if (proteinProgress < 50) return 'eat';
    if (stepsProgress < 50) return 'move';
    return 'rest';
  };

  const suggestedTask = getSuggestedTask();

  const taskInfo = {
    eat: {
      icon: Utensils,
      title: "Eet een snack",
      subtitle: "Kies iets met eiwit",
      options: ["Kwark", "Gekookt ei", "Noten"],
      color: "bg-amber-500",
    },
    move: {
      icon: Footprints,
      title: "Loop even",
      subtitle: "Kleine wandeling",
      options: ["Naar de keuken", "Door de gang", "Even staan"],
      color: "bg-blue-500",
    },
    rest: {
      icon: Moon,
      title: "Rust uit",
      subtitle: "Je bent goed bezig",
      options: ["Ga zitten", "Sluit je ogen", "Drink water"],
      color: "bg-indigo-500",
    },
  };

  const handleTaskSelect = (task: SimpleTask) => {
    setCurrentTask(task);
    setTaskCompleted(false);
  };

  const handleTaskComplete = async (option: string) => {
    setIsLogging(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Log in om je voortgang bij te houden");
        setIsLogging(false);
        return;
      }

      if (currentTask === 'eat') {
        const nutrition = snackNutrition[option] || { protein: 5, calories: 80 };
        const { error } = await supabase.from('food_logs').insert({
          user_id: user.id,
          items: [option],
          estimated_protein: nutrition.protein,
          estimated_calories: nutrition.calories,
          meal_type: 'snack',
          logged_via: 'cognitive_light_mode',
          protein_confidence: 'estimated',
          data_source: 'patient_reported',
        });
        if (error) throw error;
        toast.success(`${option} gelogd — ${nutrition.protein}g eiwit`);
      } else if (currentTask === 'move') {
        const activity = movementEstimates[option] || { minutes: 3, steps: 50 };
        const { error } = await supabase.from('activity_logs').insert({
          user_id: user.id,
          activity_type: 'walking',
          duration_minutes: activity.minutes,
          step_count: activity.steps,
          intensity: 'light',
          logged_via: 'cognitive_light_mode',
          notes: option,
        });
        if (error) throw error;
        toast.success(`${option} gelogd — ${activity.minutes} min beweging`);
      } else if (currentTask === 'rest') {
        const { error } = await supabase.from('activity_logs').insert({
          user_id: user.id,
          activity_type: 'rest',
          duration_minutes: 10,
          intensity: 'rest',
          logged_via: 'cognitive_light_mode',
          notes: option,
        });
        if (error) throw error;
        toast.success("Rustmoment gelogd ✨");
      }
    } catch (err) {
      console.error('Light mode log error:', err);
      toast.error("Kon niet opslaan, probeer opnieuw");
    }

    setIsLogging(false);
    setTaskCompleted(true);
    setTimeout(() => {
      setCurrentTask(null);
      setTaskCompleted(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Simple header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-medium text-foreground mb-2">
          Hoi {userName} 👋
        </h1>
        <Badge variant="secondary" className="text-sm">
          Rustige Modus
        </Badge>
      </motion.div>

      {/* Main interaction area */}
      {!currentTask ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm space-y-6"
        >
          <Card className="border-2 border-primary/30">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                Wat wil je nu doen?
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {(['eat', 'move', 'rest'] as SimpleTask[]).map((task) => {
                  if (!task) return null;
                  const info = taskInfo[task];
                  const Icon = info.icon;
                  const isSuggested = task === suggestedTask;
                  
                  return (
                    <Button
                      key={task}
                      variant={isSuggested ? "default" : "outline"}
                      size="lg"
                      className="h-16 text-lg justify-start gap-4"
                      onClick={() => handleTaskSelect(task)}
                    >
                      <div className={`w-10 h-10 rounded-full ${info.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span>{info.title}</span>
                      {isSuggested && (
                        <Badge className="ml-auto" variant="secondary">
                          Aangeraden
                        </Badge>
                      )}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Of praat met me
            </p>
            <VoiceButton recoveryContext={recoveryContext} />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onExitLightMode}
            className="w-full text-muted-foreground"
          >
            Terug naar normaal scherm
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm"
        >
          <Card className="border-2 border-primary/30">
            <CardContent className="p-8 space-y-6">
              {taskCompleted ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-center space-y-4"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-xl font-medium">Goed gedaan! 🎉</p>
                </motion.div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <div className={`w-16 h-16 mx-auto rounded-full ${taskInfo[currentTask].color} flex items-center justify-center`}>
                      {(() => {
                        const Icon = taskInfo[currentTask].icon;
                        return <Icon className="w-8 h-8 text-white" />;
                      })()}
                    </div>
                    <h2 className="text-2xl font-bold">{taskInfo[currentTask].title}</h2>
                    <p className="text-muted-foreground">{taskInfo[currentTask].subtitle}</p>
                  </div>

                  <div className="space-y-2">
                    {taskInfo[currentTask].options.map((option, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full h-14 text-lg justify-between"
                        onClick={() => handleTaskComplete(option)}
                        disabled={isLogging}
                      >
                        {option}
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => setCurrentTask(null)}
                    className="w-full"
                  >
                    Terug
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Simple progress indicators */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 left-6 right-6 flex justify-center gap-4"
      >
        <div className="flex items-center gap-2 bg-muted/80 backdrop-blur rounded-full px-4 py-2">
          <div className={`w-3 h-3 rounded-full ${proteinProgress >= 80 ? 'bg-secondary' : proteinProgress >= 50 ? 'bg-accent' : 'bg-destructive'}`} />
          <span className="text-sm text-muted-foreground">Eiwit</span>
        </div>
        <div className="flex items-center gap-2 bg-muted/80 backdrop-blur rounded-full px-4 py-2">
          <div className={`w-3 h-3 rounded-full ${stepsProgress >= 80 ? 'bg-secondary' : stepsProgress >= 50 ? 'bg-accent' : 'bg-destructive'}`} />
          <span className="text-sm text-muted-foreground">Beweging</span>
        </div>
      </motion.div>
    </div>
  );
}
