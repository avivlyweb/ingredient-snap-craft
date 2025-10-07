import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ChefHat, 
  Soup, 
  Sparkles, 
  Utensils,
  Apple,
  Carrot,
  Fish,
  Beef,
  Leaf
} from "lucide-react";

interface RecipeGenerationAnimationProps {
  ingredients?: string[];
}

export const RecipeGenerationAnimation = ({ ingredients = [] }: RecipeGenerationAnimationProps) => {
  const [stage, setStage] = useState(0);
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    // Progress through animation stages
    const stages = [
      { delay: 0, stage: 0 },     // Gathering ingredients
      { delay: 2000, stage: 1 },  // Mixing
      { delay: 5000, stage: 2 },  // Crafting
      { delay: 8000, stage: 3 },  // Final touches
    ];

    const timers = stages.map(({ delay, stage: s }) =>
      setTimeout(() => setStage(s), delay)
    );

    // Create particle effects
    const particleTimer = setInterval(() => {
      setParticles(prev => [...prev, Date.now()].slice(-20));
    }, 300);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(particleTimer);
    };
  }, []);

  const stageMessages = [
    "Gathering your ingredients...",
    "Mixing flavors together...",
    "Crafting your perfect recipe...",
    "Adding the final touches..."
  ];

  const ingredientIcons = [Apple, Carrot, Fish, Beef, Leaf];

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] space-y-8">
      {/* Main Bowl Animation */}
      <div className="relative w-64 h-64">
        {/* Flying ingredients */}
        <AnimatePresence>
          {stage === 0 && ingredientIcons.map((Icon, index) => (
            <motion.div
              key={index}
              initial={{ 
                x: index % 2 === 0 ? -300 : 300, 
                y: -100, 
                opacity: 0,
                rotate: 0
              }}
              animate={{ 
                x: 0, 
                y: 0, 
                opacity: 1,
                rotate: 360
              }}
              exit={{ 
                scale: 0, 
                opacity: 0 
              }}
              transition={{ 
                delay: index * 0.2,
                duration: 1,
                type: "spring",
                stiffness: 100
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ zIndex: 10 - index }}
            >
              <Icon className="w-12 h-12 text-primary" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Mixing Bowl */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          animate={stage === 1 ? { 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          } : {}}
          transition={{ 
            repeat: stage === 1 ? Infinity : 0,
            duration: 0.5 
          }}
        >
          <div className="relative">
            <Soup className="w-32 h-32 text-primary" strokeWidth={1.5} />
            
            {/* Sparkles/Steam */}
            <AnimatePresence>
              {stage >= 2 && particles.map((id) => (
                <motion.div
                  key={id}
                  initial={{ y: 0, opacity: 1, scale: 0 }}
                  animate={{ 
                    y: -100, 
                    opacity: 0,
                    scale: 1,
                    x: Math.random() * 40 - 20
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2 }}
                  className="absolute top-0 left-1/2"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Chef Hat - Final Stage */}
        <AnimatePresence>
          {stage === 3 && (
            <motion.div
              initial={{ y: -100, opacity: 0, scale: 0 }}
              animate={{ y: -80, opacity: 1, scale: 1 }}
              className="absolute top-0 left-1/2 -translate-x-1/2"
            >
              <ChefHat className="w-16 h-16 text-accent" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Utensils - Mixing Stage */}
        <AnimatePresence>
          {stage === 1 && (
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ 
                repeat: Infinity,
                duration: 2,
                ease: "linear"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <Utensils className="w-20 h-20 text-muted-foreground opacity-30" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status Message */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <p className="text-xl font-medium text-foreground">
          {stageMessages[stage]}
        </p>
        <div className="flex items-center justify-center gap-2">
          {[0, 1, 2, 3].map((dot) => (
            <motion.div
              key={dot}
              animate={{
                scale: stage === dot ? [1, 1.5, 1] : 1,
                opacity: stage >= dot ? 1 : 0.3
              }}
              transition={{
                repeat: stage === dot ? Infinity : 0,
                duration: 0.8
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </div>
      </motion.div>

      {/* Ingredients List (subtle) */}
      {ingredients.length > 0 && stage === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground">
            Using: {ingredients.slice(0, 5).join(", ")}
            {ingredients.length > 5 && ` and ${ingredients.length - 5} more`}
          </p>
        </motion.div>
      )}
    </div>
  );
};
