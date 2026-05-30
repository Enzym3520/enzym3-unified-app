import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Search, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatEventType } from '@/utils/notificationHelpers';
import { cn } from '@/lib/utils';
import { useMeetingTypes } from '@/hooks/useAppConfig';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  weddingId?: string;
  coupleName?: string;
}

export function ScheduleMeetingModal({ isOpen, onClose, weddingId: propWeddingId, coupleName: propCoupleName }: ScheduleMeetingModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [meetingType, setMeetingType] = useState('');
  const [meetingFormat, setMeetingFormat] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedWeddingId, setSelectedWeddingId] = useState('');
  const [selectedCoupleName, setSelectedCoupleName] = useState('');
  const [coupleSearchOpen, setCoupleSearchOpen] = useState(false);
  const { options: meetingTypeOptions } = useMeetingTypes();
  const queryClient = useQueryClient();

  const needsCoupleSelector = !propWeddingId;
  const activeWeddingId = propWeddingId || selectedWeddingId;
  const activeCoupleName = propCoupleName || selectedCoupleName;

  // Fetch active weddings for the couple selector
  const { data: activeWeddings = [] } = useQuery({
    queryKey: ['active-weddings-for-booking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('id, couple_name, event_date, venue, event_type')
        .eq('is_test', false)
        .order('event_date', { ascending: true })
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && needsCoupleSelector,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async () => {
      if (!date || !time || !meetingType || !meetingFormat || !activeWeddingId) {
        throw new Error('Please fill all required fields');
      }

      const { data: inserted, error } = await supabase.from('bookings').insert({
        wedding_id: activeWeddingId,
        booking_date: format(date, 'yyyy-MM-dd'),
        booking_time: time,
        meeting_type: meetingType,
        meeting_format: meetingFormat,
        meeting_link: meetingLink || null,
        customer_notes: notes || null,
        status: 'scheduled',
      } as any).select('id').single();

      if (error) throw error;

      // Auto-generate Jitsi link for online meetings when no custom link was provided
      if (meetingFormat === 'online' && !meetingLink && inserted?.id) {
        const jitsiUrl = `https://meet.jit.si/enzym3-${inserted.id}`;
        const { error: linkError } = await supabase
          .from('bookings')
          .update({ meeting_link: jitsiUrl } as any)
          .eq('id', inserted.id);
        if (linkError) {
          if (import.meta.env.DEV) console.error('Failed to save Jitsi link:', linkError);
          toast.error('Meeting created but video link failed to save. You can add it manually.');
        }
      }
    },
    onSuccess: () => {
      toast.success('Meeting scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      handleClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to schedule meeting');
    },
  });

  const handleClose = () => {
    setDate(undefined);
    setTime('');
    setMeetingType('');
    setMeetingFormat('');
    setMeetingLink('');
    setNotes('');
    setSelectedWeddingId('');
    setSelectedCoupleName('');
    setCoupleSearchOpen(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            {activeCoupleName ? `Schedule a meeting with ${activeCoupleName}` : 'Create a new meeting'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Couple Selector — only when no weddingId prop */}
          {needsCoupleSelector && (
            <div className="space-y-2">
              <Label>Couple / Event *</Label>
              <Popover open={coupleSearchOpen} onOpenChange={setCoupleSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={coupleSearchOpen}
                    className={cn("w-full justify-between", !selectedWeddingId && "text-muted-foreground")}
                  >
                    {selectedWeddingId
                      ? selectedCoupleName
                      : 'Search for a couple...'}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Type client name..." />
                    <CommandList>
                      <CommandEmpty>No couples found.</CommandEmpty>
                      <CommandGroup>
                        {activeWeddings.map((w) => (
                          <CommandItem
                            key={w.id}
                            value={`${w.couple_name} ${w.venue || ''} ${w.event_date}`}
                            onSelect={() => {
                              setSelectedWeddingId(w.id);
                              setSelectedCoupleName(w.couple_name);
                              setCoupleSearchOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedWeddingId === w.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="font-medium">{w.couple_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatEventType(w.event_type)} · {format(new Date(w.event_date), 'PP')}
                                {w.venue ? ` · ${w.venue}` : ''}
                              </span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-type">Meeting Type *</Label>
            <Select value={meetingType} onValueChange={setMeetingType}>
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                {meetingTypeOptions.map((mt) => (
                  <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="format">Format *</Label>
            <Select value={meetingFormat} onValueChange={setMeetingFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_person">In-Person</SelectItem>
                <SelectItem value="online">Online/Virtual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link — only for online meetings */}
          {meetingFormat === 'online' && (
            <div className="space-y-2">
              <Label htmlFor="meeting-link">Meeting Link (Optional)</Label>
              <Input
                id="meeting-link"
                type="url"
                placeholder="https://meet.jit.si/... or Zoom/Teams link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to auto-generate a Jitsi video link
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any meeting notes or agenda items..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => createMeetingMutation.mutate()}
            disabled={createMeetingMutation.isPending || !date || !time || !meetingType || !meetingFormat || !activeWeddingId}
          >
            {createMeetingMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Schedule Meeting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
