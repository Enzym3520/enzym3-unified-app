import React, { useState, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreateReminderData } from '@/types/reminder';
import { REMINDER_TEMPLATES } from '@/utils/reminderEngine';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateReminderData) => Promise<void>;
  defaultValues?: Partial<CreateReminderData>;
}

const CreateReminderModal = ({ isOpen, onClose, onSubmit, defaultValues }: CreateReminderModalProps) => {
  const [formData, setFormData] = useState<CreateReminderData>({
    contact_email: '',
    contact_name: '',
    reminder_type: 'custom',
    scheduled_date: '',
    channel: 'email',
    priority: 'medium',
    message_template: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  // Update form data when defaultValues change
  useEffect(() => {
    if (defaultValues && isOpen) {
      setFormData(prev => ({
        ...prev,
        ...defaultValues
      }));
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        contact_email: '',
        contact_name: '',
        reminder_type: 'custom',
        scheduled_date: '',
        channel: 'email',
        priority: 'medium',
        message_template: '',
        notes: ''
      });
    }
  }, [defaultValues, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        contact_email: '',
        contact_name: '',
        reminder_type: 'custom',
        scheduled_date: '',
        channel: 'email',
        priority: 'medium',
        message_template: '',
        notes: ''
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating reminder:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = REMINDER_TEMPLATES.find(t => t.type === formData.reminder_type);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mobile-card">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-lg md:text-xl font-semibold text-center">
            {defaultValues ? 'Create Reminder from Contact' : 'Create New Reminder'}
          </DialogTitle>
          {defaultValues && (
            <div className="text-sm text-muted-foreground bg-gradient-to-r from-status-pending-bg to-status-pending-bg/50 p-3 rounded-lg border border-status-pending/20 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <span>Form pre-filled with contact information</span>
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name" className="text-sm font-medium">Contact Name *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Enter contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="text-sm font-medium">Contact Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Enter email address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder_type" className="text-sm font-medium">Reminder Type</Label>
            <Select 
              value={formData.reminder_type} 
              onValueChange={(value: any) => setFormData({ ...formData, reminder_type: value })}
            >
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select reminder type" />
              </SelectTrigger>
              <SelectContent>
                {REMINDER_TEMPLATES.map(template => (
                  <SelectItem key={template.type} value={template.type} className="hover:bg-accent/50">
                    {template.title}
                  </SelectItem>
                ))}
                <SelectItem value="custom" className="hover:bg-accent/50">Custom</SelectItem>
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-xs md:text-sm text-muted-foreground/80 mt-2 p-2 bg-surface-overlay/30 rounded-md border border-border/30 animate-fade-in">
                {selectedTemplate.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_date" className="text-sm font-medium">Scheduled Date *</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                required
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low" className="hover:bg-accent/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-priority-low"></div>
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium" className="hover:bg-accent/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-priority-medium"></div>
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high" className="hover:bg-accent/50">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-priority-high"></div>
                      High Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="channel" className="text-sm font-medium">Communication Channel</Label>
            <Select 
              value={formData.channel} 
              onValueChange={(value: any) => setFormData({ ...formData, channel: value })}
            >
              <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-primary/20">
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email" className="hover:bg-accent/50">📧 Email</SelectItem>
                <SelectItem value="phone" className="hover:bg-accent/50">📞 Phone</SelectItem>
                <SelectItem value="both" className="hover:bg-accent/50">📱 Both Email & Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or context for this reminder..."
              rows={3}
              className="resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border/30">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="w-full sm:w-auto hover-lift"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full sm:w-auto hover-lift bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Reminder'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReminderModal;