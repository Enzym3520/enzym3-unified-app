import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { safeFormatDate } from '@/utils/dateHelpers';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { InAppNotification } from '@/hooks/useInAppNotifications';
import { MusicSheetChangelog } from './MusicSheetChangelog';
import { ExternalLink } from 'lucide-react';
import {
  getNotificationConfig,
  buildNotificationHref,
  isFromVibePlanner,
} from './notificationTypeMap';

interface NotificationDetailProps {
  notification: InAppNotification;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationDetail = ({ notification, open, onOpenChange }: NotificationDetailProps) => {
  const navigate = useNavigate();
  const { Icon } = getNotificationConfig(notification.type);
  const fromVibePlanner = isFromVibePlanner(notification);

  const handleNavigate = () => {
    const href = buildNotificationHref(notification);
    if (href) {
      navigate(href);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <Icon className="w-6 h-6 text-primary" />
            <SheetTitle>{notification.title}</SheetTitle>
            {fromVibePlanner && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                Vibe Planner
              </Badge>
            )}
          </div>
          <SheetDescription>
            {format(new Date(notification.created_at), 'PPpp')}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Details</h4>
            <p className="text-sm text-muted-foreground">{notification.content}</p>
          </div>

          {notification.metadata && (
            <>
              <Separator />
              <div className="space-y-3">
                {notification.metadata.couple_name && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Couple:</span>
                    <span className="text-sm font-medium">{notification.metadata.couple_name}</span>
                  </div>
                )}

                {notification.metadata.event_date && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Event Date:</span>
                    <span className="text-sm font-medium">
                      {safeFormatDate(notification.metadata.event_date, 'PP', '—')}
                    </span>
                  </div>
                )}

                {notification.type === 'upgrade_order' && (
                  <>
                    {notification.metadata.package && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Package:</span>
                        <Badge>{notification.metadata.package}</Badge>
                      </div>
                    )}

                    {notification.metadata.emerald_choice && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Emerald Choice:</span>
                        <span className="text-sm font-medium">{notification.metadata.emerald_choice}</span>
                      </div>
                    )}

                    {notification.metadata.payment_status && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payment Status:</span>
                        <Badge variant={notification.metadata.payment_status === 'paid' ? 'default' : 'secondary'}>
                          {notification.metadata.payment_status}
                        </Badge>
                      </div>
                    )}

                    {notification.metadata.notes && (
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Notes:</span>
                        <p className="text-sm">{notification.metadata.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {(notification.type === 'music_sheet_created' || notification.type === 'music_sheet_updated') &&
            notification.metadata?.change_log_id && (
              <>
                <Separator />
                <MusicSheetChangelog changeLogId={notification.metadata.change_log_id} />
              </>
            )}

          {buildNotificationHref(notification) && (
            <>
              <Separator />
              <Button onClick={handleNavigate} className="w-full">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Full Details
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
