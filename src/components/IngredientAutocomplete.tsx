import { useState, useEffect } from "react";
import { Search, Plus, Flame, Beef } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NevoIngredient {
  id: string;
  nevo_code: string;
  name: string;
  name_nl: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface IngredientAutocompleteProps {
  onSelect: (ingredient: string) => void;
}

export const IngredientAutocomplete = ({ onSelect }: IngredientAutocompleteProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NevoIngredient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const searchNevo = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('search-nevo-ingredients', {
          body: { query, limit: 8 }
        });

        if (error) throw error;
        setResults(data.results || []);
        setShowResults(true);
      } catch (error) {
        console.error('Error searching NEVO:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchNevo, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (ingredient: NevoIngredient) => {
    onSelect(ingredient.name);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
          placeholder="Search ingredients (e.g., chicken, tomato, rice)..."
          className="pl-10 pr-4"
        />
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute z-50 w-full mt-2 max-h-96 overflow-y-auto shadow-lg border-primary/20">
          <div className="p-2 space-y-1">
            {results.map((ingredient) => (
              <button
                key={ingredient.id}
                onClick={() => handleSelect(ingredient)}
                className={cn(
                  "w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors",
                  "border border-transparent hover:border-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ingredient.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{ingredient.name_nl}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ingredient.calories && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Flame className="h-3 w-3 text-orange-500" />
                        {Math.round(ingredient.calories)}
                      </Badge>
                    )}
                    {ingredient.protein && ingredient.protein > 0 && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <Beef className="h-3 w-3 text-red-500" />
                        {Math.round(ingredient.protein)}g
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
