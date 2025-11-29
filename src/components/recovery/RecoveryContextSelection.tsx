import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Frown, Utensils, Zap, Clock } from "lucide-react";

interface RecoveryContext {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  tips: string[];
  color: string;
}

interface RecoveryContextSelectionProps {
  onSelectContext: (contextId: string) => void;
  selectedContext?: string;
}

const recoveryContexts: RecoveryContext[] = [
  {
    id: "nausea_support",
    label: "Nausea Support",
    description: "Gentle recipes for when eating feels difficult",
    icon: <Frown className="w-6 h-6" />,
    color: "text-secondary",
    tips: [
      "Cold or room temperature foods are often better tolerated",
      "Small, frequent meals instead of large portions",
      "Avoid strong smells and greasy foods",
      "Ginger and citrus can help settle the stomach"
    ]
  },
  {
    id: "low_appetite",
    label: "Low Appetite",
    description: "Nutrient-dense options when hunger is lacking",
    icon: <Utensils className="w-6 h-6" />,
    color: "text-primary",
    tips: [
      "Focus on calorie and protein density in smaller portions",
      "Fortify foods with protein powder or Greek yogurt",
      "Eat during windows when appetite is best",
      "Make every bite count nutritionally"
    ]
  },
  {
    id: "energy_boost",
    label: "Energy Boost",
    description: "Quick energy when fatigue is high",
    icon: <Zap className="w-6 h-6" />,
    color: "text-accent",
    tips: [
      "Balance complex carbs with protein for sustained energy",
      "Include iron-rich foods to combat fatigue",
      "Stay hydrated—dehydration worsens tiredness",
      "Small, frequent meals maintain energy levels"
    ]
  },
  {
    id: "easy_prep",
    label: "Minimal Effort",
    description: "Simple recipes when energy is limited",
    icon: <Clock className="w-6 h-6" />,
    color: "text-muted-foreground",
    tips: [
      "Batch cook when feeling well",
      "Keep nutritious ready-to-eat options available",
      "Accept help from family and friends",
      "Prioritize rest—nutrition supports healing"
    ]
  }
];

const RecoveryContextSelection = ({ onSelectContext, selectedContext }: RecoveryContextSelectionProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">What's Your Biggest Challenge Today?</h2>
        <p className="text-muted-foreground">
          Select the barrier you're facing, and we'll tailor recipes to help
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recoveryContexts.map((context) => (
          <Card
            key={context.id}
            className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
              selectedContext === context.id ? "border-primary border-2 bg-primary/5" : ""
            }`}
            onClick={() => onSelectContext(context.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-muted ${context.color}`}>
                  {context.icon}
                </div>
                {selectedContext === context.id && (
                  <Badge variant="default">Selected</Badge>
                )}
              </div>
              <CardTitle className="text-lg mt-2">{context.label}</CardTitle>
              <CardDescription>{context.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-muted-foreground space-y-1">
                {context.tips.slice(0, 2).map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-secondary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecoveryContextSelection;
