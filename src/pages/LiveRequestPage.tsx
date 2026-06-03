import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Music, ThumbsUp, Search, Send, Clock, CheckCircle2, XCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface LiveSession {
  id: string;
  short_code: string;
  status: 'draft' | 'live' | 'ended';
  pause_requests: boolean;
  allow_upvotes: boolean;
  per_guest_limit: number;
  event_name: string | null;
  dj_name: string | null;
}

interface SongRequest {
  id: string;
  song_title: string;
  artist_name: string | null;
  album_art_url: string | null;
  status: 'pending' | 'queued' | 'played' | 'declined';
  upvote_count: number;
  requested_at: string;
  guest_token: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  spotifyUri: string;
}

function getGuestToken(sessionId: string): string {
  const key = `guest_token_${sessionId}`;
  let token = localStorage.getItem(key);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(key, token);
  }
  return token;
}

function getUpvotedRequests(sessionId: string): Set<string> {
  const key = `upvoted_${sessionId}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveUpvote(sessionId: string, requestId: string) {
  const key = `upvoted_${sessionId}`;
  const existing = getUpvotedRequests(sessionId);
  existing.add(requestId);
  localStorage.setItem(key, JSON.stringify([...existing]));
}

export default function LiveRequestPage() {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();

  const [session, setSession] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [query, setQuery] = useState('');
  const [searchResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [showManual, setShowManual] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session
  useEffect(() => {
    if (!code) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('short_code', code.toUpperCase())
        .single();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setSession(data as LiveSession);
      setUpvoted(getUpvotedRequests(data.id));
      setLoading(false);
    };
    load();
  }, [code]);

  // Load requests + realtime subscription
  useEffect(() => {
    if (!session || session.status === 'draft') return;

    const loadRequests = async () => {
      const { data } = await supabase
        .from('song_requests')
        .select('*')
        .eq('session_id', session.id)
        .in('status', ['pending', 'queued', 'played'])
        .order('upvote_count', { ascending: false })
        .order('requested_at', { ascending: true });
      if (data) setRequests(data as SongRequest[]);
    };
    loadRequests();

    const channel = supabase
      .channel(`requests:${session.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'song_requests',
        filter: `session_id=eq.${session.id}`,
      }, () => loadRequests())
      .subscribe();

    // Also subscribe to session status changes
    const sessionChannel = supabase
      .channel(`session:${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_sessions',
        filter: `id=eq.${session.id}`,
      }, (payload) => {
        setSession(prev => prev ? { ...prev, ...payload.new } : prev);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(sessionChannel);
    };
  }, [session?.id, session?.status]);

  // Spotify search with debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) { setSpotifyResults([]); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase.functions.invoke('spotify-search', {
          body: { query },
        });
        if (!error && data?.tracks) setSpotifyResults(data.tracks);
      } catch {
        // fallback to manual entry
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [query]);

  const handleSelectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setQuery('');
    setSpotifyResults([]);
    setShowManual(false);
  };

  const handleSubmit = async () => {
    if (!session) return;
    const guestToken = getGuestToken(session.id);
    const isSpotify = !!selectedTrack;
    const isYoutube = !isSpotify && youtubeUrl.trim();
    const isManual = !isSpotify && !isYoutube && manualTitle.trim();

    if (!isSpotify && !isYoutube && !isManual) {
      toast({ title: 'Pick a song first', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('song_requests').insert({
        session_id: session.id,
        song_title: isSpotify ? selectedTrack!.name : manualTitle.trim(),
        artist_name: isSpotify ? selectedTrack!.artist : manualArtist.trim() || null,
        spotify_uri: selectedTrack?.spotifyUri || null,
        spotify_track_id: selectedTrack?.id || null,
        album_art_url: selectedTrack?.albumArt || null,
        youtube_url: isYoutube ? youtubeUrl.trim() : null,
        guest_token: guestToken,
        status: 'pending',
      });
      if (error) throw error;
      setSubmitted(true);
      setSelectedTrack(null);
      setYoutubeUrl('');
      setManualTitle('');
      setManualArtist('');
      setShowManual(false);
      setTimeout(() => setSubmitted(false), 3000);
    } catch {
      toast({ title: 'Failed to submit request', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (req: SongRequest) => {
    if (!session || upvoted.has(req.id)) return;
    const guestToken = getGuestToken(session.id);
    const { error: upvoteError } = await supabase
      .from('request_upvotes')
      .insert({ request_id: req.id, guest_token: guestToken });
    if (upvoteError) return; // already upvoted or error — don't increment
    await supabase.rpc('increment_song_upvote', { p_request_id: req.id });
    saveUpvote(session.id, req.id);
    setUpvoted(prev => new Set([...prev, req.id]));
  };

  const statusLabel = (s: SongRequest['status']) => {
    if (s === 'queued') return <Badge className="bg-blue-500 text-white text-xs">Queued</Badge>;
    if (s === 'played') return <Badge className="bg-green-600 text-white text-xs">Played</Badge>;
    return null;
  };

  // --- Holding page ---
  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-white/50" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-3 p-6">
      <Music className="h-12 w-12 text-white/30" />
      <h1 className="text-xl font-bold">Session not found</h1>
      <p className="text-white/50 text-sm text-center">Double-check the link or short code and try again.</p>
    </div>
  );

  if (session?.status === 'draft') return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-6 p-6">
      <div className="rounded-full bg-white/10 p-6">
        <Music className="h-12 w-12 text-white" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{session.event_name || 'Event'}</h1>
        {session.dj_name && <p className="text-white/60">DJ {session.dj_name}</p>}
        <p className="text-white/40 text-sm mt-4">Song requests aren't open yet.<br />Check back when the party starts!</p>
      </div>
      <div className="flex gap-1 mt-2">
        {[0,1,2].map(i => (
          <div key={i} className="h-2 w-2 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );

  if (session?.status === 'ended') return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4 p-6">
      <CheckCircle2 className="h-12 w-12 text-green-400" />
      <h1 className="text-2xl font-bold">That's a wrap!</h1>
      {session.dj_name && <p className="text-white/50">Thanks for partying with DJ {session.dj_name}</p>}
    </div>
  );

  const myToken = session ? getGuestToken(session.id) : '';
  const myRequests = requests.filter(r => r.guest_token === myToken && r.status !== 'declined');
  const canRequest = !session?.pause_requests;
  const visibleRequests = requests.filter(r => r.status !== 'declined');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium uppercase tracking-wider">Live</span>
        </div>
        <h1 className="text-2xl font-bold">{session?.event_name || 'Song Requests'}</h1>
        {session?.dj_name && <p className="text-white/50 text-sm">DJ {session.dj_name}</p>}
      </div>

      <div className="flex-1 px-4 pb-8 space-y-6 overflow-y-auto">
        {/* Request form */}
        {canRequest ? (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
            <p className="text-sm font-medium text-white/70">Request a song</p>

            {selectedTrack ? (
              <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3">
                {selectedTrack.albumArt && (
                  <img src={selectedTrack.albumArt} alt="" className="h-12 w-12 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{selectedTrack.name}</p>
                  <p className="text-sm text-white/50 truncate">{selectedTrack.artist}</p>
                </div>
                <button onClick={() => setSelectedTrack(null)} className="text-white/40 hover:text-white">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ) : showManual ? (
              <div className="space-y-2">
                <Input
                  placeholder="Song title *"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
                <Input
                  placeholder="Artist name"
                  value={manualArtist}
                  onChange={e => setManualArtist(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                />
                <button onClick={() => setShowManual(false)} className="text-xs text-white/40 hover:text-white">
                  ← Back to search
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    placeholder="Search Spotify..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 pl-9"
                  />
                  {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 animate-spin" />}
                </div>

                {/* Spotify results */}
                {searchResults.length > 0 && (
                  <div className="rounded-lg border border-white/10 overflow-hidden divide-y divide-white/10 max-h-56 overflow-y-auto">
                    {searchResults.map(track => (
                      <button
                        key={track.id}
                        onClick={() => handleSelectTrack(track)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                      >
                        {track.albumArt && <img src={track.albumArt} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{track.name}</p>
                          <p className="text-xs text-white/50 truncate">{track.artist}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* YouTube fallback */}
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <Input
                    placeholder="Or paste a YouTube link"
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/30 text-sm"
                  />
                </div>

                <button onClick={() => setShowManual(true)} className="text-xs text-white/40 hover:text-white">
                  Type it in manually →
                </button>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={submitting || submitted || (!selectedTrack && !youtubeUrl.trim() && !manualTitle.trim())}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-semibold"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : submitted ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {submitted ? 'Requested!' : 'Request Song'}
            </Button>

            {myRequests.length > 0 && (
              <p className="text-xs text-white/30 text-center">{myRequests.length} request{myRequests.length !== 1 ? 's' : ''} from you</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl bg-white/5 border border-white/10 p-6 text-center space-y-2">
            <Clock className="h-8 w-8 text-white/30 mx-auto" />
            <p className="text-white/60 text-sm">Requests are paused — check back soon</p>
          </div>
        )}

        {/* Live queue */}
        {visibleRequests.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Queue · {visibleRequests.length} songs</p>
            <div className="space-y-2">
              {visibleRequests.map(req => (
                <div key={req.id} className={`flex items-center gap-3 rounded-lg p-3 ${req.status === 'played' ? 'opacity-40' : 'bg-white/5 border border-white/10'}`}>
                  {req.album_art_url && (
                    <img src={req.album_art_url} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.song_title}</p>
                    {req.artist_name && <p className="text-xs text-white/50 truncate">{req.artist_name}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusLabel(req.status)}
                    {session?.allow_upvotes && req.status === 'pending' && (
                      <button
                        onClick={() => handleUpvote(req)}
                        disabled={upvoted.has(req.id) || req.guest_token === myToken}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${
                          upvoted.has(req.id) ? 'text-green-400' : 'text-white/40 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {req.upvote_count > 0 && req.upvote_count}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
