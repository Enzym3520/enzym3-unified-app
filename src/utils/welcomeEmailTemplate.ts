import { EventNotification } from '@/types/notification';

const PORTAL_URL = 'https://booking.enzym3entertainment.vip';

const EVENT_CONFIG: Record<string, {
  emoji: string;
  eventLabel: string;
}> = {
  wedding: { emoji: '💍', eventLabel: 'Wedding' },
  quinceanera: { emoji: '🎀', eventLabel: 'Quinceañera' },
  birthday: { emoji: '🎂', eventLabel: 'Birthday' },
  banquet: { emoji: '🎉', eventLabel: 'Event' },
  corporate: { emoji: '🎉', eventLabel: 'Corporate Event' },
  graduation: { emoji: '🎓', eventLabel: 'Graduation Party' },
  sweet16: { emoji: '🎀', eventLabel: 'Sweet 16' },
};

function getEventConfig(eventType: string) {
  const normalized = (eventType || 'wedding').toLowerCase();
  if (normalized.includes('quince') || normalized.includes('xv')) return EVENT_CONFIG.quinceanera;
  if (normalized.includes('birthday')) return EVENT_CONFIG.birthday;
  if (normalized.includes('graduation')) return EVENT_CONFIG.graduation;
  if (normalized.includes('sweet') && normalized.includes('16')) return EVENT_CONFIG.sweet16;
  if (normalized.includes('corporate') || normalized.includes('banquet')) return EVENT_CONFIG.banquet;
  return EVENT_CONFIG.wedding;
}

function escapeHtml(input: unknown): string {
  if (input === undefined || input === null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Detect youth/milestone events where the contact person ≠ the honoree
function isYouthEvent(eventType: string): boolean {
  const normalized = (eventType || '').toLowerCase();
  return (
    normalized.includes('quince') || normalized.includes('xv') ||
    normalized.includes('birthday') ||
    normalized.includes('graduation') ||
    (normalized.includes('sweet') && normalized.includes('16'))
  );
}

export function generateWelcomeEmailHtml(notification: EventNotification): string {
  const config = getEventConfig(notification.event_type);
  const metadata = notification.additional_metadata || {};

  const coupleCode = metadata.couple_code || metadata.coupleCode || '';
  const registrationLink = coupleCode ? `${PORTAL_URL}/register?code=${coupleCode}` : '';

  const isIndependent = metadata.booking_source === 'independent' || metadata.bookingSource === 'independent';

  const hoursBooked = metadata.hoursBooked || metadata.form_data?.hoursBooked || '';
  const hoursText = hoursBooked ? `${hoursBooked} hours` : 'your scheduled time';

  const packageType = !isIndependent ? (notification.package_type || '') : '';

  // Youth events: greet the contact person, reference the honoree in body
  const youth = isYouthEvent(notification.event_type);
  const primaryContact = metadata.primary_contact_name || metadata.primaryContactName
    || (notification as any).primary_contact_name || '';
  const greetingName = youth && primaryContact ? primaryContact : notification.couple_name;
  const honoreeName = notification.couple_name; // always the honoree / couple

  // Body line differs for youth vs wedding/banquet
  const bodyEventPhrase = youth && primaryContact
    ? `${escapeHtml(honoreeName)}'s ${escapeHtml(config.eventLabel.toLowerCase())}`
    : `your ${escapeHtml(config.eventLabel.toLowerCase())}`;

  const ctaBlock = registrationLink
    ? `<div style="text-align: center; margin: 0 0 28px;">
        <a href="${registrationLink}"
           style="display: inline-block; background-color: #85D4FA; color: #2D2921; padding: 14px 36px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px;">
          Fill Out Your Vibe Planner
        </a>
      </div>`
    : '';

  const independentBlock = isIndependent
    ? `<p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
        You'll receive a separate email shortly with your contract and deposit details so we can officially lock everything in.
      </p>`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Let's Build Your Event</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; background-color: #DBD4C3; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #DBD4C3;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          
          <!-- Header: Logo -->
          <tr>
            <td align="center" style="padding: 40px 30px 24px; background-color: #DBD4C3;">
              <img src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
                   alt="Enzym3 Entertainment" width="200"
                   style="display: block; margin: 0 auto;" />
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 32px 36px 0;">
              <h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; color: #2D2921; margin: 0 0 12px; font-weight: 600; text-align: center;">
                Let's Build Your Event
              </h1>
              <div style="width: 60px; height: 3px; background-color: #85D4FA; margin: 0 auto 28px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 0 36px;">
              <p style="color: #2D2921; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                Hey <strong>${escapeHtml(greetingName)}</strong>,
              </p>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                I'm excited to be part of ${bodyEventPhrase} on <strong>${formatDate(notification.event_date)}</strong>${notification.venue ? ` at <strong>${escapeHtml(notification.venue)}</strong>` : ''}.
                We've got you scheduled for <strong>${hoursText}</strong>, and now it's time to shape the vibe.${packageType ? ` <strong>(${escapeHtml(packageType)} Package)</strong>` : ''}
              </p>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                First step — let's get your music dialed in.
              </p>

              ${ctaBlock}

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                Share your must-play songs, do-not-play list, special moments, and the overall energy you're going for.
              </p>

              ${independentBlock}

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
                If you're interested in upgrades like uplighting, cold sparks, or a custom monogram, just let me know and I'll walk you through options.
              </p>

              <p style="color: #4b4540; font-size: 15px; line-height: 1.7; margin: 0 0 28px;">
                Looking forward to making this one special.
              </p>

              <!-- Signature -->
              <div style="border-top: 1px solid #e5e0d8; padding-top: 20px; margin-bottom: 32px;">
                <p style="color: #2D2921; font-size: 15px; line-height: 1.8; margin: 0;">
                  <strong>JJ | DJ Enzym3</strong><br>
                  Enzym3 Entertainment<br>
                  520-406-8600<br>
                  <a href="mailto:booking@enzym3entertainment.vip" style="color: #85D4FA; text-decoration: none;">booking@enzym3entertainment.vip</a>
                </p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="text-align: center; color: #8a8278; font-size: 11px; margin-top: 16px;">
          &copy; ${new Date().getFullYear()} Enzym3 Entertainment &middot; Tucson, AZ &middot; <a href="https://enzym3entertainment.vip" style="color: #8a8278;">enzym3entertainment.vip</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Copy the welcome email HTML to the clipboard as rich HTML content
 * so it pastes with formatting in Gmail / Outlook.
 */
export async function copyWelcomeEmailToClipboard(notification: EventNotification): Promise<boolean> {
  const html = generateWelcomeEmailHtml(notification);
  try {
    const blob = new Blob([html], { type: 'text/html' });
    await navigator.clipboard.write([
      new ClipboardItem({ 'text/html': blob }),
    ]);
    return true;
  } catch {
    // Fallback: copy as plain text
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch {
      return false;
    }
  }
}
