import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';

// NotificationHistory — stub component (full implementation pending)
const NotificationHistory: React.FC = () => {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>Notification history coming soon.</p>
      </CardContent>
    </Card>
  );
};

export default NotificationHistory;
