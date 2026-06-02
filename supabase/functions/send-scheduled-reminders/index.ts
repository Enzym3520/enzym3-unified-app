import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { safeLogger } from "../_shared/validators.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting for cron endpoint
const CRON_RATE_LIMIT_MS = 60 * 1000; // 1 minute between calls
let lastCronExecution = 0;

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID().substring(0, 8);
  const requestTimestamp = Date.now();

  try {
    // Verify cron secret for security
    const CRON_SECRET = Deno.env.get('CRON_SECRET');
    const providedSecret = req.headers.get('x-cron-secret');
    const providedTimestamp = req.headers.get('x-cron-timestamp');

    // Security: Validate secret exists and matches
    if (!CRON_SECRET || providedSecret !== CRON_SECRET) {
      safeLogger.warn('CRON_UNAUTHORIZED_ACCESS', { 
        requestId,
        hasSecret: !!providedSecret,
        secretMatch: false
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security: Validate timestamp to prevent replay attacks (5 minute window)
    if (providedTimestamp) {
      const requestTime = parseInt(providedTimestamp, 10);
      const timeDiff = Math.abs(requestTimestamp - requestTime);
      if (isNaN(requestTime) || timeDiff > 5 * 60 * 1000) {
        safeLogger.warn('CRON_REPLAY_ATTACK_DETECTED', { 
          requestId,
          timeDiffMs: timeDiff,
          maxAllowedMs: 5 * 60 * 1000
        });
        return new Response(
          JSON.stringify({ error: 'Request timestamp expired or invalid' }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Security: Rate limiting - prevent brute force attempts
    const timeSinceLastExecution = requestTimestamp - lastCronExecution;
    if (timeSinceLastExecution < CRON_RATE_LIMIT_MS) {
      safeLogger.warn('CRON_RATE_LIMITED', { 
        requestId,
        timeSinceLastMs: timeSinceLastExecution,
        limitMs: CRON_RATE_LIMIT_MS
      });
      return new Response(
        JSON.stringify({ error: 'Rate limited. Try again later.' }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    lastCronExecution = requestTimestamp;

    // Audit log: Successful authentication
    safeLogger.info('CRON_INVOCATION_START', { 
      requestId,
      timestamp: new Date(requestTimestamp).toISOString()
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    safeLogger.info("Checking for scheduled reminders to send", { requestId });

    // Get all pending reminders scheduled for today or earlier
    const today = new Date().toISOString().split('T')[0];
    const { data: reminders, error: fetchError } = await supabase
      .from('reminders')
      .select('id, scheduled_date, reminder_type, status')
      .eq('status', 'pending')
      .lte('scheduled_date', today)
      .order('scheduled_date', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    safeLogger.info(`Found reminders to process`, { 
      requestId,
      count: reminders?.length || 0 
    });

    const results = [];
    
    for (const reminder of reminders || []) {
      try {
        // Call the send-reminder-email function
        const emailResult = await supabase.functions.invoke('send-reminder-email', {
          body: { reminderId: reminder.id }
        });

        // Call the send-push-notification function
        const pushResult = await supabase.functions.invoke('send-push-notification', {
          body: { reminderId: reminder.id }
        });

        if (emailResult.error && pushResult.error) {
          safeLogger.error(`Failed to send reminder`, emailResult.error, { 
            requestId,
            reminderId: reminder.id 
          });
          results.push({ 
            id: reminder.id, 
            status: 'failed', 
            error: emailResult.error.message 
          });
        } else {
          safeLogger.info(`Successfully sent reminder`, { 
            requestId,
            reminderId: reminder.id 
          });
          results.push({ 
            id: reminder.id, 
            status: 'sent',
            email: emailResult.error ? 'failed' : 'sent',
            push: pushResult.error ? 'failed' : 'sent'
          });
        }
      } catch (error: any) {
        safeLogger.error(`Error processing reminder`, error, { 
          requestId,
          reminderId: reminder.id 
        });
        results.push({ 
          id: reminder.id, 
          status: 'failed', 
          error: error.message 
        });
      }
    }

    // Audit log: Successful completion
    safeLogger.info('CRON_INVOCATION_COMPLETE', { 
      requestId,
      processed: results.length,
      succeeded: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      durationMs: Date.now() - requestTimestamp
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        results 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    safeLogger.error("Error in send-scheduled-reminders function", error, { requestId });
    return new Response(
      JSON.stringify({ error: 'An error occurred processing scheduled reminders' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
