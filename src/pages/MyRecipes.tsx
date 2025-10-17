import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import RecipeCard from "@/components/RecipeCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { User } from "@supabase/supabase-js";

interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  cuisine_style: string | null;
  ingredients: string[];
  steps: string;
  serving_suggestion?: string | null;
  plating_guidance?: string | null;
  time_management?: string | null;
  ambiance_suggestions?: string | null;
  leftover_tips?: string | null;
  created_at: string;
  username: string | null;
  user_avatar: string | null;
}

const MyRecipes = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [myRecipes, setMyRecipes] = useState<Recipe[]>([]);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchMyRecipes(session.user.id);
        fetchLikedRecipes(session.user.id);
      }
    });
  }, [navigate]);

  const fetchMyRecipes = async (userId: string) => {
    const { data } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setMyRecipes(data);
    }
    setLoading(false);
  };

  const fetchLikedRecipes = async (userId: string) => {
    const { data: likes } = await supabase
      .from("recipe_likes")
      .select("recipe_id")
      .eq("user_id", userId);

    if (likes && likes.length > 0) {
      const recipeIds = likes.map(like => like.recipe_id);
      const { data: recipes } = await supabase
        .from("recipes")
        .select("*")
        .in("id", recipeIds)
        .order("created_at", { ascending: false });

      if (recipes) {
        setLikedRecipes(recipes);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <Navigation />
        <div className="container mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Recipes</h1>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="created">Created ({myRecipes.length})</TabsTrigger>
            <TabsTrigger value="liked">Liked ({likedRecipes.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="created" className="mt-8">
            {myRecipes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                You haven't created any recipes yet. Start creating!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} currentUserId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-8">
            {likedRecipes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                You haven't liked any recipes yet. Explore the community!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {likedRecipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} currentUserId={user?.id} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyRecipes;
