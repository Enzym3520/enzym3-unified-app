import { EventNotification } from '@/types/notification';

const PORTAL_URL = 'https://plan.enzym3entertainment.vip';

const EVENT_CONFIG: Record<string, { emoji: string; eventLabel: string }> = {
  wedding:     { emoji: '💍', eventLabel: 'Wedding' },
  quinceanera: { emoji: '🎀', eventLabel: 'Quinceañera' },
  birthday:    { emoji: '🎂', eventLabel: 'Birthday' },
  banquet:     { emoji: '🎉', eventLabel: 'Event' },
  corporate:   { emoji: '🎉', eventLabel: 'Corporate Event' },
  graduation:  { emoji: '🎓', eventLabel: 'Graduation Party' },
  sweet16:     { emoji: '🎀', eventLabel: 'Sweet 16' },
};

function getEventConfig(eventType: string) {
  const n = (eventType || 'wedding').toLowerCase();
  if (n.includes('quince') || n.includes('xv')) return EVENT_CONFIG.quinceanera;
  if (n.includes('birthday')) return EVENT_CONFIG.birthday;
  if (n.includes('graduation')) return EVENT_CONFIG.graduation;
  if (n.includes('sweet') && n.includes('16')) return EVENT_CONFIG.sweet16;
  if (n.includes('corporate') || n.includes('banquet')) return EVENT_CONFIG.banquet;
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
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isYouthEvent(eventType: string): boolean {
  const n = (eventType || '').toLowerCase();
  return (
    n.includes('quince') || n.includes('xv') ||
    n.includes('birthday') ||
    n.includes('graduation') ||
    (n.includes('sweet') && n.includes('16'))
  );
}

function buildPortalFeaturesList(isIndependent: boolean): string {
  const independentItems = isIndependent ? `
      <li style="padding:10px 0;border-bottom:1px solid #e5e0d8;font-size:15px;color:#4b4540;line-height:1.5;">
        <strong style="color:#2D2921;">Contract</strong> — sign digitally, no printing needed
      </li>
      <li style="padding:10px 0;border-bottom:1px solid #e5e0d8;font-size:15px;color:#4b4540;line-height:1.5;">
        <strong style="color:#2D2921;">Deposit</strong> — pay your 50% deposit securely online
      </li>` : '';

  return `
    <ul style="list-style:none;padding:0;margin:0 0 24px;">
      <li style="padding:10px 0;border-bottom:1px solid #e5e0d8;font-size:15px;color:#4b4540;line-height:1.5;">
        <strong style="color:#2D2921;">Vibe Sheet</strong> — your must-plays, do-not-plays, and how you want each moment to feel
      </li>
      ${independentItems}
      <li style="padding:10px 0;border-bottom:1px solid #e5e0d8;font-size:15px;color:#4b4540;line-height:1.5;">
        <strong style="color:#2D2921;">Upgrades</strong> — Ruby ($250) · Emerald ($500) · Sapphire ($1,000) + à la carte options
      </li>
      <li style="padding:10px 0;font-size:15px;color:#4b4540;line-height:1.5;">
        <strong style="color:#2D2921;">Schedule a call</strong> — book a planning meeting when you're ready
      </li>
    </ul>`;
}

export function generateWelcomeEmailHtml(notification: EventNotification): string {
  const config = getEventConfig(notification.event_type);
  const metadata = notification.additional_metadata || {};

  const coupleCode   = metadata.couple_code || metadata.coupleCode || '';
  const registrationLink = coupleCode ? `${PORTAL_URL}/join/${coupleCode}` : '';
  const isIndependent = metadata.booking_source === 'independent' || metadata.bookingSource === 'independent';

  const youth = isYouthEvent(notification.event_type);
  const primaryContact = metadata.primary_contact_name || metadata.primaryContactName
    || (notification as any).primary_contact_name || '';
  const greetingName  = youth && primaryContact ? primaryContact : notification.couple_name;
  const honoreeName   = notification.couple_name;

  const eventPhrase = youth && primaryContact
    ? `${escapeHtml(honoreeName)}'s ${escapeHtml(config.eventLabel.toLowerCase())}`
    : `your ${escapeHtml(config.eventLabel.toLowerCase())}`;

  const dateVenue = notification.venue
    ? `${formatDate(notification.event_date)} at ${escapeHtml(notification.venue)}`
    : formatDate(notification.event_date);

  const ctaBlock = registrationLink
    ? `<div style="text-align:center;margin:0 0 28px;">
        <a href="${registrationLink}"
           style="display:inline-block;background-color:#85D4FA;color:#2D2921;padding:14px 36px;text-decoration:none;border-radius:30px;font-weight:600;font-size:16px;letter-spacing:0.3px;">
          Start Planning →
        </a>
      </div>`
    : '';

  const portalFeatures = buildPortalFeaturesList(isIndependent);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Let's set the vibe — your ${escapeHtml(config.eventLabel)} planning starts now</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#DBD4C3;font-family:'Poppins',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#DBD4C3;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 30px 24px;background-color:#DBD4C3;">
              <img src="https://mcusercontent.com/ceda7c82a77b57df5ca0efccc/images/68f041cd-3568-14f6-bd6f-e7306c3f526f.png"
                   alt="Enzym3 Entertainment" width="200"
                   style="display:block;margin:0 auto;" />
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td style="padding:32px 36px 0;">
              <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#2D2921;margin:0 0 10px;font-weight:600;text-align:center;">
                Let's Set the Vibe ${escapeHtml(config.emoji)}
              </h1>
              <div style="width:60px;height:3px;background-color:#85D4FA;margin:0 auto 28px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:0 36px 36px;">
              <p style="color:#2D2921;font-size:15px;line-height:1.7;margin:0 0 16px;">
                Hey <strong>${escapeHtml(greetingName)}</strong>,
              </p>

              <p style="color:#4b4540;font-size:15px;line-height:1.7;margin:0 0 20px;">
                Congrats — your date is locked in and I'm genuinely excited to be part of ${eventPhrase} on <strong>${formatDate(notification.event_date)}</strong>${notification.venue ? ` at <strong>${escapeHtml(notification.venue)}</strong>` : ''}.
              </p>

              <p style="color:#4b4540;font-size:15px;line-height:1.7;margin:0 0 16px;">
                I've set up your personal planning portal so we can start building the experience together. Here's what's inside:
              </p>

              ${portalFeatures}

              <p style="color:#4b4540;font-size:15px;line-height:1.7;margin:0 0 24px;">
                The vibe sheet is the most important piece — the more detail you give me, the better I can make your night.
              </p>

              ${ctaBlock}

              <p style="color:#8a8278;font-size:13px;line-height:1.6;margin:0 0 28px;text-align:center;">
                Your event: ${escapeHtml(dateVenue)}
              </p>

              <!-- Signature -->
              <div style="border-top:1px solid #e5e0d8;padding-top:20px;">
                <p style="color:#2D2921;font-size:15px;line-height:1.8;margin:0;">
                  <strong>JJ | DJ Enzym3</strong><br>
                  Enzym3 Entertainment<br>
                  520-406-8600<br>
                  <a href="mailto:booking@enzym3entertainment.vip" style="color:#85D4FA;text-decoration:none;">booking@enzym3entertainment.vip</a>
                </p>
                <p style="color:#4b4540;font-size:14px;line-height:1.6;margin:12px 0 0;">
                  Reply anytime if you have questions.
                </p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <p style="text-align:center;color:#8a8278;font-size:11px;margin-top:16px;">
          &copy; ${new Date().getFullYear()} Enzym3 Entertainment &middot; Tucson, AZ &middot;
          <a href="https://enzym3entertainment.vip" style="color:#8a8278;">enzym3entertainment.vip</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function copyWelcomeEmailToClipboard(notification: EventNotification): Promise<boolean> {
  const html = generateWelcomeEmailHtml(notification);
  try {
    const blob = new Blob([html], { type: 'text/html' });
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
    return true;
  } catch {
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch {
      return false;
    }
  }
}
