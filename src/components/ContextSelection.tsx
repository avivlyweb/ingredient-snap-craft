import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Calendar, UtensilsCrossed, Timer, Sparkles } from "lucide-react";

interface ContextOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface ContextSelectionProps {
  onSelectContext: (contextType: string) => void;
}

const contextOptions: ContextOption[] = [
  {
    id: "date_night",
    label: "Date Night",
    description: "Romantic, impressive, restaurant-quality",
    icon: <Heart className="w-6 h-6" />
  },
  {
    id: "family_dinner",
    label: "Family Dinner",
    description: "Crowd-pleasing, comforting, generous portions",
    icon: <Users className="w-6 h-6" />
  },
  {
    id: "meal_prep",
    label: "Meal Prep",
    description: "Batch-friendly, reheats well, efficient",
    icon: <Calendar className="w-6 h-6" />
  },
  {
    id: "quick_lunch",
    label: "Quick Lunch",
    description: "Fast, energizing, minimal cleanup",
    icon: <Timer className="w-6 h-6" />
  },
  {
    id: "entertaining",
    label: "Entertaining Guests",
    description: "Shareable, impressive, conversation-starter",
    icon: <UtensilsCrossed className="w-6 h-6" />
  },
  {
    id: "experimental",
    label: "Culinary Adventure",
    description: "Creative, unique, skill-building",
    icon: <Sparkles className="w-6 h-6" />
  }
];

export const ContextSelection = ({ onSelectContext }: ContextSelectionProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">What's the Occasion?</h2>
        <p className="text-muted-foreground text-lg">
          Tell us about your cooking context so we can tailor the perfect recipe for you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {contextOptions.map((option) => (
          <Card
            key={option.id}
            className="p-6 cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:scale-105 active:scale-95"
            onClick={() => onSelectContext(option.id)}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {option.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{option.label}</h3>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};