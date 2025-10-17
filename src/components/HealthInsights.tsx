import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Sparkles, Zap } from "lucide-react";

interface HealthInsight {
  title: string;
  description: string;
  type: 'benefit' | 'synergy' | 'tip';
}

interface HealthInsightsProps {
  insights: HealthInsight[];
  contextType?: string;
}

export const HealthInsights = ({ insights, contextType }: HealthInsightsProps) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'benefit':
        return <Heart className="h-4 w-4" />;
      case 'synergy':
        return <Sparkles className="h-4 w-4" />;
      case 'tip':
        return <Zap className="h-4 w-4" />;
      default:
        return <Heart className="h-4 w-4" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'benefit':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'synergy':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'tip':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-muted';
    }
  };

  if (insights.length === 0) return null;

  return (
    <Card className="p-6 bg-gradient-to-br from-secondary/5 to-primary/5 border-2 border-secondary/10">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <h3 className="text-xl font-bold">Health Benefits & Insights</h3>
          {contextType && (
            <Badge variant="outline" className="ml-auto">
              {contextType.replace('_', ' ')}
            </Badge>
          )}
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 bg-background/60 rounded-lg hover:bg-background/80 transition-colors"
            >
              <Badge 
                variant="outline" 
                className={`h-fit ${getBadgeColor(insight.type)}`}
              >
                {getIcon(insight.type)}
              </Badge>
              <div className="flex-1 space-y-1">
                <h4 className="font-semibold text-sm">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
