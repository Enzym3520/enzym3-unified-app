import { useState, useCallback, useRef } from 'react';
import { useScribe } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Mic, MicOff, Loader2, FileText, CheckCircle, ChevronDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMeetingTranscription, type MeetingTranscription } from '@/hooks/useMeetingTranscription';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MeetingTranscriberProps {
  bookingId: string;
  coupleName?: string;
  onClose?: () => void;
}

export function MeetingTranscriber({ bookingId, coupleName, onClose }: MeetingTranscriberProps) {
  const { data: existingTranscription, summarizeMutation } = useMeetingTranscription(bookingId);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<MeetingTranscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const [showRawTranscript, setShowRawTranscript] = useState(false);

  const scribe = useScribe({
    modelId: 'scribe_v2_realtime' as any,
    commitStrategy: 'vad' as any,
    onCommittedTranscript: () => {
      // Transcripts auto-added to committedTranscripts
    },
  });

  const handleStart = useCallback(async () => {
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-scribe-token');
      if (fnError || !data?.token) {
        throw new Error(fnError?.message || 'Failed to get transcription token');
      }

      startTimeRef.current = Date.now();
      await scribe.connect({
        token: data.token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start transcription';
      setError(msg);
      toast.error(msg);
    }
  }, [scribe]);

  const handleStop = useCallback(async () => {
    scribe.disconnect();
    const durationSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    const fullTranscript = scribe.committedTranscripts.map((t) => t.text).join(' ');
    if (!fullTranscript.trim()) {
      toast.info('No speech was detected');
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await summarizeMutation.mutateAsync({
        transcript: fullTranscript,
        durationSeconds,
      });
      setSummary(result);
      toast.success('Transcription saved & summarized');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to summarize');
    } finally {
      setIsSummarizing(false);
    }
  }, [scribe, summarizeMutation]);

  // If there's already a transcription, show it
  const displayData = summary || existingTranscription;

  if (displayData) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Meeting Notes {coupleName ? `— ${coupleName}` : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayData.ai_summary && (
            <div className="text-sm whitespace-pre-wrap">{displayData.ai_summary}</div>
          )}

          {displayData.action_items && (displayData.action_items as any[]).length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action Items</p>
              {(displayData.action_items as { text: string; done: boolean }[]).map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          )}

          <Collapsible open={showRawTranscript} onOpenChange={setShowRawTranscript}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between px-0 h-auto py-1">
                <span className="text-xs text-muted-foreground">Full Transcript</span>
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform text-muted-foreground', showRawTranscript && 'rotate-180')} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-40 rounded-md border p-3">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{displayData.raw_transcript}</p>
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>

          {displayData.duration_seconds && (
            <p className="text-xs text-muted-foreground">
              Duration: {Math.floor(displayData.duration_seconds / 60)}m {displayData.duration_seconds % 60}s
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          Live Transcription {coupleName ? `— ${coupleName}` : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Live transcript display */}
        {scribe.isConnected && (
          <ScrollArea className="h-32 rounded-md border bg-muted/50 p-3">
            <div className="text-sm space-y-1">
              {scribe.committedTranscripts.map((t) => (
                <p key={t.id}>{t.text}</p>
              ))}
              {scribe.partialTranscript && (
                <p className="text-muted-foreground italic">{scribe.partialTranscript}</p>
              )}
              {scribe.committedTranscripts.length === 0 && !scribe.partialTranscript && (
                <p className="text-muted-foreground italic">Listening...</p>
              )}
            </div>
          </ScrollArea>
        )}

        {isSummarizing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating AI summary...
          </div>
        )}

        <div className="flex gap-2">
          {!scribe.isConnected ? (
            <Button size="sm" onClick={handleStart} disabled={isSummarizing}>
              <Mic className="h-3.5 w-3.5 mr-1" />
              Start Recording
            </Button>
          ) : (
            <Button size="sm" variant="destructive" onClick={handleStop}>
              <MicOff className="h-3.5 w-3.5 mr-1" />
              Stop & Summarize
            </Button>
          )}
          {scribe.isConnected && (
            <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200 animate-pulse">
              Recording
            </Badge>
          )}
          {onClose && !scribe.isConnected && !isSummarizing && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
