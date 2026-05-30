import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { NotificationItem } from './NotificationItem';
import { CheckCheck, Inbox } from 'lucide-react';

interface NotificationDropdownProps {
  onNavigate?: () => void;
}

export const NotificationDropdown = ({ onNavigate }: NotificationDropdownProps = {}) => {
  const { notifications, isLoading, markAllAsRead, unreadCount } = useInAppNotifications();

  // Show more notifications since this is now the primary notification center
  const recentNotifications = notifications.slice(0, 15);

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-4">
        <h3 className="font-semibold">Notifications</h3>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="h-8 text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>
      <Separator />
      
      {recentNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Inbox className="w-12 h-12 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  compact
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </ScrollArea>
      )}
    </div>
  );
};
