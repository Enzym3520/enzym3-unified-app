import React, { useState, useMemo } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useReminders } from '@/hooks/useReminders';
import { filterReminders } from '@/utils/reminderEngine';
import { Reminder, ReminderFilters as ReminderFiltersType, CreateReminderData } from '@/types/reminder';
import ReminderStats from './ReminderStats';
import ReminderFilters from './ReminderFilters';
import ReminderCard from './ReminderCard';
import CreateReminderModal from './CreateReminderModal';
import MessageGeneratorModal from './MessageGeneratorModal';
import ContactSelector from './ContactSelector';
import { NotificationSettings } from '@/components/NotificationSettings';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const RemindersView = () => {
  const { reminders, loading, createReminder, updateReminder, deleteReminder, markReminderAsSent, markReminderAsCompleted, stats, refetch } = useReminders();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<ReminderFiltersType>({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
    dateRange: {}
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [prefilledData, setPrefilledData] = useState<Partial<CreateReminderData> | undefined>(undefined);
  const [selectedReminderForMessage, setSelectedReminderForMessage] = useState<Reminder | null>(null);

  const filteredReminders = useMemo(() => 
    filterReminders(reminders, filters), 
    [reminders, filters]
  );

  const handleCreateReminder = async (data: CreateReminderData) => {
    await createReminder(data);
    toast({ title: "Success", description: "Reminder created successfully" });
  };

  const handleSelectContact = (reminderData: Partial<CreateReminderData>) => {
    setPrefilledData(reminderData);
    setShowContactSelector(false);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setPrefilledData(undefined);
  };

  const handleDeleteReminder = async (reminder: Reminder) => {
    await deleteReminder(reminder.id);
    toast({ title: "Success", description: "Reminder deleted" });
  };

  const handleSaveMessage = async (reminderId: string, message: string) => {
    await updateReminder(reminderId, { generated_message: message });
    toast({ title: "Success", description: "Message saved to reminder" });
  };

  const handleSendNow = async (reminder: Reminder) => {
    try {
      // Send both email and push notification
      const [emailResult, pushResult] = await Promise.allSettled([
        supabase.functions.invoke('send-reminder-email', {
          body: { reminderId: reminder.id, sendNow: true }
        }),
        supabase.functions.invoke('send-push-notification', {
          body: { reminderId: reminder.id }
        })
      ]);

      const emailSuccess = emailResult.status === 'fulfilled' && !emailResult.value.error;
      const pushSuccess = pushResult.status === 'fulfilled' && !pushResult.value.error;

      if (emailSuccess || pushSuccess) {
        const channels = [];
        if (emailSuccess) channels.push('email');
        if (pushSuccess) channels.push('push notification');
        
        toast({
          title: "Reminder Sent",
          description: `Sent via ${channels.join(' and ')} to ${reminder.contact_email}`,
        });
      } else {
        throw new Error('Failed to send reminder');
      }
      
      refetch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading reminders...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Manage Reminders</h1>
      {/* Enhanced Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 md:p-6 bg-card rounded-xl border shadow-card">
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">
            Reminder Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Create and track client follow-ups across your event pipeline
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setShowContactSelector(true)} 
            variant="outline"
            className="w-full sm:w-auto hover-lift"
          >
            <Users className="w-4 h-4 mr-2" />
            From Contact
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto hover-lift bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
        <NotificationSettings />
      </div>

      {/* Enhanced Stats */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <ReminderStats stats={stats} />
      </div>

      {/* Enhanced Filters */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <ReminderFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Enhanced Content Area */}
      <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        {filteredReminders.length === 0 ? (
          <Card className="border-dashed border-2 hover-lift">
            <CardContent className="p-8 md:p-12 text-center">
              <div className="text-4xl md:text-6xl mb-4 animate-bounce-gentle">📅</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-foreground">
                No reminders found
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-md mx-auto">
                {reminders.length === 0 
                  ? "Get started by creating your first reminder to keep track of client follow-ups."
                  : "No reminders match your current filters. Try adjusting your search criteria."
                }
              </p>
              {reminders.length === 0 && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 hover-lift"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Reminder
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
            {filteredReminders.map((reminder, index) => (
              <div 
                key={reminder.id}
                className="animate-scale-bounce"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ReminderCard
                  reminder={reminder}
                  onEdit={() => {}} // Edit functionality can be added later
                  onDelete={handleDeleteReminder}
                  onMarkAsSent={(reminder) => markReminderAsSent(reminder.id)}
                  onMarkAsCompleted={(reminder) => markReminderAsCompleted(reminder.id)}
                  onGenerateMessage={setSelectedReminderForMessage}
                  onSendNow={handleSendNow}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateReminderModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateReminder}
        defaultValues={prefilledData}
      />

      <Dialog open={showContactSelector} onOpenChange={setShowContactSelector}>
        <DialogContent className="max-w-4xl max-h-[90vh] mobile-card">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Select From Existing Contacts</DialogTitle>
          </DialogHeader>
          <ContactSelector
            onSelectContact={handleSelectContact}
            onClose={() => setShowContactSelector(false)}
          />
        </DialogContent>
      </Dialog>

      <MessageGeneratorModal
        reminder={selectedReminderForMessage}
        isOpen={!!selectedReminderForMessage}
        onClose={() => setSelectedReminderForMessage(null)}
        onSaveMessage={handleSaveMessage}
      />
    </div>
  );
};

export default RemindersView;