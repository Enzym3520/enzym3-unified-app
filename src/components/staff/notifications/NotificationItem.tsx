import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInAppNotifications, InAppNotification } from '@/hooks/useInAppNotifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNotificationConfig, isFromVibePlanner } from './notificationTypeMap';
import { resolveNotificationRoute } from '@/utils/notificationRouting';

interface NotificationItemProps {
  notification: InAppNotification;
  compact?: boolean;
  onNavigate?: () => void;
}

export const NotificationItem = ({ notification, compact = false, onNavigate }: NotificationItemProps) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useInAppNotifications();

  const { Icon } = getNotificationConfig(notification.type);
  const fromVibePlanner = isFromVibePlanner(notification);

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    navigate(resolveNotificationRoute(notification, 'staff'));
    onNavigate?.();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(notification.id);
  };

  return (
    <div
      className={cn(
        'p-4 hover:bg-accent cursor-pointer transition-colors relative group',
        !notification.is_read && 'bg-accent/50'
      )}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{notification.title}</p>
              {fromVibePlanner && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                  Vibe Planner
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              onClick={handleDelete}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.content}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
        )}
      </div>
    </div>
  );
};
