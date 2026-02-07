import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import RecipeCard from "./RecipeCard";
import { Loader2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string;
  cuisine_style: string | null;
  serving_suggestion?: string | null;
  plating_guidance?: string | null;
  time_management?: string | null;
  ambiance_suggestions?: string | null;
  leftover_tips?: string | null;
  image_url?: string | null;
  created_at: string;
  username?: string | null;
  user_avatar?: string | null;
}

export const RecipeGallery = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      // Select specific columns to avoid fetching large base64 image data that causes timeout
      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, description, ingredients, steps, cuisine_style, serving_suggestion, plating_guidance, time_management, ambiance_suggestions, leftover_tips, created_at, username, user_avatar')
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setIsLoading(false);
    }
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          currentUserId={user?.id}
        />
      ))}
    </div>
  );
};
