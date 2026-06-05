import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Calendar, User, Loader2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';
type SortField = 'couple_name' | 'event_date' | 'event_type' | 'status' | 'coordinator_name' | 'created_at';
type SortDirection = 'asc' | 'desc';

interface EventHistoryRow {
  id: string;
  couple_name: string;
  event_date: string | null;
  event_type: string | null;
  status: string | null;
  contact_email: string | null;
  coordinator_name: string | null;
  venue: string | null;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatEventDate(date: string | null): string {
  if (!date) return '—';
  try {
    return format(parseLocalDate(date), 'MMM d, yyyy');
  } catch {
    return date;
  }
}

function formatCreatedAt(ts: string): string {
  try {
    return format(new Date(ts), 'MMM d, yyyy');
  } catch {
    return ts;
  }
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? 'pending').toLowerCase();
  const cls = STATUS_BADGE[s] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls} capitalize`}>
      {s}
    </span>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

// ─── Mobile card ─────────────────────────────────────────────────────────────

function MobileCard({ row, onClick }: { row: EventHistoryRow; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-sm leading-tight">{row.couple_name || '—'}</span>
          <StatusBadge status={row.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatEventDate(row.event_date)}
          </span>
          {row.event_type && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              {row.event_type}
            </Badge>
          )}
          {row.coordinator_name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {row.coordinator_name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const NotificationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortField, setSortField] = useState<SortField>('event_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notification-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select(
          'id, couple_name, event_date, event_type, status, contact_email, coordinator_name, venue, created_at'
        )
        .order('event_date', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as EventHistoryRow[];
    },
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((r) => {
      const matchesStatus =
        statusFilter === 'all' || (r.status ?? '').toLowerCase() === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        (r.couple_name ?? '').toLowerCase().includes(q) ||
        (r.contact_email ?? '').toLowerCase().includes(q)
      );
    });
  }, [data, search, statusFilter]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      let aVal: any = (a as any)[sortField] ?? '';
      let bVal: any = (b as any)[sortField] ?? '';
      if (sortField === 'event_date' || sortField === 'created_at') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (sortDirection === 'asc') return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  }, [rows, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const goToEvent = (id: string) => navigate(`/staff/event/${id}`);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Search + status filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="w-full"
      >
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as StatusFilter[]).map(
            (s) => (
              <TabsTrigger key={s} value={s} className="capitalize text-xs">
                {s === 'all' ? 'All' : s}
              </TabsTrigger>
            )
          )}
        </TabsList>
      </Tabs>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading history…</span>
            </div>
            <TableSkeleton />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {isError && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">
            Failed to load notification history. Please refresh.
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !isError && sorted.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No events found</p>
            <p className="text-sm mt-1">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filter.'
                : 'No events have been recorded yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Mobile cards (< md) */}
      {!isLoading && !isError && sorted.length > 0 && (
        <>
          <div className="flex md:hidden flex-col gap-3">
            {sorted.map((row) => (
              <MobileCard key={row.id} row={row} onClick={() => goToEvent(row.id)} />
            ))}
          </div>

          {/* Desktop table (≥ md) */}
          <Card className="hidden md:block overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/30">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {sorted.length} {sorted.length === 1 ? 'event' : 'events'}
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/20 text-muted-foreground text-xs uppercase tracking-wide">
                    {([
                      { field: 'couple_name' as SortField, label: 'Name' },
                      { field: 'event_date' as SortField, label: 'Date' },
                      { field: 'event_type' as SortField, label: 'Type' },
                      { field: 'status' as SortField, label: 'Status' },
                      { field: 'coordinator_name' as SortField, label: 'Coordinator' },
                      { field: 'created_at' as SortField, label: 'Created' },
                    ]).map(({ field, label }) => (
                      <th key={field} className="text-left px-4 py-2 font-medium">
                        <button
                          onClick={() => handleSort(field)}
                          className="flex items-center hover:text-foreground transition-colors"
                        >
                          {label}<SortIcon field={field} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, idx) => (
                    <tr
                      key={row.id}
                      onClick={() => goToEvent(row.id)}
                      className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                        idx % 2 === 0 ? '' : 'bg-muted/10'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-primary hover:underline">
                        {row.couple_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatEventDate(row.event_date)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.event_type ? (
                          <Badge variant="outline" className="text-xs">
                            {row.event_type}
                          </Badge>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.coordinator_name || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatCreatedAt(row.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationHistory;
