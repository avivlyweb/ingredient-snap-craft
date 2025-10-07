import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RecipeCard } from "./RecipeCard";
import { RecipeModal } from "./RecipeModal";
import { Loader2, Grid3x3, Images } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

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

type GalleryMode = "grid" | "polaroid";

export const RecipeGallery = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<GalleryMode>("polaroid");

  useEffect(() => {
    fetchRecipes();

    // Subscribe to new recipes
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recipes'
        },
        (payload) => {
          setRecipes(prev => [payload.new as Recipe, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No recipes yet. Be the first to create one!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 max-md:hidden -z-10 h-[200px] w-full bg-transparent bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
          <p className="text-center text-xs font-light uppercase tracking-widest text-muted-foreground mb-2">
            A Collection of Delicious Creations
          </p>
          <h3 className="text-center text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
            Community Recipe{" "}
            <span className="text-primary">Gallery</span>
          </h3>
        </div>

        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <Button
            variant={mode === "polaroid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("polaroid")}
            className="gap-2"
          >
            <Images className="w-4 h-4" />
            Polaroid
          </Button>
          <Button
            variant={mode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setMode("grid")}
            className="gap-2"
          >
            <Grid3x3 className="w-4 h-4" />
            Grid
          </Button>
        </div>
      </div>

      {mode === "polaroid" ? (
        <div className="relative min-h-[500px] flex items-center justify-center py-12">
          <motion.div
            className="relative flex flex-wrap justify-center gap-8 max-w-6xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {recipes.map((recipe, index) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleCardClick(recipe)}
                index={index}
                isPolaroid={true}
              />
            ))}
          </motion.div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => handleCardClick(recipe)}
              index={index}
              isPolaroid={false}
            />
          ))}
        </div>
      )}

      <RecipeModal
        recipe={selectedRecipe}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
