import { Bell, BellOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    subscription,
    requestPermission,
    unsubscribe,
    refreshPermissionStatus,
  } = usePushNotifications();

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" />Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">Blocked</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive notifications even when the app is closed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p className="text-xs text-muted-foreground mt-1">
              {subscription ? 'Active on this device' : 'Not configured'}
            </p>
          </div>
          {getPermissionBadge()}
        </div>

        {permission === 'denied' && (
          <div className="space-y-3">
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              Notifications are blocked. Try clicking "Enable" below — if you've reset your browser settings, the prompt will appear. Otherwise, update your site permissions in Chrome first.
            </div>
            <Button onClick={requestPermission} className="w-full">
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
            <Button onClick={refreshPermissionStatus} variant="outline" className="w-full">
              Check Again
            </Button>
          </div>
        )}

        {permission === 'default' && (
          <Button onClick={requestPermission} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Enable Push Notifications
          </Button>
        )}

        {permission === 'granted' && subscription && (
          <Button onClick={unsubscribe} variant="outline" className="w-full">
            <BellOff className="h-4 w-4 mr-2" />
            Disable Notifications
          </Button>
        )}

        {permission === 'granted' && !subscription && (
          <Button onClick={requestPermission} className="w-full">
            <Bell className="h-4 w-4 mr-2" />
            Re-enable Notifications
          </Button>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Works on Chrome, Firefox, Edge, and Safari (iOS 16.4+)</p>
          <p>• Notifications for meetings, messages, assignments & more</p>
        </div>
      </CardContent>
    </Card>
  );
}
