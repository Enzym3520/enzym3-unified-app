import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bug, Lightbulb, MessageCircle, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const feedbackTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, description: 'Something isn\'t working' },
  { value: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest an improvement' },
  { value: 'general', label: 'General', icon: MessageCircle, description: 'Any other feedback' },
] as const;

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [type, setType] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await (supabase as any).from('app_feedback').insert({
        user_id: user.id,
        type,
        message: message.trim().slice(0, 2000),
        page_url: location.pathname,
      });
      if (error) throw error;

      toast({ title: 'Thanks for your feedback! 🎉', description: 'We\'ll review it soon.' });
      setMessage('');
      setType('general');
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to submit feedback', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>Help us improve — tell us what's on your mind.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>What type of feedback?</Label>
            <RadioGroup value={type} onValueChange={setType} className="grid grid-cols-3 gap-2">
              {feedbackTypes.map(ft => (
                <Label
                  key={ft.value}
                  htmlFor={`fb-${ft.value}`}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors text-center ${
                    type === ft.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
                  }`}
                >
                  <RadioGroupItem value={ft.value} id={`fb-${ft.value}`} className="sr-only" />
                  <ft.icon className={`h-5 w-5 ${type === ft.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="text-xs font-medium">{ft.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fb-message">Your feedback</Label>
            <Textarea
              id="fb-message"
              placeholder="Tell us what happened, what you'd like to see, or anything else..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!message.trim() || submitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Sending...' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
