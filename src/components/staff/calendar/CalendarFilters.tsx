import { Search, Calendar, Grid3x3, List, Layout, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEventTypes, useMeetingTypes } from '@/hooks/useAppConfig';

interface CalendarFiltersProps {
  itemType?: 'all' | 'events' | 'meetings';
  onItemTypeChange: (value: 'all' | 'events' | 'meetings') => void;
  eventType?: string;
  onEventTypeChange: (value: string) => void;
  meetingType?: string;
  onMeetingTypeChange: (value: string) => void;
  status?: string;
  onStatusChange: (value: string) => void;
  search?: string;
  onSearchChange: (value: string) => void;
  viewType: 'month' | 'week' | 'day' | 'schedule';
  onViewTypeChange: (value: 'month' | 'week' | 'day' | 'schedule') => void;
}

export function CalendarFilters({
  itemType = 'all',
  onItemTypeChange,
  eventType,
  onEventTypeChange,
  meetingType,
  onMeetingTypeChange,
  status,
  onStatusChange,
  search,
  onSearchChange,
  viewType,
  onViewTypeChange,
}: CalendarFiltersProps) {
  const { eventTypes } = useEventTypes();
  const { meetingTypes } = useMeetingTypes();

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search couples or venues..."
          value={search || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select value={itemType} onValueChange={onItemTypeChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="View" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Items</SelectItem>
          <SelectItem value="events">Events Only</SelectItem>
          <SelectItem value="meetings">Meetings Only</SelectItem>
        </SelectContent>
      </Select>

      {itemType !== 'meetings' && (
        <Select value={eventType || 'all'} onValueChange={onEventTypeChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {eventTypes.map((et) => (
              <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {itemType === 'meetings' && (
        <Select value={meetingType || 'all'} onValueChange={onMeetingTypeChange}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Meeting Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Meetings</SelectItem>
            {meetingTypes.map((mt) => (
              <SelectItem key={mt.value} value={mt.value}>{mt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={status || 'all'} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-1 border rounded-md p-1">
        <Button
          variant={viewType === 'month' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewTypeChange('month')}
          className="gap-1.5"
        >
          <Grid3x3 className="h-4 w-4" />
          <span className="hidden sm:inline">Month</span>
        </Button>
        <Button
          variant={viewType === 'week' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewTypeChange('week')}
          className="gap-1.5"
        >
          <Layout className="h-4 w-4" />
          <span className="hidden sm:inline">Week</span>
        </Button>
        <Button
          variant={viewType === 'day' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewTypeChange('day')}
          className="gap-1.5"
        >
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">Day</span>
        </Button>
        <Button
          variant={viewType === 'schedule' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onViewTypeChange('schedule')}
          className="gap-1.5"
        >
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Schedule</span>
        </Button>
      </div>
    </div>
  );
}
