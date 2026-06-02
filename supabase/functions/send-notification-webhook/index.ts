import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@4.0.0";
import { safeLogger, redactEmail, redactName } from "../_shared/validators.ts";

const DASHBOARD_URL = Deno.env.get('COORDINATION_PORTAL_URL') || 'https://coordination.enzym3entertainment.vip';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationWebhookRequest {
  notification_id: string;
}

interface WeddingDetails {
  couple_name: string;
  event_date: string;
  contact_email: string;
  venue?: string;
  coordinator_name?: string;
  bride_email?: string;
  groom_email?: string;
}

interface MusicSheetDetails {
  id: string;
  processional?: string;
  bride_entrance?: string;
  recessional?: string;
  grand_entrance?: string;
  first_dance?: string;
  last_dance?: string;
  must_plays?: string[];
  do_not_plays?: string[];
  notes?: string;
  extra_songs?: Array<{
    song_name?: string;
    artist_name?: string;
    note?: string;
  }>;
  music_preferences?: Array<{
    type?: string;
    style_name?: string;
    song_name?: string;
    artist_name?: string;
  }>;
  group_dances?: Array<{
    dance_name?: string;
    approved?: boolean;
  }>;
  grand_entrance_list?: Array<{
    name?: string;
    role?: string;
    pairing?: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

const buildMusicSheetCreatedEmail = (
  weddingDetails: WeddingDetails,
  metadata: any
): EmailTemplate => {
  const hasCeremonySongs = metadata.has_ceremony_songs || false;
  const hasReceptionSongs = metadata.has_reception_songs || false;
  const mustPlaysCount = metadata.must_plays_count || 0;
  const doNotPlaysCount = metadata.do_not_plays_count || 0;
  const hasNotes = metadata.has_notes || false;

  return {
    subject: `🎵 New Music Sheet Submitted - ${weddingDetails.couple_name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 3px solid #8B5CF6; padding-bottom: 10px;">🎵 New Music Sheet Submitted</h2>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Couple:</strong> ${weddingDetails.couple_name}</p>
          <p style="margin: 8px 0;"><strong>Event Date:</strong> ${weddingDetails.event_date}</p>
          ${weddingDetails.venue ? `<p style="margin: 8px 0;"><strong>Venue:</strong> ${weddingDetails.venue}</p>` : ''}
          ${weddingDetails.coordinator_name ? `<p style="margin: 8px 0;"><strong>Coordinator:</strong> ${weddingDetails.coordinator_name}</p>` : ''}
        </div>

        <h3 style="color: #555; margin-top: 30px;">Music Sheet Summary:</h3>
        <ul style="line-height: 1.8; color: #333;">
          <li><strong>Ceremony Songs:</strong> ${hasCeremonySongs ? '✅ Provided' : '❌ Not provided'}</li>
          <li><strong>Reception Songs:</strong> ${hasReceptionSongs ? '✅ Provided' : '❌ Not provided'}</li>
          <li><strong>Must-Play Songs:</strong> ${mustPlaysCount} song${mustPlaysCount !== 1 ? 's' : ''}</li>
          <li><strong>Do Not Play Songs:</strong> ${doNotPlaysCount} song${doNotPlaysCount !== 1 ? 's' : ''}</li>
          <li><strong>Special Notes:</strong> ${hasNotes ? '✅ Included' : '❌ None'}</li>
        </ul>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${DASHBOARD_URL}/contacts?wedding_id=${metadata.wedding_id}" 
             style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Music Sheet in Dashboard →
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an automated notification from Enzym3 Wedding Management System
        </p>
      </div>
    `
  };
};

const buildMusicSheetUpdatedEmail = (
  weddingDetails: WeddingDetails,
  metadata: any
): EmailTemplate => {
  const fieldsChangedCount = metadata.fields_changed_count || 0;

  return {
    subject: `🎵 Music Sheet Updated - ${weddingDetails.couple_name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 3px solid #F59E0B; padding-bottom: 10px;">🎵 Music Sheet Updated</h2>
        
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <p style="margin: 0; color: #92400e;"><strong>${weddingDetails.couple_name}</strong> made changes to their music sheet</p>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Couple:</strong> ${weddingDetails.couple_name}</p>
          <p style="margin: 8px 0;"><strong>Event Date:</strong> ${weddingDetails.event_date}</p>
          ${weddingDetails.venue ? `<p style="margin: 8px 0;"><strong>Venue:</strong> ${weddingDetails.venue}</p>` : ''}
          ${weddingDetails.coordinator_name ? `<p style="margin: 8px 0;"><strong>Coordinator:</strong> ${weddingDetails.coordinator_name}</p>` : ''}
        </div>

        <h3 style="color: #555; margin-top: 30px;">Changes Made:</h3>
        <p style="color: #333;"><strong>${fieldsChangedCount}</strong> field${fieldsChangedCount !== 1 ? 's' : ''} updated</p>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${DASHBOARD_URL}/contacts?wedding_id=${metadata.wedding_id}" 
             style="display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Updated Music Sheet →
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an automated notification from Enzym3 Wedding Management System
        </p>
      </div>
    `
  };
};

const buildUpgradeOrderEmail = (
  weddingDetails: WeddingDetails,
  metadata: any
): EmailTemplate => {
  const packageName = metadata.package || 'Unknown';
  const emeraldChoice = metadata.emerald_choice;
  const paymentStatus = metadata.payment_status || 'draft';
  const notes = metadata.notes;

  return {
    subject: `✨ New Upgrade Order - ${weddingDetails.couple_name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; border-bottom: 3px solid #10B981; padding-bottom: 10px;">✨ New Upgrade Order</h2>
        
        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <p style="margin: 0; color: #065f46;"><strong>${weddingDetails.couple_name}</strong> ordered the <strong>${packageName}</strong> upgrade package</p>
        </div>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0;"><strong>Couple:</strong> ${weddingDetails.couple_name}</p>
          <p style="margin: 8px 0;"><strong>Event Date:</strong> ${weddingDetails.event_date}</p>
          <p style="margin: 8px 0;"><strong>Contact Email:</strong> ${weddingDetails.contact_email}</p>
          ${weddingDetails.venue ? `<p style="margin: 8px 0;"><strong>Venue:</strong> ${weddingDetails.venue}</p>` : ''}
        </div>

        <h3 style="color: #555; margin-top: 30px;">Order Details:</h3>
        <ul style="line-height: 1.8; color: #333;">
          <li><strong>Package:</strong> ${packageName}</li>
          ${emeraldChoice ? `<li><strong>Emerald Choice:</strong> ${emeraldChoice}</li>` : ''}
          <li><strong>Payment Status:</strong> <span style="text-transform: capitalize; font-weight: 600; color: ${paymentStatus === 'paid' ? '#10B981' : paymentStatus === 'pending' ? '#F59E0B' : '#6B7280'}">${paymentStatus}</span></li>
          ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ''}
        </ul>

        <div style="margin-top: 30px; text-align: center;">
          <a href="${DASHBOARD_URL}/contacts?wedding_id=${metadata.upgrade_order_id}" 
             style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            View Order in Dashboard →
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          This is an automated notification from Enzym3 Wedding Management System
        </p>
      </div>
    `
  };
};

const buildCoupleConfirmationEmail = (
  weddingDetails: WeddingDetails,
  musicSheet: MusicSheetDetails,
  isUpdate: boolean
): EmailTemplate => {
  const coupleName = weddingDetails.couple_name;
  const eventDate = weddingDetails.event_date;
  
  // Build ceremony section
  let ceremonyHtml = '';
  if (musicSheet.processional || musicSheet.bride_entrance || musicSheet.recessional) {
    ceremonyHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">🎼 Ceremony Songs</h3>
        ${musicSheet.processional ? `<p style="margin: 10px 0;"><strong>Processional:</strong> ${musicSheet.processional}</p>` : ''}
        ${musicSheet.bride_entrance ? `<p style="margin: 10px 0;"><strong>Bride's Entrance:</strong> ${musicSheet.bride_entrance}</p>` : ''}
        ${musicSheet.recessional ? `<p style="margin: 10px 0;"><strong>Recessional:</strong> ${musicSheet.recessional}</p>` : ''}
      </div>
    `;
  }

  // Build reception section
  let receptionHtml = '';
  if (musicSheet.grand_entrance || musicSheet.first_dance || musicSheet.last_dance) {
    receptionHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">💃 Reception Songs</h3>
        ${musicSheet.grand_entrance ? `<p style="margin: 10px 0;"><strong>Grand Entrance:</strong> ${musicSheet.grand_entrance}</p>` : ''}
        ${musicSheet.first_dance ? `<p style="margin: 10px 0;"><strong>First Dance:</strong> ${musicSheet.first_dance}</p>` : ''}
        ${musicSheet.last_dance ? `<p style="margin: 10px 0;"><strong>Last Dance:</strong> ${musicSheet.last_dance}</p>` : ''}
      </div>
    `;
  }

  // Build must-plays section
  let mustPlaysHtml = '';
  if (musicSheet.must_plays && musicSheet.must_plays.length > 0) {
    mustPlaysHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">⭐ Must-Play Songs</h3>
        <ul style="line-height: 1.8; margin: 10px 0;">
          ${musicSheet.must_plays.map(song => `<li>${song}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Build do-not-plays section
  let doNotPlaysHtml = '';
  if (musicSheet.do_not_plays && musicSheet.do_not_plays.length > 0) {
    doNotPlaysHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">🚫 Do Not Play</h3>
        <ul style="line-height: 1.8; margin: 10px 0;">
          ${musicSheet.do_not_plays.map(song => `<li>${song}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Build extra songs section
  let extraSongsHtml = '';
  if (musicSheet.extra_songs && musicSheet.extra_songs.length > 0) {
    extraSongsHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">🎵 Additional Song Requests</h3>
        <ul style="line-height: 1.8; margin: 10px 0;">
          ${musicSheet.extra_songs.map(song => `
            <li>
              ${song.song_name || 'Untitled'} ${song.artist_name ? `by ${song.artist_name}` : ''}
              ${song.note ? `<br><em style="color: #6b7280; font-size: 14px;">${song.note}</em>` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  // Build group dances section
  let groupDancesHtml = '';
  if (musicSheet.group_dances && musicSheet.group_dances.length > 0) {
    groupDancesHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">🕺 Group Dances</h3>
        <ul style="line-height: 1.8; margin: 10px 0;">
          ${musicSheet.group_dances.map(dance => `<li>${dance.dance_name || 'Untitled'}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // Build grand entrance list section
  let grandEntranceListHtml = '';
  if (musicSheet.grand_entrance_list && musicSheet.grand_entrance_list.length > 0) {
    grandEntranceListHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">👥 Grand Entrance Order</h3>
        <ol style="line-height: 1.8; margin: 10px 0;">
          ${musicSheet.grand_entrance_list.map(person => `
            <li>${person.name || 'Name TBD'} ${person.role ? `(${person.role})` : ''} ${person.pairing ? `with ${person.pairing}` : ''}</li>
          `).join('')}
        </ol>
      </div>
    `;
  }

  // Build notes section
  let notesHtml = '';
  if (musicSheet.notes) {
    notesHtml = `
      <div style="margin: 20px 0;">
        <h3 style="color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">📝 Additional Notes</h3>
        <p style="white-space: pre-wrap; background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">${musicSheet.notes}</p>
      </div>
    `;
  }

  return {
    subject: isUpdate ? `Music Sheet Updated - ${coupleName}` : `Your Music Sheet Confirmation - ${coupleName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
        <h2 style="color: #8B5CF6; margin-bottom: 10px;">
          ${isUpdate ? '🎵 Music Sheet Updated!' : '✨ Thank You for Your Music Sheet!'}
        </h2>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hi ${coupleName}! 👋
        </p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          ${isUpdate 
            ? `We've received your updated music selections and they look amazing! Below is your complete music sheet for ${eventDate}.` 
            : `Thank you so much for submitting your music sheet! We're thrilled to help create the perfect soundtrack for your special day on ${eventDate}. 🎉`
          }
        </p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6;">
          ${ceremonyHtml}
          ${receptionHtml}
          ${mustPlaysHtml}
          ${doNotPlaysHtml}
          ${extraSongsHtml}
          ${groupDancesHtml}
          ${grandEntranceListHtml}
          ${notesHtml}
          
          ${!ceremonyHtml && !receptionHtml && !mustPlaysHtml && !doNotPlaysHtml && !extraSongsHtml && !groupDancesHtml && !grandEntranceListHtml && !notesHtml 
            ? '<p style="color: #6b7280; text-align: center; padding: 20px;">No music selections have been added yet.</p>' 
            : ''
          }
        </div>

        <div style="margin: 30px 0; padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #F59E0B;">
          <p style="margin: 0 0 15px 0; font-size: 15px; line-height: 1.6;">
            <strong>Need to make changes?</strong> No problem! You can update your music sheet anytime by visiting your dashboard.
          </p>
          <div style="text-align: center;">
            <a href="${DASHBOARD_URL}/contacts" 
               style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              View Your Music Sheet →
            </a>
          </div>
        </div>

        <p style="font-size: 16px; line-height: 1.6; margin: 20px 0;">
          We'll be in touch soon with any questions. Can't wait to celebrate with you! 🎊
        </p>

        <p style="font-size: 16px; line-height: 1.6;">
          Best,<br>
          <strong>JJ & The Enzym3 Team</strong>
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 13px; text-align: center;">
          <p>This email is a confirmation of your music sheet ${isUpdate ? 'update' : 'submission'}. Keep this for your records!</p>
        </div>
      </div>
    `
  };
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

    if (!resendApiKey) {
      console.error('[EMAIL] RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { notification_id } = await req.json() as NotificationWebhookRequest;

    safeLogger.info('[EMAIL] Processing notification', { notification_id });

    // Fetch notification details
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (notifError || !notification) {
      safeLogger.error('[EMAIL] Failed to fetch notification', notifError, { notification_id });
      throw new Error('Notification not found');
    }

    // Fetch wedding details if available
    let weddingDetails: WeddingDetails | null = null;
    if (notification.wedding_id) {
      const { data: wedding } = await supabase
        .from('event_notification_history')
        .select('couple_name, event_date, contact_email, venue, coordinator_name, bride_email, groom_email')
        .eq('id', notification.wedding_id)
        .single();
      
      weddingDetails = wedding;
    }

    if (!weddingDetails) {
      safeLogger.error('[EMAIL] Wedding details not found', null, { notification_id });
      throw new Error('Wedding details required for email');
    }

    // Build email template based on notification type
    let emailTemplate: EmailTemplate;

    if (notification.type === 'music_sheet_created') {
      emailTemplate = buildMusicSheetCreatedEmail(weddingDetails, notification.metadata || {});
    } else if (notification.type === 'music_sheet_updated') {
      emailTemplate = buildMusicSheetUpdatedEmail(weddingDetails, notification.metadata || {});
    } else if (notification.type === 'upgrade_order') {
      emailTemplate = buildUpgradeOrderEmail(weddingDetails, notification.metadata || {});
    } else {
      safeLogger.warn('[EMAIL] Unknown notification type', { type: notification.type });
      // Fallback generic email
      emailTemplate = {
        subject: `Notification: ${notification.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notification.title}</h2>
            <p>${notification.content}</p>
            <p><strong>Couple:</strong> ${weddingDetails.couple_name}</p>
            <p><strong>Event Date:</strong> ${weddingDetails.event_date}</p>
          </div>
        `
      };
    }

    // Send admin email - log only safe metadata (no PII)
    safeLogger.info('[EMAIL] Sending admin notification', {
      notification_id,
      type: notification.type,
      couple_name: weddingDetails.couple_name, // Will be redacted by safeLogger
      subject: emailTemplate.subject
    });

    const adminEmailResponse = await resend.emails.send({
      from: "Enzym3 Entertainment <booking@enzym3.com>",
      to: ['jj.madison17@gmail.com'],
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    if (adminEmailResponse.error) {
      safeLogger.error('[EMAIL] Failed to send admin email', adminEmailResponse.error);
    } else {
      safeLogger.info('[EMAIL] Admin email sent successfully', { email_id: adminEmailResponse.data?.id });
    }

    // Send confirmation email to couple for music sheet notifications
    const isMusicSheetNotification = notification.type === 'music_sheet_created' || notification.type === 'music_sheet_updated';
    
    if (isMusicSheetNotification && weddingDetails.contact_email) {
      safeLogger.info('[EMAIL] Fetching music sheet details for couple confirmation');
      
      // Fetch full music sheet details with related data
      const { data: musicSheet, error: musicSheetError } = await supabase
        .from('music_sheets')
        .select(`
          *,
          extra_songs(*),
          music_preferences(*),
          group_dances(*),
          grand_entrance_list(*)
        `)
        .eq('wedding_id', notification.wedding_id)
        .single();

      if (musicSheetError) {
        safeLogger.error('[EMAIL] Failed to fetch music sheet', musicSheetError);
      } else if (musicSheet) {
        const isUpdate = notification.type === 'music_sheet_updated';
        const coupleEmailTemplate = buildCoupleConfirmationEmail(weddingDetails, musicSheet, isUpdate);
        
        // Determine recipient emails (prefer contact_email, add bride/groom if different)
        const recipients = [weddingDetails.contact_email];
        if (weddingDetails.bride_email && weddingDetails.bride_email !== weddingDetails.contact_email) {
          recipients.push(weddingDetails.bride_email);
        }
        if (weddingDetails.groom_email && weddingDetails.groom_email !== weddingDetails.contact_email) {
          recipients.push(weddingDetails.groom_email);
        }

        // Log with redacted recipients
        safeLogger.info('[EMAIL] Sending couple confirmation', {
          notification_id,
          type: notification.type,
          recipient_count: recipients.length
        });

        const coupleEmailResponse = await resend.emails.send({
          from: "Enzym3 Entertainment <booking@enzym3.com>",
          to: recipients,
          subject: coupleEmailTemplate.subject,
          html: coupleEmailTemplate.html,
        });

        if (coupleEmailResponse.error) {
          safeLogger.error('[EMAIL] Failed to send couple confirmation', coupleEmailResponse.error);
        } else {
          safeLogger.info('[EMAIL] Couple confirmation sent successfully', { email_id: coupleEmailResponse.data?.id });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        admin_email_sent: adminEmailResponse.data?.id ? true : false,
        admin_email_id: adminEmailResponse.data?.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    safeLogger.error('[EMAIL] Error in send-notification-webhook', error);
    // Return 200 to prevent breaking the database trigger
    return new Response(
      JSON.stringify({ 
        success: false,
        email_sent: false,
        error: 'An error occurred processing your request' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
