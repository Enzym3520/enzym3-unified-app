import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Music, CheckCircle2, XCircle, ArrowRight, Radio,
  StopCircle, Copy, ChevronLeft, Loader2, ThumbsUp, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface LiveSession {
  id: string;
  event_id: string;
  vendor_id: string;
  short_code: string;
  status: 'draft' | 'live' | 'ended';
  pause_requests: boolean;
  allow_upvotes: boolean;
  per_guest_limit: number;
  event_name: string | null;
  dj_name: string | null;
  started_at: string | null;
}

interface SongRequest {
  id: string;
  song_title: string;
  artist_name: string | null;
  album_art_url: string | null;
  youtube_url: string | null;
  spotify_uri: string | null;
  status: 'pending' | 'queued' | 'played' | 'declined';
  upvote_count: number;
  dj_notes: string | null;
  requested_at: string;
  guest_token: string;
}

function getGuestUrl(shortCode: string): string {
  return `${window.location.origin}/live/${shortCode}`;
}

export default function LiveConsolePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);

  // Load or create session for this event
  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existing } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('event_id', eventId)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        setSession(existing as LiveSession);
      } else {
        // Create a new draft session with a unique short code
        const shortCode = generateShortCode();
        const { data: { session: authSession } } = await supabase.auth.getSession();

        // Get event name + dj name
        const { data: event } = await supabase
          .from('event_notification_history')
          .select('couple_name, coordinator_name')
          .eq('id', eventId)
          .maybeSingle();

        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, company_name')
          .eq('id', user.id)
          .maybeSingle();

        const djName = (profile as any)?.company_name || `${(profile as any)?.first_name || ''} ${(profile as any)?.last_name || ''}`.trim() || null;

        const { data: newSession, error } = await supabase
          .from('live_sessions')
          .insert({
            event_id: eventId,
            vendor_id: user.id,
            short_code: shortCode,
            status: 'draft',
            event_name: (event as any)?.couple_name || 'Event',
            dj_name: djName,
          })
          .select()
          .single();

        if (!error && newSession) setSession(newSession as LiveSession);
      }
      setLoading(false);
    };
    load();
  }, [eventId]);

  // Load requests + realtime
  useEffect(() => {
    if (!session) return;

    const loadRequests = async () => {
      const { data } = await supabase
        .from('song_requests')
        .select('*')
        .eq('session_id', session.id)
        .order('upvote_count', { ascending: false })
        .order('requested_at', { ascending: true });
      if (data) setRequests(data as SongRequest[]);
    };
    loadRequests();

    const channel = supabase
      .channel(`console:${session.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'song_requests',
        filter: `session_id=eq.${session.id}`,
      }, () => loadRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id]);

  const goLive = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('live_sessions')
      .update({ status: 'live', started_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single();
    if (!error && data) setSession(data as LiveSession);
  };

  const endSession = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('live_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', session.id)
      .select()
      .single();
    if (!error && data) setSession(data as LiveSession);
  };

  const togglePause = async () => {
    if (!session) return;
    const { data, error } = await supabase
      .from('live_sessions')
      .update({ pause_requests: !session.pause_requests })
      .eq('id', session.id)
      .select()
      .single();
    if (!error && data) setSession(data as LiveSession);
  };

  const updateRequest = async (id: string, status: SongRequest['status']) => {
    setActioning(id);
    await supabase
      .from('song_requests')
      .update({ status, actioned_at: new Date().toISOString() })
      .eq('id', id);
    setActioning(null);
  };

  const copyLink = () => {
    if (!session) return;
    navigator.clipboard.writeText(getGuestUrl(session.short_code));
    toast({ title: 'Link copied!' });
  };

  const pending = requests.filter(r => r.status === 'pending');
  const queued = requests.filter(r => r.status === 'queued');
  const played = requests.filter(r => r.status === 'played');

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white/30" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white flex-shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {session?.status === 'live' && (
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  LIVE
                </span>
              )}
              <p className="font-semibold truncate">{session?.event_name || 'Live Console'}</p>
            </div>
            {session && (
              <p className="text-xs text-white/40">
                Code: <span className="font-mono">{session.short_code}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {session?.status === 'draft' && (
            <Button size="sm" onClick={goLive} className="bg-green-500 hover:bg-green-400 text-black font-semibold gap-1.5">
              <Radio className="h-4 w-4" /> Go Live
            </Button>
          )}
          {session?.status === 'live' && (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  id="pause"
                  checked={session.pause_requests}
                  onCheckedChange={togglePause}
                />
                <Label htmlFor="pause" className="text-xs text-white/50 cursor-pointer">
                  {session.pause_requests ? 'Paused' : 'Accepting'}
                </Label>
              </div>
              <Button size="sm" variant="outline" onClick={endSession} className="border-red-500/50 text-red-400 hover:bg-red-500/10 gap-1.5">
                <StopCircle className="h-4 w-4" /> End
              </Button>
            </>
          )}
          {session?.status === 'ended' && (
            <Badge variant="outline" className="text-white/50 border-white/20">Session ended</Badge>
          )}
        </div>
      </div>

      {/* Share bar */}
      {session && (
        <div className="px-4 py-2 border-b border-white/10 bg-white/5 flex items-center gap-3">
          <p className="text-xs text-white/40 truncate flex-1 font-mono">{getGuestUrl(session.short_code)}</p>
          <button onClick={copyLink} className="text-white/40 hover:text-white flex-shrink-0">
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Draft state */}
      {session?.status === 'draft' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
          <div className="rounded-full bg-white/5 p-8 border border-white/10">
            <Music className="h-16 w-16 text-white/30" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">Ready to go live?</h2>
            <p className="text-white/40 text-sm max-w-xs">
              Share the link with your guests, then hit Go Live when the party starts.
              Guests who scan early see a holding page until you go live.
            </p>
          </div>
          <div className="bg-white/5 rounded-lg border border-white/10 p-4 text-center space-y-2 w-full max-w-xs">
            <p className="text-xs text-white/40 uppercase tracking-wider">Guest Link</p>
            <p className="font-mono text-sm break-all">{getGuestUrl(session.short_code)}</p>
            <p className="text-2xl font-bold font-mono tracking-widest">{session.short_code}</p>
            <Button size="sm" variant="outline" onClick={copyLink} className="border-white/20 text-white/60 gap-2">
              <Copy className="h-3.5 w-3.5" /> Copy Link
            </Button>
          </div>
        </div>
      )}

      {/* Live console — 3 columns */}
      {(session?.status === 'live' || session?.status === 'ended') && (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
          {/* Pending */}
          <Column
            title="Pending"
            count={pending.length}
            color="text-amber-400"
            empty="No requests yet"
          >
            {pending.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                actioning={actioning === req.id}
                actions={[
                  { label: 'Queue', icon: <ArrowRight className="h-4 w-4" />, color: 'hover:bg-blue-500/20 hover:text-blue-400', onClick: () => updateRequest(req.id, 'queued') },
                  { label: 'Decline', icon: <XCircle className="h-4 w-4" />, color: 'hover:bg-red-500/20 hover:text-red-400', onClick: () => updateRequest(req.id, 'declined') },
                ]}
              />
            ))}
          </Column>

          {/* Queued */}
          <Column
            title="Queued"
            count={queued.length}
            color="text-blue-400"
            empty="Nothing queued"
          >
            {queued.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                actioning={actioning === req.id}
                actions={[
                  { label: 'Played', icon: <CheckCircle2 className="h-4 w-4" />, color: 'hover:bg-green-500/20 hover:text-green-400', onClick: () => updateRequest(req.id, 'played') },
                  { label: 'Remove', icon: <XCircle className="h-4 w-4" />, color: 'hover:bg-red-500/20 hover:text-red-400', onClick: () => updateRequest(req.id, 'declined') },
                ]}
              />
            ))}
          </Column>

          {/* Played */}
          <Column
            title="Played"
            count={played.length}
            color="text-green-400"
            empty="Nothing played yet"
          >
            {played.map(req => (
              <RequestCard key={req.id} req={req} actioning={false} actions={[]} dim />
            ))}
          </Column>
        </div>
      )}
    </div>
  );
}

function Column({ title, count, color, empty, children }: {
  title: string; count: number; color: string; empty: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <span className={`text-sm font-semibold ${color}`}>{title}</span>
        {count > 0 && <Badge variant="outline" className="text-xs border-white/20 text-white/50">{count}</Badge>}
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {count === 0 ? (
          <p className="text-xs text-white/25 text-center py-8">{empty}</p>
        ) : children}
      </div>
    </div>
  );
}

function RequestCard({ req, actioning, actions, dim }: {
  req: SongRequest;
  actioning: boolean;
  actions: { label: string; icon: React.ReactNode; color: string; onClick: () => void }[];
  dim?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-white/10 p-3 space-y-2 ${dim ? 'opacity-40' : 'bg-white/5'}`}>
      <div className="flex items-start gap-3">
        {req.album_art_url && (
          <img src={req.album_art_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{req.song_title}</p>
          {req.artist_name && <p className="text-xs text-white/50 truncate">{req.artist_name}</p>}
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-white/25">{format(new Date(req.requested_at), 'h:mm a')}</p>
            {req.upvote_count > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-white/40">
                <ThumbsUp className="h-3 w-3" />{req.upvote_count}
              </span>
            )}
            {req.youtube_url && <ExternalLink className="h-3 w-3 text-red-400" />}
          </div>
        </div>
      </div>
      {actions.length > 0 && (
        <div className="flex gap-1 pt-1">
          {actions.map(action => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={actioning}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded text-white/40 transition-colors ${action.color} disabled:opacity-50`}
            >
              {actioning ? <Loader2 className="h-3 w-3 animate-spin" /> : action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    if (i === 3) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
