import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AssignmentRequest {
  eventId: string;
  djUserId: string;
  assignmentNotes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const { eventId, djUserId, assignmentNotes }: AssignmentRequest = await req.json();

    console.log(`Processing assignment for event ${eventId} to vendor ${djUserId}`);

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("event_notification_history")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError) throw new Error(`Event fetch error: ${eventError.message}`);

    // Fetch vendor details
    const { data: vendor, error: vendorError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", djUserId)
      .single();

    if (vendorError) throw new Error(`Vendor fetch error: ${vendorError.message}`);

    // Format event date
    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Use client_name if available, fallback to couple_name
    const clientName = event.client_name || event.couple_name;

    // Get primary contact info
    const primaryContactName = event.primary_contact_name || clientName;
    const primaryContactPhone = event.primary_contact_phone || event.contact_phone;
    const primaryContactEmail = event.primary_contact_email || event.contact_email;

    // Get secondary contact info (if available)
    const secondaryContactName = event.secondary_contact_name;
    const secondaryContactPhone = event.secondary_contact_phone;
    const secondaryContactEmail = event.secondary_contact_email || event.groom_email;

    // Vendor portal URL
    const vendorPortalUrl = "https://vendor.enzym3entertainment.vip";

    // Send email notification with new branding
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #DBD4C3 0%, #C8BFA8 100%); color: #333; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0 0; opacity: 0.8; font-size: 14px; }
            .content { background: #ffffff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .greeting { font-size: 18px; margin-bottom: 20px; }
            .event-card { background: #fafafa; padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #eee; }
            .event-card h2 { margin-top: 0; color: #333; font-size: 20px; border-bottom: 2px solid #85D4FA; padding-bottom: 10px; }
            .detail-row { display: flex; margin: 14px 0; align-items: flex-start; }
            .detail-label { font-weight: 600; width: 140px; color: #666; flex-shrink: 0; }
            .detail-value { flex: 1; color: #333; }
            .contact-card { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #85D4FA; }
            .contact-card h3 { margin: 0 0 15px 0; color: #0369a1; font-size: 16px; }
            .contact-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .contact-section h4 { margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600; }
            .contact-section p { margin: 4px 0; font-size: 14px; color: #555; }
            .button { display: inline-block; background: linear-gradient(135deg, #85D4FA 0%, #60C5F7 100%); color: #0c4a6e; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 10px 5px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(133, 212, 250, 0.3); }
            .button:hover { background: linear-gradient(135deg, #60C5F7 0%, #38BDF8 100%); }
            .notes-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
            .notes-box strong { color: #92400e; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 New Event Assignment</h1>
              <p>Enzym3 Entertainment</p>
            </div>
            <div class="content">
              <p class="greeting">Hi ${vendor.first_name},</p>
              <p>Great news! You've been assigned to a new event. Here are all the details you need:</p>

              <div class="event-card">
                <h2>📅 Event Details</h2>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value"><strong>${formattedDate}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Client:</span>
                  <span class="detail-value">${clientName}</span>
                </div>
                ${event.venue ? `
                <div class="detail-row">
                  <span class="detail-label">Venue:</span>
                  <span class="detail-value">${event.venue}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Event Type:</span>
                  <span class="detail-value" style="text-transform: capitalize;">${event.event_type}</span>
                </div>
                ${event.guest_count ? `
                <div class="detail-row">
                  <span class="detail-label">Expected Guests:</span>
                  <span class="detail-value">${event.guest_count}</span>
                </div>
                ` : ''}
                ${event.package_type ? `
                <div class="detail-row">
                  <span class="detail-label">Package:</span>
                  <span class="detail-value">${event.package_type}</span>
                </div>
                ` : ''}
              </div>

              <div class="contact-card">
                <h3>📞 Contact Information</h3>
                <div class="contact-grid">
                  <div class="contact-section">
                    <h4>Primary Contact</h4>
                    <p><strong>${primaryContactName}</strong></p>
                    ${primaryContactPhone ? `<p>📱 ${primaryContactPhone}</p>` : ''}
                    ${primaryContactEmail ? `<p>📧 ${primaryContactEmail}</p>` : ''}
                  </div>
                  ${secondaryContactName ? `
                  <div class="contact-section">
                    <h4>Secondary Contact</h4>
                    <p><strong>${secondaryContactName}</strong></p>
                    ${secondaryContactPhone ? `<p>📱 ${secondaryContactPhone}</p>` : ''}
                    ${secondaryContactEmail ? `<p>📧 ${secondaryContactEmail}</p>` : ''}
                  </div>
                  ` : ''}
                </div>
              </div>

              ${event.coordinator_name ? `
              <div class="event-card" style="background: #f0fdf4; border-color: #bbf7d0;">
                <h3 style="margin-top: 0; color: #166534; border-bottom: 2px solid #86efac; padding-bottom: 8px;">📋 Coordinator</h3>
                <div class="detail-row">
                  <span class="detail-label">Name:</span>
                  <span class="detail-value">${event.coordinator_name}</span>
                </div>
              </div>
              ` : ''}

              ${assignmentNotes ? `
              <div class="notes-box">
                <strong>📝 Special Instructions:</strong><br/>
                <p style="margin: 8px 0 0 0;">${assignmentNotes}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin-top: 32px;">
                <a href="${vendorPortalUrl}" class="button">
                  View Full Details & Confirm
                </a>
              </div>

              <p style="margin-top: 30px; color: #666;">Please log in to your vendor portal to confirm your availability and view complete event details.</p>

              <div class="footer">
                <p><strong>Enzym3 Entertainment</strong></p>
                <p>This is an automated notification. Please do not reply to this email.</p>
                <p>© ${new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error: emailError } = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3entertainment.vip>",
      to: [vendor.email],
      subject: `New Event Assignment - ${clientName} - ${formattedDate}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      throw new Error(`Email send error: ${emailError.message}`);
    }

    console.log(`Email sent successfully to ${vendor.email}`);

    // Create in-app notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: djUserId,
        title: "New Event Assignment",
        content: `You've been assigned to ${clientName}'s ${event.event_type} on ${formattedDate}`,
        type: "assignment",
        wedding_id: eventId,
        metadata: {
          eventId: eventId,
          eventDate: event.event_date,
          clientName: clientName,
          eventType: event.event_type,
        },
      });

    if (notificationError) {
      console.error("Notification error:", notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Vendor notified successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-dj-assignment function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
