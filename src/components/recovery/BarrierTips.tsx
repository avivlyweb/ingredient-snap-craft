import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Utensils, ThermometerSnowflake, Clock, Heart } from "lucide-react";

interface BarrierTipsProps {
  barrierId: string;
}

const barrierTipsData: Record<string, {
  title: string;
  description: string;
  tips: { icon: React.ReactNode; text: string }[];
  foodSuggestions: string[];
}> = {
  nausea_support: {
    title: "Managing Nausea",
    description: "Strategies to make eating more comfortable when nausea is present",
    tips: [
      { icon: <ThermometerSnowflake className="w-4 h-4" />, text: "Cold or room temperature foods have less aroma and are often better tolerated" },
      { icon: <Clock className="w-4 h-4" />, text: "Eat small amounts every 2-3 hours instead of large meals" },
      { icon: <Utensils className="w-4 h-4" />, text: "Avoid lying down immediately after eating—stay upright for 30 minutes" },
      { icon: <Heart className="w-4 h-4" />, text: "Sip clear fluids between meals, not during, to prevent feeling too full" },
    ],
    foodSuggestions: ["Crackers", "Toast", "Ginger tea", "Bananas", "Plain rice", "Clear broth", "Yogurt", "Applesauce"]
  },
  low_appetite: {
    title: "Boosting Nutrition with Low Appetite",
    description: "Maximize nutritional intake even when hunger is minimal",
    tips: [
      { icon: <Lightbulb className="w-4 h-4" />, text: "Make every bite count—choose nutrient-dense foods over empty calories" },
      { icon: <Clock className="w-4 h-4" />, text: "Eat during your best windows—appetite often peaks in the morning" },
      { icon: <Utensils className="w-4 h-4" />, text: "Fortify foods: add protein powder to smoothies, cheese to vegetables" },
      { icon: <Heart className="w-4 h-4" />, text: "Keep ready-to-eat snacks visible and accessible" },
    ],
    foodSuggestions: ["Greek yogurt", "Nut butters", "Eggs", "Cheese", "Avocado", "Smoothies", "Trail mix", "Protein shakes"]
  },
  energy_boost: {
    title: "Fighting Fatigue with Food",
    description: "Strategic eating to maintain energy throughout the day",
    tips: [
      { icon: <Lightbulb className="w-4 h-4" />, text: "Combine protein with complex carbs for sustained energy release" },
      { icon: <Clock className="w-4 h-4" />, text: "Eat regularly—skipping meals leads to energy crashes" },
      { icon: <Utensils className="w-4 h-4" />, text: "Include iron-rich foods with vitamin C to maximize absorption" },
      { icon: <Heart className="w-4 h-4" />, text: "Stay hydrated—even mild dehydration causes fatigue" },
    ],
    foodSuggestions: ["Oatmeal", "Lean meats", "Spinach", "Lentils", "Sweet potatoes", "Quinoa", "Citrus fruits", "Nuts"]
  },
  easy_prep: {
    title: "Nutrition with Minimal Effort",
    description: "Simple strategies when energy for cooking is limited",
    tips: [
      { icon: <Clock className="w-4 h-4" />, text: "Batch cook on good days—freeze portions for harder days" },
      { icon: <Utensils className="w-4 h-4" />, text: "Stock up on healthy convenience foods: rotisserie chicken, pre-cut vegetables" },
      { icon: <Lightbulb className="w-4 h-4" />, text: "Accept help—let family and friends prepare meals for you" },
      { icon: <Heart className="w-4 h-4" />, text: "No-cook options: sandwiches, cheese and crackers, yogurt parfaits" },
    ],
    foodSuggestions: ["Rotisserie chicken", "Pre-washed salads", "Canned beans", "Frozen vegetables", "Cottage cheese", "Deli meats", "Hummus", "Pre-made soups"]
  }
};

const BarrierTips = ({ barrierId }: BarrierTipsProps) => {
  const data = barrierTipsData[barrierId];
  
  if (!data) return null;

  return (
    <Card className="border-secondary/20 bg-secondary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-secondary" />
          {data.title}
        </CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {data.tips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <div className="text-secondary mt-0.5">{tip.icon}</div>
              <span className="text-muted-foreground">{tip.text}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <p className="text-xs font-medium text-foreground mb-2">Foods to Try:</p>
          <div className="flex flex-wrap gap-1.5">
            {data.foodSuggestions.map((food, index) => (
              <span 
                key={index} 
                className="text-xs px-2 py-1 bg-background rounded-full border text-muted-foreground"
              >
                {food}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarrierTips;
