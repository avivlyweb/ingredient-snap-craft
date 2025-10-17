import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChefHat, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { RecipeModal } from "./RecipeModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description: string;
    image_url?: string | null;
    cuisine_style?: string | null;
    ingredients: string[];
    steps: string;
    serving_suggestion?: string | null;
    plating_guidance?: string | null;
    time_management?: string | null;
    ambiance_suggestions?: string | null;
    leftover_tips?: string | null;
    username?: string | null;
    user_avatar?: string | null;
  };
  currentUserId?: string;
}

const RecipeCard = ({ recipe, currentUserId }: RecipeCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    fetchLikeStatus();
    fetchLikeCount();
  }, [recipe.id, currentUserId]);

  const fetchLikeStatus = async () => {
    if (!currentUserId) return;
    
    const { data } = await supabase
      .from("recipe_likes")
      .select("id")
      .eq("recipe_id", recipe.id)
      .eq("user_id", currentUserId)
      .single();

    setIsLiked(!!data);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("recipe_likes")
      .select("*", { count: "exact", head: true })
      .eq("recipe_id", recipe.id);

    setLikeCount(count || 0);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!currentUserId) {
      toast.error("Please sign in to like recipes");
      return;
    }

    if (isLiked) {
      await supabase
        .from("recipe_likes")
        .delete()
        .eq("recipe_id", recipe.id)
        .eq("user_id", currentUserId);
      
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase
        .from("recipe_likes")
        .insert({ recipe_id: recipe.id, user_id: currentUserId });
      
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
      toast.success("Recipe liked!");
    }
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10">
          {recipe.image_url && !imageError ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="w-16 h-16 text-primary/30" />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90 ${
              isLiked ? "text-red-500" : ""
            }`}
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
          </Button>
        </div>

        <CardContent className="p-4 space-y-3">
          {recipe.username && (
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={recipe.user_avatar || ""} />
                <AvatarFallback className="text-xs">
                  {recipe.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{recipe.username}</span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{recipe.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
          </div>
          <div className="flex items-center justify-between">
            {recipe.cuisine_style && (
              <Badge variant="secondary" className="w-fit">
                {recipe.cuisine_style}
              </Badge>
            )}
            {likeCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>{likeCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <RecipeModal
        recipe={recipe}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
};

export default RecipeCard;
