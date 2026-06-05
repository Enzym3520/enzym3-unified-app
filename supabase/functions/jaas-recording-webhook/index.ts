import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify webhook secret token
  const webhookSecret = Deno.env.get('JAAS_WEBHOOK_SECRET');
  if (!webhookSecret) {
    console.error('JAAS_WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Service unavailable' }), {
      status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Check authorization via Bearer token only (no query param to avoid token leakage in logs)
  const authHeader = req.headers.get('Authorization');
  const providedToken = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;

  if (!providedToken || providedToken !== webhookSecret) {
    console.error('Invalid or missing webhook secret');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const payload = await req.json();
    console.log('JaaS webhook received, event type:', payload.eventType || payload.event_type || payload.type);

    // JaaS sends different event types — we only care about recording uploaded
    const eventType = payload.eventType || payload.event_type || payload.type;
    if (eventType !== 'RECORDING_UPLOADED' && eventType !== 'recording_uploaded') {
      console.log('Ignoring event type:', eventType);
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract data from JaaS webhook payload
    const recordingUrl = payload.preAuthenticatedLink || payload.data?.preAuthenticatedLink;
    const roomName = payload.roomName || payload.data?.roomName || payload.sessionId || '';
    const durationSec = payload.duration || payload.data?.duration || null;

    if (!recordingUrl) {
      console.error('No recording URL in webhook payload');
      return new Response(JSON.stringify({ error: 'No recording URL' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate recording URL to prevent SSRF attacks
    try {
      const parsedUrl = new URL(recordingUrl);
      if (parsedUrl.protocol !== 'https:') {
        console.error('Recording URL must use HTTPS:', recordingUrl);
        return new Response(JSON.stringify({ error: 'Invalid recording URL scheme' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      // Block private/internal IP ranges
      const hostname = parsedUrl.hostname;
      const blockedPatterns = [
        /^localhost$/i,
        /^127\./,
        /^10\./,
        /^192\.168\./,
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^169\.254\./,
        /^0\./,
        /^\[::1\]$/,
        /^\[fc/i,
        /^\[fd/i,
        /^\[fe80/i,
      ];
      if (blockedPatterns.some(p => p.test(hostname))) {
        console.error('Recording URL points to blocked address:', hostname);
        return new Response(JSON.stringify({ error: 'Invalid recording URL' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } catch {
      console.error('Invalid recording URL format:', recordingUrl);
      return new Response(JSON.stringify({ error: 'Invalid recording URL format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract booking ID from room name (format: vibesheet-{first8chars})
    const bookingPrefix = roomName.replace('vibesheet-', '');
    if (!bookingPrefix || bookingPrefix === roomName) {
      console.error('Cannot extract booking from room name:', roomName);
      return new Response(JSON.stringify({ error: 'Invalid room name' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the booking by ID prefix
    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, wedding_id')
      .like('id', `${bookingPrefix}%`)
      .limit(1);

    if (bookingError || !bookings?.length) {
      console.error('Booking not found for prefix:', bookingPrefix, bookingError);
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const booking = bookings[0];

    // Create initial meeting_summaries record
    const { data: summary, error: insertError } = await supabase
      .from('meeting_summaries')
      .insert({
        booking_id: booking.id,
        wedding_id: booking.wedding_id,
        recording_url: recordingUrl,
        recording_duration_sec: durationSec,
        status: 'processing',
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to create summary record:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create summary' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const summaryId = summary.id;

    // Process in background — respond to webhook immediately
    const processPromise = processRecording(supabase, summaryId, recordingUrl, booking.wedding_id);
    
    // Use waitUntil pattern — respond fast, process async
    processPromise.catch(err => console.error('Background processing failed:', err));

    return new Response(JSON.stringify({ ok: true, summaryId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('jaas-recording-webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function processRecording(
  supabase: ReturnType<typeof createClient>,
  summaryId: string,
  recordingUrl: string,
  weddingId: string
) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    await updateSummaryError(supabase, summaryId, 'LOVABLE_API_KEY not configured');
    return;
  }

  try {
    // Step 1: Download the recording
    console.log('Downloading recording...');
    let audioResponse: Response;
    try {
      audioResponse = await fetch(recordingUrl, { signal: AbortSignal.timeout(30_000) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Recording download timed out or failed: ${msg}`);
    }
    if (!audioResponse.ok) {
      throw new Error(`Failed to download recording: ${audioResponse.status}`);
    }
    const audioBlob = await audioResponse.blob();
    console.log('Recording downloaded, size:', audioBlob.size);

    // Step 2: Transcribe using Whisper via Lovable AI gateway
    console.log('Transcribing audio...');
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp4');
    formData.append('model', 'whisper-1');

    let transcriptionResponse: Response;
    try {
      transcriptionResponse = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        },
        body: formData,
        signal: AbortSignal.timeout(30_000),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Whisper transcription timed out or failed:', msg);
      transcriptionResponse = new Response(null, { status: 500 });
    }

    let transcript: string;
    if (!transcriptionResponse.ok) {
      console.warn('Whisper transcription failed, falling back to AI text extraction');
      // Fallback: tell the AI to note that transcription wasn't available
      transcript = '[Audio transcription unavailable — recording was saved but could not be transcribed automatically]';
    } else {
      const transcriptionData = await transcriptionResponse.json();
      transcript = transcriptionData.text || '';
    }

    console.log('Transcript length:', transcript.length);

    // Step 3: Generate AI summary with action items
    console.log('Generating AI summary...');
    let aiResponse: Response;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You are a professional meeting summarizer for a DJ/entertainment company. You summarize client planning meetings.

Your output must be structured as follows:
1. A clear, professional meeting recap (2-4 paragraphs)
2. Key decisions made during the meeting
3. Action items with the responsible party (DJ or Client)

Be concise, professional, and focus on actionable information. Use the client's names when possible.`
          },
          {
            role: 'user',
            content: `Please summarize this meeting transcript and extract action items:\n\n${transcript}`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_meeting_summary',
              description: 'Create a structured meeting summary with action items',
              parameters: {
                type: 'object',
                properties: {
                  summary: {
                    type: 'string',
                    description: 'Professional meeting recap in markdown format (2-4 paragraphs)'
                  },
                  action_items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        task: { type: 'string', description: 'What needs to be done' },
                        responsible: { type: 'string', enum: ['DJ', 'Client', 'Both'], description: 'Who is responsible' },
                        deadline: { type: 'string', description: 'When it should be done (if mentioned)' },
                        priority: { type: 'string', enum: ['high', 'medium', 'low'] }
                      },
                      required: ['task', 'responsible', 'priority'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['summary', 'action_items'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_meeting_summary' } },
      }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`AI summary timed out or failed: ${msg}`);
    }

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI summary failed: ${aiResponse.status} ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let aiSummary = '';
    let actionItems: unknown[] = [];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      aiSummary = parsed.summary || '';
      actionItems = parsed.action_items || [];
    } else {
      // Fallback to plain text
      aiSummary = aiData.choices?.[0]?.message?.content || 'Summary generation failed';
    }

    // Step 4: Update the summary record
    const { error: updateError } = await supabase
      .from('meeting_summaries')
      .update({
        raw_transcript: transcript,
        ai_summary: aiSummary,
        action_items: actionItems,
        status: 'completed',
      })
      .eq('id', summaryId);

    if (updateError) {
      console.error('Failed to update summary:', updateError);
      return;
    }

    console.log('Summary completed successfully');

    // Step 5: Send email notification
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      await fetch(`${supabaseUrl}/functions/v1/send-meeting-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ summaryId }),
      });
    } catch (emailErr) {
      console.error('Failed to trigger email:', emailErr);
      // Don't fail the whole process if email fails
    }

  } catch (error) {
    console.error('Processing error:', error);
    await updateSummaryError(supabase, summaryId, error instanceof Error ? error.message : 'Unknown error');
  }
}

async function updateSummaryError(
  supabase: ReturnType<typeof createClient>,
  summaryId: string,
  errorMessage: string
) {
  await supabase
    .from('meeting_summaries')
    .update({ status: 'failed', error_message: errorMessage })
    .eq('id', summaryId);
}
