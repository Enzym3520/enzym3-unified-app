import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { ReminderEmail } from '../_shared/email-templates.tsx';
import { htmlToPlainText } from '../_shared/htmlToText.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderEmailRequest {
  reminderId: string;
  sendNow?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }), 
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify the JWT token
    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('[REMINDER-EMAIL] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }), 
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Verify admin role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .limit(1)
      .maybeSingle();

    if (!userRoles) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { reminderId, sendNow = false }: ReminderEmailRequest = await req.json();

    console.log(`[REMINDER-EMAIL] Processing reminder ${reminderId}, sendNow: ${sendNow}`);

    // Fetch the reminder
    const { data: reminder, error: fetchError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (fetchError || !reminder) {
      console.error('[REMINDER-EMAIL] Reminder fetch error:', fetchError);
      throw new Error('Unable to process reminder');
    }

    // Check if reminder should be sent
    if (!sendNow) {
      const scheduledDate = new Date(reminder.scheduled_date);
      const now = new Date();
      
      // Only send if scheduled date is today or past
      if (scheduledDate > now) {
        return new Response(
          JSON.stringify({ message: "Reminder not yet scheduled for delivery" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Skip if already sent
    if (reminder.status === 'sent' || reminder.status === 'completed') {
      return new Response(
        JSON.stringify({ message: "Reminder already sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the message to send
    const messageContent = reminder.generated_message || reminder.message_template || 
      `Hi ${reminder.contact_name},\n\nThis is a reminder regarding your upcoming event.\n\nBest regards,\nEnzym3 Entertainment`;

    // Render the React Email template
    const html = await renderAsync(
      React.createElement(ReminderEmail, {
        contactName: reminder.contact_name,
        messageContent,
        eventDate: reminder.event_context?.event_date,
        venue: reminder.event_context?.venue,
        notes: reminder.notes,
        reminderType: reminder.reminder_type,
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3.com>",
      to: [reminder.contact_email],
      subject: `Reminder: ${reminder.reminder_type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`,
      html,
      text: htmlToPlainText(html),
    });

    console.log("[REMINDER-EMAIL] Email sent successfully:", emailResponse);

    // Update reminder status
    const { error: updateError } = await supabase
      .from('reminders')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', reminderId);

    if (updateError) {
      console.error("[REMINDER-EMAIL] Error updating reminder status:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResponse.data?.id,
        message: "Reminder email sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[REMINDER-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
