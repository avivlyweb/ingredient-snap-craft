/**
 * Recovery Balance Gauge
 * 
 * Visual gauge showing current activity state.
 * - Green Zone = ADEQUATE
 * - Orange Zone = STALLING / UNDERSTIMULATED
 * - Red Zone = OVERREACHED / FATIGUE_LIMITED
 */

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import { 
  ActivityState, 
  getActivityStateColor, 
  getActivityStateLabel,
  ACTIVITY_STATE_RESPONSES_NL 
} from "@/utils/activityStateEngine";

interface RecoveryBalanceGaugeProps {
  activityState: ActivityState;
  showResponse?: boolean;
}

export function RecoveryBalanceGauge({ 
  activityState, 
  showResponse = true 
}: RecoveryBalanceGaugeProps) {
  const color = getActivityStateColor(activityState);
  const label = getActivityStateLabel(activityState);
  const response = ACTIVITY_STATE_RESPONSES_NL[activityState];

  // Calculate gauge position (0-100)
  const getGaugePosition = (): number => {
    switch (activityState) {
      case 'ADEQUATE':
        return 85;
      case 'UNDERSTIMULATED':
        return 45;
      case 'STALLING':
        return 35;
      case 'FATIGUE_LIMITED':
        return 20;
      case 'OVERREACHED':
        return 10;
      case 'DATA_SPARSE':
      default:
        return 50;
    }
  };

  const gaugePosition = getGaugePosition();

  const getBgColorClass = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500';
      case 'orange':
        return 'bg-orange-500';
      case 'red':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getBorderColorClass = () => {
    switch (color) {
      case 'green':
        return 'border-green-500/30';
      case 'orange':
        return 'border-orange-500/30';
      case 'red':
        return 'border-red-500/30';
      default:
        return 'border-gray-500/30';
    }
  };

  const getTextColorClass = () => {
    switch (color) {
      case 'green':
        return 'text-green-600 dark:text-green-400';
      case 'orange':
        return 'text-orange-600 dark:text-orange-400';
      case 'red':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card className={`border-2 ${getBorderColorClass()}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Herstelbalans
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge visualization */}
        <div className="relative h-8 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-yellow-500 to-green-500">
          {/* Position indicator */}
          <motion.div
            initial={{ left: '50%' }}
            animate={{ left: `${gaugePosition}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ transform: 'translateX(-50%)' }}
          />
          {/* Pointer triangle */}
          <motion.div
            initial={{ left: '50%' }}
            animate={{ left: `${gaugePosition}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="absolute -bottom-2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-l-transparent border-r-transparent border-t-white"
            style={{ transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>Te veel</span>
          <span>Optimaal</span>
        </div>

        {/* Current state badge */}
        <div className="flex items-center justify-between">
          <Badge 
            className={`${getBgColorClass()} text-white`}
          >
            {label}
          </Badge>
          
          {activityState === 'DATA_SPARSE' && (
            <span className="text-xs text-muted-foreground">
              Check-in nodig
            </span>
          )}
        </div>

        {/* Response message */}
        {showResponse && (
          <p className={`text-sm ${getTextColorClass()} italic`}>
            "{response}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}
