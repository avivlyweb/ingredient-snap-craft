/**
 * Herstelindex Card
 * 
 * Displays the unified Recovery Index (0-100) with breakdown.
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { 
  RecoveryIndexResult, 
  getRecoveryIndexColor, 
  getRecoveryIndexBgColor,
  getRiskLevelLabel 
} from "@/utils/recoveryIndex";

interface HerstelindexCardProps {
  result: RecoveryIndexResult;
  previousScore?: number;
}

export function HerstelindexCard({ result, previousScore }: HerstelindexCardProps) {
  const { score, proteinScore, activityScore, adlScore, riskLevel } = result;
  
  // Calculate trend from previous score
  const getTrendInfo = () => {
    if (previousScore === undefined) return null;
    
    const diff = score - previousScore;
    if (diff >= 5) return { icon: TrendingUp, label: 'Verbetering', color: 'text-green-600' };
    if (diff <= -5) return { icon: TrendingDown, label: 'Daling', color: 'text-red-600' };
    return { icon: Minus, label: 'Stabiel', color: 'text-gray-600' };
  };

  const trendInfo = getTrendInfo();

  const getRiskBadgeVariant = () => {
    switch (riskLevel) {
      case 'low':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'high':
        return 'destructive';
    }
  };

  return (
    <Card className="border-secondary/30">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Herstelindex
            </CardTitle>
            <CardDescription>
              Dagelijkse herstelvoortgang
            </CardDescription>
          </div>
          <Badge variant={getRiskBadgeVariant()}>
            {getRiskLevelLabel(riskLevel)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main score */}
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-baseline gap-1"
          >
            <span className={`text-5xl font-bold ${getRecoveryIndexColor(score)}`}>
              {score}
            </span>
            <span className="text-2xl text-muted-foreground">/100</span>
          </motion.div>
          
          {trendInfo && (
            <div className={`flex items-center gap-1 ${trendInfo.color}`}>
              <trendInfo.icon className="w-4 h-4" />
              <span className="text-sm">{trendInfo.label}</span>
            </div>
          )}
        </div>

        {/* Score gauge */}
        <div className="relative h-4 rounded-full overflow-hidden bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`absolute inset-y-0 left-0 ${getRecoveryIndexBgColor(score)}`}
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Eiwit</div>
            <Progress value={(proteinScore / 33) * 100} className="h-2" />
            <div className="text-sm font-medium">{proteinScore}/33</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Beweging</div>
            <Progress value={(activityScore / 33) * 100} className="h-2" />
            <div className="text-sm font-medium">{activityScore}/33</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Functioneel</div>
            <Progress value={(adlScore / 34) * 100} className="h-2" />
            <div className="text-sm font-medium">{adlScore}/34</div>
          </div>
        </div>

        {/* Low score warning */}
        {score < 50 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-sm">
            <p className="text-destructive font-medium">
              Herstelindex onder 50 - Extra aandacht aanbevolen
            </p>
            <p className="text-muted-foreground mt-1">
              Focus op eiwitrijke snacks en korte bewegingsmomenten.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
