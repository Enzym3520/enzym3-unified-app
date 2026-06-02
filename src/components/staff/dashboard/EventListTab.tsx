import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Calendar, MapPin, Users, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { safeFormatDate } from '@/utils/dateHelpers';
import { formatEventType } from '@/utils/notificationHelpers';
import { useIsMobile } from '@/hooks/use-mobile';

type SortField = 'couple_name' | 'event_date' | 'event_type' | 'status';
type SortDirection = 'asc' | 'desc';

interface EventListTabProps {
  externalEvents?: Array<{
    id: string;
    couple_name?: string | null;
    event_type?: string | null;
    event_date?: string | null;
    venue?: string | null;
    status: string;
    guest_count?: number | null;
    package_type?: string | null;
    deposit_paid?: boolean | null;
    booking_source?: string | null;
  }>;
}

export const EventListTab: React.FC<EventListTabProps> = ({ externalEvents }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>('event_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const { data: fetchedEvents = [], isLoading } = useQuery({
    queryKey: ['event-list-tab'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('id, couple_name, event_type, event_date, venue, status, guest_count, package_type, deposit_paid, booking_source')
        .order('event_date', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data;
    },
    enabled: !externalEvents,
  });

  const events = externalEvents ?? fetchedEvents;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) =>
      e.couple_name?.toLowerCase().includes(q) ||
      e.venue?.toLowerCase().includes(q) ||
      e.event_type?.toLowerCase().includes(q)
    );
  }, [events, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortField] || '';
      let bVal: any = b[sortField] || '';
      if (sortField === 'event_date') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (sortDirection === 'asc') return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  }, [filtered, sortField, sortDirection]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = sorted.slice(startIndex, startIndex + pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const statusVariant = (s: string) => {
    if (s === 'completed') return 'default' as const;
    if (s === 'in_progress') return 'secondary' as const;
    return 'outline' as const;
  };

  const paymentBadge = (event: { deposit_paid?: boolean | null; booking_source?: string | null }) => {
    if (event.deposit_paid) {
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-300 text-xs">
          Deposit Paid
        </Badge>
      );
    }
    if (event.booking_source === 'venue_partner') {
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-300 text-xs">
          Venue Partner
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-300 text-xs">
        Awaiting Deposit
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Page Size */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-auto sm:flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client, venue, or event type..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show</span>
          <Select value={pageSize.toString()} onValueChange={(v) => { setPageSize(parseInt(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {sorted.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, sorted.length)} of {sorted.length} events
      </div>

      {sorted.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No events found</p>
      ) : isMobile ? (
        /* Mobile Card View */
        <div className="space-y-2">
          {paginated.map((event) => (
            <Card
              key={event.id}
              className="cursor-pointer active:bg-muted/50"
              onClick={() => navigate(`/staff/event/${event.id}`)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{event.couple_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground truncate">{formatEventType(event.event_type)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={statusVariant(event.status)} className="text-xs">
                      {event.status}
                    </Badge>
                    {paymentBadge(event)}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 flex-wrap gap-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {safeFormatDate(event.event_date, 'MMM d, yyyy', '—')}
                  </span>
                  {event.venue && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[140px]">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {event.venue}
                    </span>
                  )}
                  {event.guest_count && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {event.guest_count}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Desktop Table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('couple_name')} className="flex items-center gap-2 h-auto p-0 font-medium">
                        Client {getSortIcon('couple_name')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('event_type')} className="flex items-center gap-2 h-auto p-0 font-medium">
                        Type {getSortIcon('event_type')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('event_date')} className="flex items-center gap-2 h-auto p-0 font-medium">
                        Date {getSortIcon('event_date')}
                      </Button>
                    </TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>
                      <Button variant="ghost" onClick={() => handleSort('status')} className="flex items-center gap-2 h-auto p-0 font-medium">
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/staff/event/${event.id}`)}
                    >
                      <TableCell className="font-medium">{event.couple_name || 'Unknown'}</TableCell>
                      <TableCell>{formatEventType(event.event_type)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {safeFormatDate(event.event_date, 'MMM d, yyyy', '—')}
                        </span>
                      </TableCell>
                      <TableCell>
                        {event.venue ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {event.venue}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {event.guest_count ? (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            {event.guest_count}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{paymentBadge(event)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(event.status)}>
                          {event.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};
