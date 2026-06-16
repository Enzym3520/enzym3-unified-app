import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Eye, MessageSquare, Calendar, User, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { useReminders } from '@/hooks/useReminders';
import { Reminder } from '@/types/reminder';

interface PendingApproval extends Reminder {
  submissionData?: {
    coupleName: string;
    eventDate: string;
    venue: string;
    eventType: string;
    coordinator: string;
  };
}

export const CoordinatorApproval: React.FC = () => {
  const { reminders, updateReminder, loading } = useReminders();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReminder, setSelectedReminder] = useState<PendingApproval | null>(null);
  const [approvalNote, setApprovalNote] = useState('');

  const pendingReminders = reminders.filter(reminder => 
    reminder.status === 'pending_approval' || reminder.status === 'pending'
  ) as PendingApproval[];

  const filteredReminders = pendingReminders.filter(reminder => {
    if (filter === 'all') return true;
    if (filter === 'pending') return reminder.status === 'pending_approval' || reminder.status === 'pending';
    return reminder.status === filter;
  });

  const handleApproval = async (reminderId: string, approved: boolean, note?: string) => {
    try {
      await updateReminder(reminderId, {
        status: approved ? 'approved' : 'cancelled',
        notes: note || approvalNote
      });

      toast({
        title: approved ? 'Reminder Approved' : 'Reminder Rejected',
        description: approved 
          ? 'The reminder has been approved and will be sent as scheduled.'
          : 'The reminder has been rejected and will not be sent.',
      });

      setSelectedReminder(null);
      setApprovalNote('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reminder status.',
        variant: 'destructive'
      });
    }
  };

  const handleBulkApproval = async (action: 'approve' | 'reject') => {
    const selectedIds = filteredReminders
      .filter(r => r.status === 'pending_approval' || r.status === 'pending')
      .map(r => r.id);

    try {
      await Promise.all(
        selectedIds.map(id => 
          updateReminder(id, {
            status: action === 'approve' ? 'approved' : 'cancelled'
          })
        )
      );

      toast({
        title: `Bulk ${action === 'approve' ? 'Approval' : 'Rejection'} Complete`,
        description: `${selectedIds.length} reminders have been ${action === 'approve' ? 'approved' : 'rejected'}.`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to process bulk action.',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Coordinator Approval</h2>
          <p className="text-muted-foreground">
            Review and approve automatically generated reminders
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reminders</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{pendingReminders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {reminders.filter(r => {
                    const scheduledDate = new Date(r.scheduled_date);
                    const now = new Date();
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return scheduledDate >= now && scheduledDate <= weekFromNow;
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {reminders.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {reminders.filter(r => r.status === 'cancelled').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {filteredReminders.filter(r => r.status === 'pending_approval' || r.status === 'pending').length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredReminders.filter(r => r.status === 'pending_approval' || r.status === 'pending').length} reminders pending approval
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkApproval('reject')}
                >
                  Reject All
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleBulkApproval('approve')}
                >
                  Approve All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No reminders found for the selected filter.</p>
            </CardContent>
          </Card>
        ) : (
          filteredReminders.map((reminder) => (
            <Card key={reminder.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge variant={
                        reminder.status === 'approved' ? 'default' :
                        reminder.status === 'cancelled' ? 'destructive' :
                        'secondary'
                      }>
                        {reminder.status === 'pending_approval' || reminder.status === 'pending' 
                          ? 'Pending' 
                          : reminder.status
                        }
                      </Badge>
                      <Badge variant="outline">
                        {reminder.reminder_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Badge variant={
                        reminder.priority === 'high' ? 'destructive' :
                        reminder.priority === 'medium' ? 'default' :
                        'secondary'
                      }>
                        {reminder.priority} priority
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{reminder.contact_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{reminder.contact_email}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            Scheduled: {format(new Date(reminder.scheduled_date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        {reminder.event_context?.event_date && (
                          <div className="text-sm text-muted-foreground">
                            Event: {format(parseLocalDate(reminder.event_context.event_date), 'MMM dd, yyyy')}
                          </div>
                        )}
                      </div>
                    </div>

                    {reminder.notes && (
                      <div className="flex items-start gap-2 mt-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-sm text-muted-foreground">{reminder.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Review Reminder</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium mb-2">Contact Details</h4>
                              <p><strong>Name:</strong> {reminder.contact_name}</p>
                              <p><strong>Email:</strong> {reminder.contact_email}</p>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Reminder Details</h4>
                              <p><strong>Type:</strong> {reminder.reminder_type}</p>
                              <p><strong>Scheduled:</strong> {format(new Date(reminder.scheduled_date), 'MMM dd, yyyy')}</p>
                              <p><strong>Priority:</strong> {reminder.priority}</p>
                            </div>
                          </div>
                          
                          {reminder.generated_message && (
                            <div>
                              <h4 className="font-medium mb-2">Generated Message</h4>
                              <div className="bg-muted p-3 rounded-md">
                                <p className="text-sm whitespace-pre-wrap">{reminder.generated_message}</p>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Approval Note (Optional)
                            </label>
                            <Textarea
                              value={approvalNote}
                              onChange={(e) => setApprovalNote(e.target.value)}
                              placeholder="Add a note about your decision..."
                              rows={3}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleApproval(reminder.id, false, approvalNote)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApproval(reminder.id, true, approvalNote)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {(reminder.status === 'pending_approval' || reminder.status === 'pending') && (
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(reminder.id, false)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(reminder.id, true)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};