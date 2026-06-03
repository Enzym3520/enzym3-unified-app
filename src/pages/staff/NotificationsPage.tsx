import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useInAppNotifications } from '@/hooks/useInAppNotifications';
import { NotificationItem } from '@/components/staff/notifications/NotificationItem';
import { CheckCheck, Inbox, Package, Music } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsPage() {
  const { notifications, isLoading, markAllAsRead, unreadCount } = useInAppNotifications();
  const [activeTab, setActiveTab] = useState('all');

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const upgradeNotifications = notifications.filter(n => n.type === 'upgrade_order');
  const musicSheetNotifications = notifications.filter(
    n => n.type === 'music_sheet_created' || n.type === 'music_sheet_updated'
  );

  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return unreadNotifications;
      case 'upgrades':
        return upgradeNotifications;
      case 'music':
        return musicSheetNotifications;
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="all">
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="upgrades">
            <Package className="w-4 h-4 mr-2" />
            Upgrades ({upgradeNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="music">
            <Music className="w-4 h-4 mr-2" />
            Vibe Sheets ({musicSheetNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'all' && 'All Notifications'}
                {activeTab === 'unread' && 'Unread Notifications'}
                {activeTab === 'upgrades' && 'Upgrade Orders'}
                {activeTab === 'music' && 'Vibe Sheet Updates'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center">
                  <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === 'unread' ? "You're all caught up!" : "No notifications in this category"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
