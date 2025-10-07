import { motion, useMotionValue } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  cuisine_style: string;
  serving_suggestion: string;
  image_url?: string;
  created_at: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
  index?: number;
  isPolaroid?: boolean;
}

function getRandomRotation() {
  return Math.random() * 8 - 4; // -4 to +4 degrees
}

export const RecipeCard = ({ recipe, onClick, index = 0, isPolaroid = false }: RecipeCardProps) => {
  const [rotation, setRotation] = useState(0);
  const x = useMotionValue(200);
  const y = useMotionValue(200);

  useEffect(() => {
    if (isPolaroid) {
      setRotation(getRandomRotation());
    }
  }, [isPolaroid]);

  const handleMouse = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPolaroid) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  const resetMouse = () => {
    x.set(200);
    y.set(200);
  };

  if (isPolaroid) {
    return (
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        whileTap={{ scale: 1.15, zIndex: 9999, rotate: 0 }}
        whileHover={{ scale: 1.08, rotate: 0, zIndex: 9999 }}
        whileDrag={{ scale: 1.1, zIndex: 9999, rotate: 0 }}
        initial={{ rotate: 0, opacity: 0, y: 50 }}
        animate={{ rotate: rotation, opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 70,
          damping: 12,
          delay: index * 0.1,
        }}
        onClick={onClick}
        onMouseMove={handleMouse}
        onMouseLeave={resetMouse}
        className="cursor-grab active:cursor-grabbing select-none w-[280px] h-[340px]"
        style={{
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          touchAction: "none",
        }}
      >
        <div className="w-full h-full bg-background rounded-lg shadow-xl p-4 border-2 border-border">
          <div className="relative h-[240px] overflow-hidden rounded-md mb-3">
            {recipe.image_url ? (
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-5xl">🍽️</span>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge className="bg-background/90 text-foreground backdrop-blur-sm text-xs">
                {recipe.cuisine_style}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <h3 className="font-semibold text-base line-clamp-1">{recipe.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-xl"
    >
      <div className="relative h-48 overflow-hidden">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <Badge className="bg-background/90 text-foreground backdrop-blur-sm">
            {recipe.cuisine_style}
          </Badge>
        </div>
      </div>
      
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{recipe.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {recipe.description}
        </p>
        <div className="flex flex-wrap gap-1 pt-2">
          {recipe.ingredients.slice(0, 3).map((ingredient, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {ingredient.split(' ')[0]}
            </Badge>
          ))}
          {recipe.ingredients.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{recipe.ingredients.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};
