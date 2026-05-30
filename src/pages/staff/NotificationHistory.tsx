import React from 'react';
import NotificationHistory from '@/components/staff/notifications/NotificationHistory';

const NotificationHistoryPage = () => {
  return (
    <div className="py-6 md:py-8 px-2 md:px-4 pb-24 overflow-hidden">
      <div className="container mx-auto max-w-6xl min-w-0">
        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary mb-4">Notification History</h1>
        <NotificationHistory />
      </div>
    </div>
  );
};

export default NotificationHistoryPage;
