import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Beef, Fish, Milk, Wheat, Apple, Carrot, Coffee, Egg } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: any;
  color: string;
  ingredients: string[];
}

const categories: Category[] = [
  {
    id: "proteins",
    name: "Proteins",
    icon: Beef,
    color: "text-red-500",
    ingredients: [
      "Chicken breast",
      "Beef sirloin",
      "Salmon",
      "Tuna",
      "Eggs",
      "Greek yogurt",
      "Tofu",
      "Lentils"
    ]
  },
  {
    id: "vegetables",
    name: "Vegetables",
    icon: Carrot,
    color: "text-green-500",
    ingredients: [
      "Broccoli",
      "Spinach",
      "Tomatoes",
      "Bell peppers",
      "Carrots",
      "Onions",
      "Mushrooms",
      "Zucchini"
    ]
  },
  {
    id: "grains",
    name: "Grains & Starches",
    icon: Wheat,
    color: "text-amber-500",
    ingredients: [
      "Brown rice",
      "Quinoa",
      "Whole wheat pasta",
      "Oats",
      "Sweet potato",
      "Potatoes",
      "Bread",
      "Couscous"
    ]
  },
  {
    id: "fruits",
    name: "Fruits",
    icon: Apple,
    color: "text-pink-500",
    ingredients: [
      "Bananas",
      "Apples",
      "Berries",
      "Oranges",
      "Avocado",
      "Mango",
      "Grapes",
      "Pineapple"
    ]
  },
  {
    id: "dairy",
    name: "Dairy",
    icon: Milk,
    color: "text-blue-500",
    ingredients: [
      "Milk",
      "Cheese",
      "Yogurt",
      "Butter",
      "Cream",
      "Cottage cheese",
      "Sour cream"
    ]
  },
  {
    id: "pantry",
    name: "Pantry Staples",
    icon: Coffee,
    color: "text-purple-500",
    ingredients: [
      "Olive oil",
      "Garlic",
      "Ginger",
      "Soy sauce",
      "Honey",
      "Coconut milk",
      "Beans",
      "Nuts"
    ]
  }
];

interface IngredientCategoryPickerProps {
  onSelect: (ingredient: string) => void;
  selectedIngredients: string[];
}

export const IngredientCategoryPicker = ({ 
  onSelect, 
  selectedIngredients 
}: IngredientCategoryPickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Quick Pick by Category</h3>
        <p className="text-sm text-muted-foreground">
          Select a category to browse common ingredients
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Card
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={cn(
                "p-4 cursor-pointer transition-all hover:scale-105",
                "border-2",
                isSelected 
                  ? "border-primary bg-primary/5 shadow-lg" 
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="text-center space-y-2">
                <div className={cn(
                  "w-12 h-12 mx-auto rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary/10" : "bg-muted"
                )}>
                  <Icon className={cn("h-6 w-6", category.color)} />
                </div>
                <p className="font-medium text-sm">{category.name}</p>
                <Badge variant="secondary" className="text-xs">
                  {category.ingredients.length} items
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedCategory && (
        <Card className="p-4 animate-fade-in border-primary/20">
          <div className="space-y-3">
            <h4 className="font-semibold text-sm mb-3">
              {categories.find(c => c.id === selectedCategory)?.name}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {categories
                .find(c => c.id === selectedCategory)
                ?.ingredients.map((ingredient) => {
                  const isSelected = selectedIngredients.includes(ingredient);
                  
                  return (
                    <Button
                      key={ingredient}
                      onClick={() => onSelect(ingredient)}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start text-xs h-auto py-2",
                        isSelected && "bg-primary text-primary-foreground"
                      )}
                    >
                      {ingredient}
                    </Button>
                  );
                })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
