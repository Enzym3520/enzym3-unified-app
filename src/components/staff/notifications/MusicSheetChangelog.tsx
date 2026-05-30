import { useMusicSheetChangelog } from '@/hooks/useMusicSheetChangelog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, Music, FileText } from 'lucide-react';

interface MusicSheetChangelogProps {
  changeLogId: string;
}

export const MusicSheetChangelog = ({ changeLogId }: MusicSheetChangelogProps) => {
  const { data: changelog, isLoading } = useMusicSheetChangelog(changeLogId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!changelog) {
    return null;
  }

  const renderChange = (field: string, change: any) => {
    if (field === 'action') {
      return (
        <div key={field} className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" />
          <span>{change}</span>
        </div>
      );
    }

    // Handle boolean flags
    if (typeof change === 'boolean') {
      return change ? (
        <div key={field} className="flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-500" />
          <span className="capitalize">{field.replace(/_/g, ' ')}</span>
        </div>
      ) : null;
    }

    // Handle count fields
    if (field.includes('_count')) {
      const label = field.replace('_count', '').replace(/_/g, ' ');
      return (
        <div key={field} className="flex items-center gap-2 text-sm">
          <Music className="w-4 h-4 text-primary" />
          <span className="capitalize">{label}:</span>
          <Badge variant="secondary">{change}</Badge>
        </div>
      );
    }

    // Handle old/new value changes
    if (change && typeof change === 'object' && ('old' in change || 'new' in change)) {
      const label = field.replace(/_/g, ' ');
      
      if ('changed' in change) {
        return (
          <div key={field} className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-primary" />
            <span className="capitalize">{label} modified</span>
          </div>
        );
      }

      if ('old_count' in change && 'new_count' in change) {
        const diff = change.new_count - change.old_count;
        return (
          <div key={field} className="flex items-start gap-2 text-sm">
            <Music className="w-4 h-4 text-primary mt-0.5" />
            <div>
              <span className="capitalize font-medium">{label}:</span>
              <div className="text-muted-foreground">
                {diff > 0 ? `Added ${diff}` : `Removed ${Math.abs(diff)}`} songs
                ({change.old_count} → {change.new_count} total)
              </div>
            </div>
          </div>
        );
      }

      return (
        <div key={field} className="flex items-start gap-2 text-sm">
          <Music className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <span className="capitalize font-medium">{label}:</span>
            <div className="text-muted-foreground">
              {change.old && <div className="line-through">{change.old}</div>}
              {change.new && <div className="text-foreground">{change.new}</div>}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div>
      <h4 className="text-sm font-medium mb-3">Changes Made</h4>
      <div className="space-y-2 bg-accent/50 p-3 rounded-md">
        {Object.entries(changelog.changes_summary).map(([field, change]) =>
          renderChange(field, change)
        )}
      </div>
    </div>
  );
};
