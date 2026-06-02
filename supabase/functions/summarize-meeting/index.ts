import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { bookingId, transcript, durationSeconds } = await req.json();

    if (!bookingId || !transcript) {
      return new Response(JSON.stringify({ error: "bookingId and transcript are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use Lovable AI (LOVABLE_API_KEY) for summarization
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let aiSummary = "";
    let actionItems: { text: string; done: boolean }[] = [];

    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": lovableApiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            messages: [
              {
                role: "user",
                content: `You are a professional meeting notes assistant for an event coordination company. Summarize this meeting transcript into:
1. A brief summary (2-3 sentences)
2. Key decisions made
3. Action items (as a JSON array of objects with "text" and "done": false)

Format your response as JSON:
{"summary": "...", "decisions": ["..."], "action_items": [{"text": "...", "done": false}]}

Transcript:
${transcript.substring(0, 8000)}`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.content?.[0]?.text || "";
          // Extract JSON from the response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            aiSummary = parsed.summary || "";
            if (parsed.decisions?.length) {
              aiSummary += "\n\n**Decisions:**\n" + parsed.decisions.map((d: string) => `• ${d}`).join("\n");
            }
            actionItems = parsed.action_items || [];
          } else {
            aiSummary = content;
          }
        } else {
          console.error("[summarize-meeting] AI call failed:", aiResponse.status);
          aiSummary = "AI summary unavailable. Review the raw transcript.";
        }
      } catch (aiErr) {
        console.error("[summarize-meeting] AI error:", aiErr instanceof Error ? aiErr.message : aiErr);
        aiSummary = "AI summary unavailable. Review the raw transcript.";
      }
    } else {
      aiSummary = "AI summary unavailable (no API key configured).";
    }

    // Save to DB using service role (bypasses RLS for insert)
    const { data: transcription, error: insertError } = await supabaseAdmin
      .from("meeting_transcriptions")
      .insert({
        booking_id: bookingId,
        recorded_by: user.id,
        raw_transcript: transcript,
        ai_summary: aiSummary,
        action_items: actionItems,
        duration_seconds: durationSeconds || null,
      })
      .select("id, ai_summary, action_items")
      .single();

    if (insertError) {
      console.error("[summarize-meeting] Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to save transcription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(transcription), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[summarize-meeting] Unexpected error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
