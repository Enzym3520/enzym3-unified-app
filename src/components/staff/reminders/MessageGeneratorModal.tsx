import React, { useState } from 'react';
import { MessageSquare, Copy, Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Reminder } from '@/types/reminder';
import { getReminderTemplate } from '@/utils/reminderEngine';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MessageGeneratorModalProps {
  reminder: Reminder | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveMessage: (reminderId: string, message: string) => Promise<void>;
}

const MessageGeneratorModal = ({ reminder, isOpen, onClose, onSaveMessage }: MessageGeneratorModalProps) => {
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateMessage = async () => {
    if (!reminder) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-reminder-message', {
        body: {
          reminder: {
            id: reminder.id,
            contact_name: reminder.contact_name,
            contact_email: reminder.contact_email,
            reminder_type: reminder.reminder_type,
            scheduled_date: reminder.scheduled_date,
            event_context: reminder.event_context,
            notes: reminder.notes
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate message');
      }

      if (data?.success && data?.message) {
        setGeneratedMessage(data.message);
        toast({
          title: "Success",
          description: "AI message generated successfully!"
        });
      } else {
        throw new Error(data?.error || 'Failed to generate message');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard"
    });
  };

  const handleSaveMessage = async () => {
    if (!reminder) return;
    
    const messageToSave = customMessage || generatedMessage;
    if (!messageToSave) return;

    try {
      await onSaveMessage(reminder.id, messageToSave);
      toast({
        title: "Success",
        description: "Message saved to reminder"
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save message",
        variant: "destructive"
      });
    }
  };

  if (!reminder) return null;

  const template = getReminderTemplate(reminder.reminder_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Generate Message for {reminder.contact_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reminder Details */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Reminder Details</h3>
                <Badge variant="outline">
                  {reminder.reminder_type.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <p>{reminder.contact_name}</p>
                  <p className="text-muted-foreground">{reminder.contact_email}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Scheduled:</span>
                  <p>{reminder.scheduled_date}</p>
                  <span className="text-muted-foreground">Priority:</span>
                  <p className="capitalize">{reminder.priority}</p>
                </div>
              </div>
              {reminder.event_context && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-muted-foreground text-sm">Event Context:</span>
                  <pre className="text-xs mt-1 bg-muted/50 p-2 rounded">
                    {JSON.stringify(reminder.event_context, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Template Info */}
          {template && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">{template.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                <div className="text-xs">
                  <span className="text-muted-foreground">Available variables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.variables.map(variable => (
                      <Badge key={variable} variant="secondary" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Generated Message</Label>
              <Button 
                onClick={handleGenerateMessage} 
                disabled={loading}
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>

            {generatedMessage && (
              <div className="space-y-2">
                <Textarea
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyToClipboard(generatedMessage)}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Custom Message */}
          <div className="space-y-2">
            <Label htmlFor="custom-message">Custom Message (Optional)</Label>
            <Textarea
              id="custom-message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write your own custom message or edit the generated one..."
              rows={6}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveMessage}
              disabled={!generatedMessage && !customMessage}
            >
              <Send className="w-4 h-4 mr-2" />
              Save Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageGeneratorModal;