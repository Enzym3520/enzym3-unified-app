// Email template builders for Enzym3 Entertainment
// All functions return an HTML string suitable for sending via the send-email edge function.
// INVARIANT: All user-supplied string values are passed through esc() before insertion into HTML.

/** HTML-escape user-supplied content to prevent injection. */
function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function wrapper(headerSubtitle: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:#2D2921;padding:32px 24px;text-align:center;">
            <div style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">Enzym3 Entertainment</div>
            ${headerSubtitle ? `<div style="color:#85D4FA;font-size:14px;margin-top:6px;">${headerSubtitle}</div>` : ""}
          </div>
          <!-- Body -->
          <div style="padding:32px 24px;color:#333333;font-size:15px;line-height:1.6;">
            ${body}
          </div>
          <!-- Footer -->
          <div style="background:#f5f5f5;padding:16px 24px;text-align:center;font-size:12px;color:#888888;border-top:1px solid #e0e0e0;">
            Enzym3 Entertainment &bull; (770) 312-9619 &bull; booking@enzym3.com
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(href: string, label: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${esc(href)}" style="background:#2D2921;color:#85D4FA;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:15px;font-weight:bold;display:inline-block;letter-spacing:0.5px;">${esc(label)}</a>
  </div>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 16px 0;">Hi ${esc(name)},</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0;" />`;
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 12px 6px 0;color:#888888;font-size:13px;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:6px 0;font-size:14px;color:#333333;vertical-align:top;">${value}</td>
  </tr>`;
}

function detailTable(rows: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;">${rows}</table>`;
}

// ─────────────────────────────────────────────
// 1. Client invite email
// Subject: "You're invited to your Enzym3 Entertainment portal"
// ─────────────────────────────────────────────
export function clientInviteEmail(params: {
  clientName: string;
  eventDate: string;
  eventType: string;
  coordinatorName: string;
  coordinatorPhone: string;
  inviteLink: string;
}): string {
  const body = `
    ${greeting(params.clientName)}
    <p style="margin:0 0 16px 0;">
      We're thrilled to be part of your special day! Your personal Enzym3 Entertainment client portal is ready —
      use the link below to access your event details, review your contract, submit your vibe sheet, and more.
    </p>
    ${detailTable(
      detailRow("Event Date:", esc(params.eventDate)) +
      detailRow("Event Type:", esc(params.eventType)) +
      detailRow("Your Coordinator:", esc(params.coordinatorName)) +
      detailRow("Coordinator Phone:", esc(params.coordinatorPhone))
    )}
    ${btn(params.inviteLink, "Access Your Portal")}
    <p style="margin:16px 0 0 0;font-size:13px;color:#888888;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${esc(params.inviteLink)}" style="color:#85D4FA;word-break:break-all;">${esc(params.inviteLink)}</a>
    </p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("Your portal is ready", body);
}

// ─────────────────────────────────────────────
// 2. Contract ready email
// Subject: "Your Enzym3 contract is ready to sign"
// ─────────────────────────────────────────────
export function contractReadyEmail(params: {
  clientName: string;
  eventDate: string;
  eventType: string;
  venue?: string | null;
  contractLink: string;
}): string {
  const venueRow = params.venue ? detailRow("Venue:", esc(params.venue)) : "";
  const body = `
    ${greeting(params.clientName)}
    <p style="margin:0 0 16px 0;">
      Your Enzym3 Entertainment contract is ready for your review and signature. Please take a moment to
      read it carefully and sign at your earliest convenience to secure your booking.
    </p>
    ${detailTable(
      detailRow("Event Date:", esc(params.eventDate)) +
      detailRow("Event Type:", esc(params.eventType)) +
      venueRow
    )}
    ${btn(params.contractLink, "Review &amp; Sign Contract")}
    <p style="margin:16px 0 0 0;font-size:13px;color:#888888;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${esc(params.contractLink)}" style="color:#85D4FA;word-break:break-all;">${esc(params.contractLink)}</a>
    </p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("Your contract is ready to sign", body);
}

// ─────────────────────────────────────────────
// 3. Deposit confirmed email
// Subject: "Contract signed and deposit confirmed — you're all set!"
// ─────────────────────────────────────────────
export function depositConfirmedEmail(params: {
  clientName: string;
  eventDate: string;
  eventType: string;
  depositAmount: number;
  balanceDue: number;
  portalLink: string;
}): string {
  const body = `
    ${greeting(params.clientName)}
    <p style="margin:0 0 16px 0;">
      Great news — your contract is signed and your deposit has been received. You're officially booked with
      Enzym3 Entertainment! We can't wait to make your event unforgettable.
    </p>
    ${detailTable(
      detailRow("Event Date:", esc(params.eventDate)) +
      detailRow("Event Type:", esc(params.eventType)) +
      detailRow("Deposit Paid:", esc(formatCurrency(params.depositAmount))) +
      detailRow("Remaining Balance:", esc(formatCurrency(params.balanceDue)))
    )}
    ${btn(params.portalLink, "View Your Portal")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("You're booked!", body);
}

// ─────────────────────────────────────────────
// 4. Venue partner access email
// Subject: "Your Enzym3 portal is ready"
// ─────────────────────────────────────────────
export function venuePartnerAccessEmail(params: {
  clientName: string;
  eventDate: string;
  eventType: string;
  coordinatorName: string;
  coordinatorPhone: string;
  portalLink: string;
}): string {
  const body = `
    ${greeting(params.clientName)}
    <p style="margin:0 0 16px 0;">
      Your Enzym3 Entertainment portal has been set up and is ready for you to access. You can use it to
      view event details, track progress, and communicate with your coordinator.
    </p>
    ${detailTable(
      detailRow("Event Date:", esc(params.eventDate)) +
      detailRow("Event Type:", esc(params.eventType)) +
      detailRow("Your Coordinator:", esc(params.coordinatorName)) +
      detailRow("Coordinator Phone:", esc(params.coordinatorPhone))
    )}
    ${btn(params.portalLink, "Access Your Portal")}
    <p style="margin:16px 0 0 0;font-size:13px;color:#888888;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${esc(params.portalLink)}" style="color:#85D4FA;word-break:break-all;">${esc(params.portalLink)}</a>
    </p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("Your portal is ready", body);
}

// ─────────────────────────────────────────────
// 5. Vibe sheet submitted email (to coordinator)
// Subject: "[Client name] submitted their vibe sheet"
// ─────────────────────────────────────────────
export function vibeSheetSubmittedEmail(params: {
  coordinatorName: string;
  clientName: string;
  eventDate: string;
  staffPortalLink: string;
}): string {
  const body = `
    ${greeting(params.coordinatorName)}
    <p style="margin:0 0 16px 0;">
      <strong>${esc(params.clientName)}</strong> has submitted their vibe sheet for their upcoming event.
      Head to the staff portal to review their music preferences and event details.
    </p>
    ${detailTable(
      detailRow("Client:", esc(params.clientName)) +
      detailRow("Event Date:", esc(params.eventDate))
    )}
    ${btn(params.staffPortalLink, "View Vibe Sheet")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      This is an automated notification from the Enzym3 Entertainment system.
    </p>
  `;
  return wrapper("Vibe sheet submitted", body);
}

// ─────────────────────────────────────────────
// 6. Upgrade purchased email
// Subject: "Upgrade confirmed for your event!"
// ─────────────────────────────────────────────
export function upgradePurchasedEmail(params: {
  clientName: string;
  eventDate: string;
  items: Array<{ name: string; price: number }>;
  total: number;
}): string {
  const itemRows = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;">${esc(item.name)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right;">${esc(formatCurrency(item.price))}</td>
        </tr>`
    )
    .join("");

  const itemsTable = `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:2px solid #2D2921;">
      <thead>
        <tr>
          <th style="padding:10px 0;text-align:left;font-size:13px;color:#888888;font-weight:normal;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
          <th style="padding:10px 0;text-align:right;font-size:13px;color:#888888;font-weight:normal;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
        <tr>
          <td style="padding:12px 0 0 0;font-weight:bold;font-size:15px;">Total</td>
          <td style="padding:12px 0 0 0;font-weight:bold;font-size:15px;text-align:right;color:#2D2921;">${esc(formatCurrency(params.total))}</td>
        </tr>
      </tbody>
    </table>
  `;

  const body = `
    ${greeting(params.clientName)}
    <p style="margin:0 0 16px 0;">
      Your upgrade purchase has been confirmed! The following add-ons have been added to your event on
      <strong>${esc(params.eventDate)}</strong>.
    </p>
    ${itemsTable}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("Upgrade confirmed", body);
}

// ─────────────────────────────────────────────
// 7. Meeting scheduled email
// Subject: "Meeting scheduled with Enzym3 Entertainment"
// ─────────────────────────────────────────────
export function meetingScheduledEmail(params: {
  recipientName: string;
  otherPartyName: string;
  meetingDate: string;
  meetingTime: string;
  meetingType: string;
  meetingLink?: string | null;
}): string {
  const linkRow = params.meetingLink
    ? detailRow("Meeting Link:", `<a href="${esc(params.meetingLink)}" style="color:#85D4FA;">${esc(params.meetingLink)}</a>`)
    : "";

  const body = `
    ${greeting(params.recipientName)}
    <p style="margin:0 0 16px 0;">
      A meeting has been scheduled with <strong>${esc(params.otherPartyName)}</strong>.
      Please see the details below.
    </p>
    ${detailTable(
      detailRow("Date:", esc(params.meetingDate)) +
      detailRow("Time:", esc(params.meetingTime)) +
      detailRow("Meeting Type:", esc(params.meetingType)) +
      linkRow
    )}
    ${params.meetingLink ? btn(params.meetingLink, "Join Meeting") : ""}
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("Meeting scheduled", body);
}

// ─────────────────────────────────────────────
// 8. Vendor invite email
// Subject: "You've been invited to join Enzym3 Entertainment's vendor network"
// ─────────────────────────────────────────────
export function vendorInviteEmail(params: {
  vendorName: string;
  inviteLink: string;
}): string {
  const body = `
    ${greeting(params.vendorName)}
    <p style="margin:0 0 16px 0;">
      You've been invited to join the <strong>Enzym3 Entertainment vendor network</strong>. As a partner vendor,
      you'll gain access to our client events, coordinated logistics, and a streamlined booking workflow.
    </p>
    <p style="margin:0 0 16px 0;">
      Click the button below to set up your vendor profile and get started.
    </p>
    ${btn(params.inviteLink, "Accept Invitation")}
    <p style="margin:16px 0 0 0;font-size:13px;color:#888888;">
      If the button doesn't work, copy and paste this link into your browser:<br />
      <a href="${esc(params.inviteLink)}" style="color:#85D4FA;word-break:break-all;">${esc(params.inviteLink)}</a>
    </p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper("Vendor network invitation", body);
}

// ─────────────────────────────────────────────
// 9. Event reminder email
// Subject: "[X] days until your event with Enzym3!"
// ─────────────────────────────────────────────
export function eventReminderEmail(params: {
  clientName: string;
  eventDate: string;
  eventType: string;
  venue?: string | null;
  daysUntil: number;
  vibeSheetCompleted: boolean;
  depositPaid: boolean;
  coordinatorName: string;
  coordinatorPhone: string;
}): string {
  const venueRow = params.venue ? detailRow("Venue:", esc(params.venue)) : "";

  const checklistItems = [
    { label: "Vibe sheet submitted", done: params.vibeSheetCompleted },
    { label: "Deposit paid", done: params.depositPaid },
  ];

  const checklist = checklistItems
    .map(
      (item) =>
        `<li style="margin:6px 0;font-size:14px;">
          <span style="color:${item.done ? "#4CAF50" : "#F44336"};font-weight:bold;">${item.done ? "&#10003;" : "&#10007;"}</span>
          &nbsp;${esc(item.label)}
        </li>`
    )
    .join("");

  const body = `
    ${greeting(params.clientName)}
    <p style="margin:0 0 16px 0;">
      Just a friendly reminder — your event with Enzym3 Entertainment is coming up in
      <strong>${esc(String(params.daysUntil))} ${params.daysUntil === 1 ? "day" : "days"}</strong>!
      We're getting excited to celebrate with you.
    </p>
    ${detailTable(
      detailRow("Event Date:", esc(params.eventDate)) +
      detailRow("Event Type:", esc(params.eventType)) +
      venueRow +
      detailRow("Your Coordinator:", esc(params.coordinatorName)) +
      detailRow("Coordinator Phone:", esc(params.coordinatorPhone))
    )}
    ${divider()}
    <p style="margin:0 0 10px 0;font-weight:bold;font-size:14px;">Pre-Event Checklist</p>
    <ul style="margin:0;padding-left:20px;">
      ${checklist}
    </ul>
    ${divider()}
    <p style="margin:0;font-size:13px;color:#888888;">
      Questions? Reply to this email or call us at (770) 312-9619.
    </p>
  `;
  return wrapper(`${esc(String(params.daysUntil))} days to go!`, body);
}
