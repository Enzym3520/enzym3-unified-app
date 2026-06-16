import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Loader2, CheckCircle, RotateCcw, Save, ExternalLink, Trash2, Mic } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMeetingTypes } from '@/hooks/useAppConfig';
import { MeetingTranscriber } from '@/components/staff/meetings/MeetingTranscriber';

interface MeetingDetailModalProps {
  meetingId: string | null;
  isOpen: boolean;
  onClose: () => void;
}


const getStatusBadge = (status: string) => {
  const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    scheduled: { variant: 'outline', className: 'bg-blue-500/10 text-blue-600 border-blue-200' },
    completed: { variant: 'outline', className: 'bg-green-500/10 text-green-600 border-green-200' },
    cancelled: { variant: 'outline', className: 'bg-red-500/10 text-red-600 border-red-200' },
    rescheduled: { variant: 'outline', className: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  };
  const c = config[status] || config.scheduled;
  return <Badge variant={c.variant} className={c.className}>{status}</Badge>;
};

export function MeetingDetailModal({ meetingId, isOpen, onClose }: MeetingDetailModalProps) {
  const { getLabel: getMeetingTypeLabel } = useMeetingTypes();
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTranscriber, setShowTranscriber] = useState(false);
  const [newDate, setNewDate] = useState<Date>();
  const [newTime, setNewTime] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const queryClient = useQueryClient();

  const { data: meeting, isLoading } = useQuery({
    queryKey: ['booking-detail', meetingId],
    queryFn: async () => {
      if (!meetingId) return null;
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', meetingId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!meetingId && isOpen,
  });

  const { data: coupleInfo } = useQuery({
    queryKey: ['booking-couple', meeting?.wedding_id],
    queryFn: async () => {
      if (!meeting?.wedding_id) return null;
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('couple_name, venue, event_date, contact_email')
        .eq('id', meeting.wedding_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!meeting?.wedding_id,
  });

  // Load admin notes once when meeting data arrives
  if (meeting && !notesLoaded) {
    setAdminNotes(meeting.admin_notes || '');
    setNotesLoaded(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!meetingId) throw new Error('No meeting ID');
      const { error } = await supabase
        .from('bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', meetingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', meetingId] });
    },
  });

  const handleReschedule = () => {
    if (!newDate || !newTime) {
      toast.error('Please pick a new date and time');
      return;
    }
    updateMutation.mutate(
      { booking_date: format(newDate, 'yyyy-MM-dd'), booking_time: newTime, status: 'rescheduled' },
      {
        onSuccess: () => {
          toast.success('Meeting rescheduled — n8n will update Google Calendar');
          setIsRescheduling(false);
          setNewDate(undefined);
          setNewTime('');
        },
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!meetingId) throw new Error('No meeting ID');
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', meetingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-detail', meetingId] });
      toast.success('Meeting deleted');
      handleClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleDeleteConfirmed = () => {
    setShowDeleteConfirm(false);
    deleteMutation.mutate();
  };

  const handleComplete = () => {
    updateMutation.mutate(
      { status: 'completed', admin_notes: adminNotes || null },
      {
        onSuccess: () => toast.success('Meeting marked as completed'),
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const handleSaveNotes = () => {
    updateMutation.mutate(
      { admin_notes: adminNotes || null },
      {
        onSuccess: () => toast.success('Notes saved'),
        onError: (e: Error) => toast.error(e.message),
      }
    );
  };

  const handleClose = () => {
    setIsRescheduling(false);
    setShowTranscriber(false);
    setNewDate(undefined);
    setNewTime('');
    setNotesLoaded(false);
    setAdminNotes('');
    onClose();
  };

  const isTerminal = meeting?.status === 'completed';
  const isMutating = updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            Meeting Details
          </DialogTitle>
          <DialogDescription>
            {coupleInfo?.couple_name
              ? `${getMeetingTypeLabel(meeting?.meeting_type || '')} with ${coupleInfo.couple_name}`
              : 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : meeting ? (
          <div className="space-y-5 py-2">
            {/* Status + Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{getMeetingTypeLabel(meeting.meeting_type)}</span>
              {getStatusBadge(meeting.status)}
            </div>

            {/* Date / Time / Format */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <div className="flex items-center gap-2 text-sm">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  {format(parseISO(meeting.booking_date), 'PPP')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Time</Label>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(`2000-01-01T${meeting.booking_time}`), 'h:mm a')}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Format</Label>
                <div className="flex items-center gap-2 text-sm">
                  {meeting.meeting_format === 'online' ? (
                    <><Video className="h-4 w-4 text-muted-foreground" /> Online</>
                  ) : (
                    <><MapPin className="h-4 w-4 text-muted-foreground" /> In-Person</>
                  )}
                </div>
              </div>
              {coupleInfo?.venue && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Venue</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{coupleInfo.venue}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Link */}
            {(meeting as any).meeting_link && (
              <div className="space-y-2 overflow-hidden">
                <Label className="text-xs text-muted-foreground">Meeting Link</Label>
                <a
                  href={(meeting as any).meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/20 transition-colors min-w-0"
                >
                  <Video className="h-4 w-4 shrink-0" />
                  Join Meeting
                  <ExternalLink className="h-3.5 w-3.5 ml-auto shrink-0" />
                </a>
                <p className="text-xs text-muted-foreground truncate max-w-full">{(meeting as any).meeting_link}</p>
              </div>
            )}

            {/* Customer Notes (read-only) */}
            {meeting.customer_notes && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Customer Notes</Label>
                <p className="text-sm bg-muted/50 rounded-md p-3">{meeting.customer_notes}</p>
              </div>
            )}

            {/* Vendor Notes (read-only for admin) */}
            {(meeting as any).vendor_notes && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vendor Notes</Label>
                <p className="text-sm bg-muted/50 rounded-md p-3">{(meeting as any).vendor_notes}</p>
              </div>
            )}

            {/* Vendor RSVP Status */}
            {(meeting as any).vendor_rsvp && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vendor RSVP</Label>
                <Badge variant="outline" className={(meeting as any).vendor_rsvp === 'accepted' ? 'bg-green-500/10 text-green-600 border-green-200' : 'bg-red-500/10 text-red-600 border-red-200'}>
                  {(meeting as any).vendor_rsvp === 'accepted' ? 'Accepted' : 'Declined'}
                </Badge>
              </div>
            )}

            {/* Admin Notes (editable) */}
            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add internal notes about this meeting..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveNotes}
                disabled={updateMutation.isPending}
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Notes
              </Button>
            </div>

            {/* Transcription */}
            {meetingId && (
              showTranscriber ? (
                <MeetingTranscriber
                  bookingId={meetingId}
                  coupleName={coupleInfo?.couple_name || undefined}
                  onClose={() => setShowTranscriber(false)}
                />
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowTranscriber(true)}>
                  <Mic className="h-3.5 w-3.5 mr-1" />
                  Transcribe Meeting
                </Button>
              )
            )}

            {/* Reschedule Panel */}
            {isRescheduling && (
              <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="text-sm font-semibold">Reschedule Meeting</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">New Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn("w-full justify-start text-left", !newDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                          {newDate ? format(newDate, 'PP') : 'Pick date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={newDate} onSelect={setNewDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">New Time</Label>
                    <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleReschedule} disabled={updateMutation.isPending || !newDate || !newTime}>
                    {updateMutation.isPending && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                    Confirm Reschedule
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsRescheduling(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isTerminal && !isRescheduling && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsRescheduling(true)}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Reschedule
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteConfirm(true)} disabled={isMutating}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete Meeting
                </Button>
                <Button size="sm" onClick={handleComplete} disabled={isMutating}>
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Mark Completed
                </Button>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">Meeting not found.</p>
        )}
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this meeting?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meeting. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Meeting</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
