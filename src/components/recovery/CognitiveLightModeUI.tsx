/**
 * Cognitive Light Mode UI
 * 
 * Simplified "Low Power Mode" for patients experiencing chemo brain/brain fog.
 * Removes clutter, shows only one task at a time, prioritizes voice interaction.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mic, Utensils, Footprints, Moon, ChevronRight, Check } from "lucide-react";
import { VoiceButton } from "@/components/voice/VoiceButton";

interface CognitiveLightModeUIProps {
  userName?: string;
  proteinProgress: number; // 0-100
  stepsProgress: number; // 0-100
  onExitLightMode: () => void;
  recoveryContext?: {
    proteinTarget: number;
    calorieTarget: number;
    stepTarget: number;
    contextType?: string;
  };
}

type SimpleTask = 'eat' | 'move' | 'rest' | null;

export function CognitiveLightModeUI({
  userName = "Patiënt",
  proteinProgress,
  stepsProgress,
  onExitLightMode,
  recoveryContext,
}: CognitiveLightModeUIProps) {
  const [currentTask, setCurrentTask] = useState<SimpleTask>(null);
  const [taskCompleted, setTaskCompleted] = useState(false);

  // Determine suggested task based on progress
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

  const handleTaskComplete = () => {
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
          {/* Single prominent action button */}
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
                      className={`h-16 text-lg justify-start gap-4 ${isSuggested ? '' : ''}`}
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

          {/* Voice button - primary interaction */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">
              Of praat met me
            </p>
            <VoiceButton
              recoveryContext={recoveryContext}
            />
          </div>

          {/* Exit light mode */}
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
        // Task detail view
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
                  {/* Task header */}
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

                  {/* Simple options */}
                  <div className="space-y-2">
                    {taskInfo[currentTask].options.map((option, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        className="w-full h-14 text-lg justify-between"
                        onClick={handleTaskComplete}
                      >
                        {option}
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    ))}
                  </div>

                  {/* Back button */}
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

      {/* Simple progress indicators at bottom */}
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
