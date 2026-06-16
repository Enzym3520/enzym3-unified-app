import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, Package, Calendar, MapPin, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { parseLocalDate } from '@/utils/dateHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';

type SubmissionType = 'all' | 'events' | 'music' | 'upgrades';

interface EventSubmission {
  id: string;
  couple_name: string;
  event_type: string;
  event_date: string;
  venue: string | null;
  status: string;
  contact_email: string;
  created_at: string;
  type: 'event';
}

interface MusicSheetSubmission {
  id: string;
  wedding_id: string;
  created_at: string;
  type: 'music';
  event_id?: string;
  wedding: {
    couple_name: string;
    event_date: string;
    venue?: string;
    contact_email: string;
  };
}

interface UpgradeSubmission {
  id: string;
  wedding_id: string;
  selected_package: string;
  payment_status: string;
  created_at: string;
  type: 'upgrade';
  event_id?: string;
  wedding: {
    couple_name: string;
    event_date: string;
    venue?: string;
    contact_email: string;
  };
}

type Submission = EventSubmission | MusicSheetSubmission | UpgradeSubmission;

export default function SubmissionsDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [submissionType, setSubmissionType] = useState<SubmissionType>('all');
  const navigate = useNavigate();

  // Fetch event notifications
  const { data: eventNotifications = [] } = useQuery({
    queryKey: ['event-notifications-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_recent_notifications', { p_limit: 200 });
      if (error) throw error;
      return (data || []).map((e: any) => ({
        id: e.id,
        couple_name: e.couple_name,
        event_type: e.event_type,
        event_date: e.event_date,
        venue: e.venue,
        status: e.status,
        contact_email: e.contact_email,
        created_at: e.created_at,
        type: 'event' as const,
      }));
    },
  });

  // Fetch submitted vibe sheets (couple-submitted from Vibe Planner) and legacy music_sheets
  const { data: musicSheets = [] } = useQuery({
    queryKey: ['music-sheets-submitted'],
    queryFn: async () => {
      const [vibeRes, legacyRes, weddingsRes] = await Promise.all([
        supabase
          .from('vibe_sheets')
          .select('id, wedding_id, submitted_at, created_at, updated_at')
          .not('submitted_at', 'is', null)
          .order('submitted_at', { ascending: false })
          .limit(500),
        supabase
          .from('music_sheets')
          .select('id, wedding_id, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('weddings')
          .select('id, couple_names, wedding_date')
          .limit(2000),
      ]);
      if (vibeRes.error) throw vibeRes.error;
      if (legacyRes.error) throw legacyRes.error;
      if (weddingsRes.error) throw weddingsRes.error;
      const weddings = weddingsRes.data || [];
      const all = [
        ...((vibeRes.data || []).map(v => ({
          id: v.id,
          wedding_id: v.wedding_id,
          created_at: v.submitted_at || v.created_at,
          _wedding: weddings.find(w => w.id === v.wedding_id),
        }))),
        ...((legacyRes.data || []).map(m => ({
          id: m.id,
          wedding_id: m.wedding_id,
          created_at: m.created_at,
          _wedding: weddings.find(w => w.id === m.wedding_id),
        }))),
      ];
      // Dedupe by wedding_id (one per couple)
      const seen = new Set<string>();
      return all.filter(r => {
        if (seen.has(r.wedding_id)) return false;
        seen.add(r.wedding_id);
        return true;
      });
    },
  });

  // Fetch upgrade orders
  const { data: upgrades = [] } = useQuery({
    queryKey: ['upgrade-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('upgrade_orders')
        .select('id, wedding_id, selected_package, payment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch event history for resolving couple/event details by id or by name+date match
  const { data: weddingDetails = [] } = useQuery({
    queryKey: ['wedding-details-for-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('id, wedding_id, couple_name, event_date, venue, contact_email')
        .limit(2000);
      if (error) throw error;
      return data || [];
    },
  });

  const resolveEventForWedding = (sheetWeddingId: string, sheetWedding?: any) => {
    // Match via event_notification_history.wedding_id, else fall back to couple_names + event_date
    const direct = weddingDetails.find((w: any) => w.wedding_id === sheetWeddingId);
    if (direct) return direct;
    if (sheetWedding) {
      const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9 &]+/g, '').trim();
      const target = norm(sheetWedding.couple_names || '');
      return weddingDetails.find((w: any) =>
        w.event_date === sheetWedding.wedding_date &&
        (norm(w.couple_name) === target || norm(w.couple_name).startsWith(target) || target.startsWith(norm(w.couple_name)))
      );
    }
    return undefined;
  };

  // Combine all submissions
  const allSubmissions: Submission[] = [
    ...eventNotifications,
    ...musicSheets.map((sheet: any) => {
      const wedding = resolveEventForWedding(sheet.wedding_id, sheet._wedding);
      return {
        id: sheet.id,
        wedding_id: sheet.wedding_id,
        created_at: sheet.created_at,
        type: 'music' as const,
        event_id: wedding?.id,
        wedding: wedding
          ? { couple_name: wedding.couple_name, event_date: wedding.event_date, venue: wedding.venue, contact_email: wedding.contact_email }
          : { couple_name: sheet._wedding?.couple_names || 'Unknown', event_date: sheet._wedding?.wedding_date || '', venue: '', contact_email: '' },
      };
    }),
    ...upgrades.map(upgrade => {
      const wedding = weddingDetails.find(w => w.id === upgrade.wedding_id);
      return {
        ...upgrade,
        type: 'upgrade' as const,
        event_id: upgrade.wedding_id,
        wedding: wedding || { couple_name: 'Unknown', event_date: '', venue: '', contact_email: '' },
      };
    }),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getCoupleName = (s: Submission) =>
    s.type === 'event' ? s.couple_name : s.wedding.couple_name;

  // Filter
  const filteredSubmissions = allSubmissions.filter(s => {
    const matchesType = submissionType === 'all' || s.type === submissionType ||
      (submissionType === 'upgrades' && s.type === 'upgrade');
    const name = getCoupleName(s);
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleRowClick = (submission: Submission) => {
    if (submission.type === 'event') {
      navigate(`/staff/event/${submission.id}`);
      return;
    }
    const eventId = (submission as MusicSheetSubmission | UpgradeSubmission).event_id;
    if (eventId) {
      navigate(`/staff/event/${eventId}`);
    }
  };

  const stats = {
    total: allSubmissions.length,
    events: eventNotifications.length,
    music: musicSheets.length,
    upgrades: upgrades.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Submissions</h1>
        <p className="text-muted-foreground">View all events, vibe sheets, and upgrade requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.events}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vibe Sheets</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.music}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upgrades</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.upgrades}</div></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by client name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={submissionType} onValueChange={(v) => setSubmissionType(v as SubmissionType)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Submissions</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="music">Vibe Sheets</SelectItem>
            <SelectItem value="upgrades">Upgrades</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.map(submission => (
          <Card
            key={`${submission.type}-${submission.id}`}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleRowClick(submission)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {submission.type === 'event' ? (
                      <FileText className="w-5 h-5 text-primary" />
                    ) : submission.type === 'music' ? (
                      <Music className="w-5 h-5 text-primary" />
                    ) : (
                      <Package className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{capitalizeNames(getCoupleName(submission))}</h3>
                      {submission.type === 'event' ? (
                        <>
                          <Badge>{submission.event_type || 'Event'}</Badge>
                          <Badge variant="outline">{submission.status}</Badge>
                        </>
                      ) : submission.type === 'music' ? (
                        <Badge variant="default">Vibe Sheet</Badge>
                      ) : (
                        <>
                          <Badge variant="secondary">Upgrade: {(submission as UpgradeSubmission).selected_package}</Badge>
                          <Badge variant="outline">{(submission as UpgradeSubmission).payment_status}</Badge>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {submission.type === 'event'
                            ? (submission.event_date ? format(parseLocalDate(submission.event_date), 'PPP') : 'No date')
                            : (submission as MusicSheetSubmission | UpgradeSubmission).wedding.event_date
                              ? format(parseLocalDate((submission as MusicSheetSubmission | UpgradeSubmission).wedding.event_date), 'PPP')
                              : 'No date'}
                        </span>
                      </div>
                      {(() => {
                        const venue = submission.type === 'event' ? submission.venue : (submission as MusicSheetSubmission | UpgradeSubmission).wedding.venue;
                        return venue ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{venue}</span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <div>Submitted</div>
                  <div className="font-medium">{format(new Date(submission.created_at), 'PP')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredSubmissions.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Submissions Found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery ? 'Try adjusting your search' : 'No submissions have been made yet'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
