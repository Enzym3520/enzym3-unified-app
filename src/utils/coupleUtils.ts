export const getSourceBadgeColor = (source: string) => {
  switch (source) {
    case 'wedding': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'event_notification': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'form_submission': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const getSourceLabel = (source: string) => {
  switch (source) {
    case 'wedding': return 'Wedding Record';
    case 'event_notification': return 'Event Notification';
    case 'form_submission': return 'Form Submission';
    default: return source;
  }
};