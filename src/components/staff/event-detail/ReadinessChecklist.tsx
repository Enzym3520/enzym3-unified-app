import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EventReadiness, getReadinessLevel, getReadinessItems } from '@/hooks/useEventReadiness';
import { safeFormatDate } from '@/utils/dateHelpers';

interface ReadinessChecklistProps {
  readiness: EventReadiness;
}

const levelColors = {
  green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  yellow: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const levelLabels = { green: 'Ready', yellow: 'Partially Ready', red: 'Needs Attention' };

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ readiness }) => {
  const level = getReadinessLevel(readiness);
  const items = getReadinessItems(readiness);
  const doneCount = items.filter(i => i.done).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Event Readiness</CardTitle>
          <Badge className={levelColors[level]}>
            {level === 'green' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {level === 'yellow' && <AlertCircle className="w-3 h-3 mr-1" />}
            {level === 'red' && <AlertCircle className="w-3 h-3 mr-1" />}
            {levelLabels[level]} ({doneCount}/{items.length})
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm py-1">
              {item.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                {item.label}
              </span>
              {item.done && item.date && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {safeFormatDate(item.date, 'MMM d', '')}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
