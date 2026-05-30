import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackModal } from './FeedbackModal';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        title="Send Feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>
      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
