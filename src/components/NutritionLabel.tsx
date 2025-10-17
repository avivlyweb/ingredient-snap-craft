import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";

interface NutritionData {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

interface NutritionLabelProps {
  nutrition: NutritionData;
  servings?: number;
}

export const NutritionLabel = ({ nutrition, servings = 4 }: NutritionLabelProps) => {
  const macros = [
    { label: "Protein", value: nutrition.protein, icon: Beef, color: "text-blue-500" },
    { label: "Carbs", value: nutrition.carbs, icon: Wheat, color: "text-amber-500" },
    { label: "Fat", value: nutrition.fat, icon: Droplets, color: "text-emerald-500" },
  ];

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/10">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Nutritional Information
          </h3>
          {nutrition.calories && (
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {Math.round(nutrition.calories / servings)} kcal/serving
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {macros.map(({ label, value, icon: Icon, color }) => (
            value !== undefined && (
              <div key={label} className="text-center p-3 bg-background/60 rounded-lg">
                <Icon className={`h-5 w-5 mx-auto mb-2 ${color}`} />
                <div className="text-2xl font-bold">{Math.round(value / servings)}g</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {label}
                </div>
              </div>
            )
          ))}
        </div>

        {nutrition.fiber !== undefined && (
          <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg">
            <span className="text-sm font-medium">Dietary Fiber</span>
            <span className="font-bold">{Math.round(nutrition.fiber / servings)}g per serving</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Values are estimates based on typical ingredient nutritional profiles
        </p>
      </div>
    </Card>
  );
};
