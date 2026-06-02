import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

// ============================================
// ENZYM3 BRANDING CONSTANTS
// ============================================
const BRAND = {
  name: 'Enzym3 Entertainment',
  primaryColor: '#4FA8D1',      // Medium blue (client emails)
  primaryLight: '#85D4FA',      // Light blue
  accentColor: '#DBD4C3',       // Beige/gold (tan background)
  darkColor: '#1f2937',         // Dark gray
  mutedColor: '#6b7280',        // Muted gray
  successColor: '#10B981',      // Green
  warningColor: '#F59E0B',      // Amber
  errorColor: '#EF4444',        // Red
  backgroundColor: '#DBD4C3',   // Tan background for all emails
  cardBackground: '#ffffff',    // White
  borderColor: '#e5e7eb',       // Light border
  // Vendor-specific colors
  vendorPrimary: '#DC2626',     // Red for vendor portal
  vendorPrimaryLight: '#EF4444', // Light red
  vendorAccent: '#1f2937',      // Black accent
}

const styles = {
  main: {
    backgroundColor: BRAND.backgroundColor,
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  container: {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#DBD4C3',
    padding: '40px 30px',
    borderRadius: '12px 12px 0 0',
    textAlign: 'center' as const,
  },
  headerDark: {
    background: BRAND.darkColor,
    padding: '30px',
    borderRadius: '12px 12px 0 0',
    textAlign: 'center' as const,
  },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    color: '#ffffff',
    fontSize: '32px',
    fontWeight: '700',
    margin: '0',
    letterSpacing: '0.5px',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '14px',
    fontWeight: '300',
    margin: '8px 0 0 0',
    letterSpacing: '0.3px',
  },
  body: {
    backgroundColor: BRAND.cardBackground,
    padding: '40px 35px',
    border: `1px solid ${BRAND.borderColor}`,
    borderTop: 'none',
    borderRadius: '0 0 12px 12px',
  },
  heading: {
    fontFamily: "'Playfair Display', Georgia, serif",
    color: BRAND.darkColor,
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 20px 0',
  },
  text: {
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: '1.7',
    margin: '0 0 16px 0',
  },
  mutedText: {
    color: BRAND.mutedColor,
    fontSize: '14px',
    lineHeight: '1.6',
  },
  button: {
    background: `linear-gradient(135deg, ${BRAND.primaryLight} 0%, ${BRAND.primaryColor} 100%)`,
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
  buttonSuccess: {
    background: `linear-gradient(135deg, #34D399 0%, ${BRAND.successColor} 100%)`,
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  buttonWarning: {
    background: `linear-gradient(135deg, #FBBF24 0%, ${BRAND.warningColor} 100%)`,
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
  },
  card: {
    backgroundColor: BRAND.backgroundColor,
    padding: '24px',
    borderRadius: '8px',
    margin: '24px 0',
  },
  codeBox: {
    background: `linear-gradient(135deg, ${BRAND.accentColor} 0%, #EAE6DC 100%)`,
    padding: '24px',
    borderRadius: '8px',
    margin: '24px 0',
    border: `2px solid ${BRAND.primaryColor}`,
    textAlign: 'center' as const,
  },
  code: {
    fontFamily: "'Courier New', monospace",
    fontSize: '32px',
    fontWeight: 'bold',
    color: BRAND.primaryColor,
    letterSpacing: '3px',
    margin: '0',
  },
  codeLabel: {
    color: BRAND.mutedColor,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  alertWarning: {
    background: '#FEF3C7',
    borderLeft: `4px solid ${BRAND.warningColor}`,
    padding: '16px 20px',
    margin: '24px 0',
    borderRadius: '0 8px 8px 0',
  },
  alertSuccess: {
    background: '#D1FAE5',
    borderLeft: `4px solid ${BRAND.successColor}`,
    padding: '16px 20px',
    margin: '24px 0',
    borderRadius: '0 8px 8px 0',
  },
  alertInfo: {
    background: '#DBEAFE',
    borderLeft: `4px solid ${BRAND.primaryColor}`,
    padding: '16px 20px',
    margin: '24px 0',
    borderRadius: '0 8px 8px 0',
  },
  divider: {
    borderColor: BRAND.borderColor,
    margin: '32px 0',
  },
  footer: {
    textAlign: 'center' as const,
    padding: '24px 0 0 0',
    borderTop: `1px solid ${BRAND.borderColor}`,
    marginTop: '32px',
  },
  footerText: {
    color: '#9ca3af',
    fontSize: '13px',
    lineHeight: '1.6',
    margin: '0',
  },
  tableRow: {
    borderBottom: `1px solid ${BRAND.backgroundColor}`,
  },
  tableCell: {
    padding: '12px 0',
    fontSize: '15px',
  },
  tableCellLabel: {
    color: BRAND.mutedColor,
    fontWeight: '600',
    width: '140px',
  },
  tableCellValue: {
    color: BRAND.darkColor,
  },
}

// ============================================
// HELPER FUNCTIONS
// ============================================
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  } catch {
    return dateStr
  }
}

// ============================================
// 1. WELCOME EMAIL (for couples/clients)
// ============================================
interface WelcomeEmailProps {
  coupleName: string
  eventType: string
  eventDate: string
  venue?: string
  coupleCode: string
  registrationLink: string
  bookingSource?: 'venue_partner' | 'independent'
  totalPrice?: number
  depositAmount?: number
  hoursBooked?: string | number
  packageType?: string
}

export const WelcomeEmail = ({
  coupleName,
  eventType,
  eventDate,
  venue,
  coupleCode,
  registrationLink,
  bookingSource = 'venue_partner',
  totalPrice,
  depositAmount,
  hoursBooked,
  packageType,
}: WelcomeEmailProps) => {
  const config = getEventConfig(eventType)
  const isIndependent = bookingSource === 'independent'
  const hoursText = hoursBooked ? `${hoursBooked} hours` : 'your scheduled time'
  // Show package type for venue partners only
  const showPackage = !isIndependent && packageType ? ` (${packageType} Package)` : ''
  
  return (
    <Html>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Preview>Let's Build Your Event – Your Vibe Planner is ready!</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header: Logo + Tagline */}
          <Section style={styles.header}>
            <Img
              src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
              alt="Enzym3 Entertainment"
              width="200"
              style={{ display: 'block', margin: '0 auto' }}
            />
          </Section>
          
          {/* White card body */}
          <Section style={{ ...styles.body, borderTop: 'none' }}>
            {/* Title */}
            <Heading style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '28px', color: '#2D2921', fontWeight: '600', textAlign: 'center' as const, margin: '0 0 12px' }}>
              Let's Build Your Event
            </Heading>
            <Hr style={{ width: '60px', borderColor: '#85D4FA', borderWidth: '2px', margin: '0 auto 28px' }} />

            {/* Greeting */}
            <Text style={{ ...styles.text, color: '#2D2921' }}>
              Hey <strong>{coupleName}</strong>,
            </Text>

            <Text style={styles.text}>
              I'm excited to be part of your {config.eventLabel.toLowerCase()} on <strong>{formatDate(eventDate)}</strong>{venue ? <> at <strong>{venue}</strong></> : null}.
              We've got you scheduled for <strong>{hoursText}</strong>, and now it's time to shape the vibe.{showPackage ? <strong>{showPackage}</strong> : null}
            </Text>

            <Text style={styles.text}>
              First step — let's get your music dialed in.
            </Text>

            {/* CTA Button */}
            <Section style={{ textAlign: 'center', margin: '24px 0' }}>
              <Link href={registrationLink} style={{
                display: 'inline-block',
                backgroundColor: '#85D4FA',
                color: '#2D2921',
                padding: '14px 36px',
                textDecoration: 'none',
                borderRadius: '30px',
                fontWeight: '600',
                fontSize: '16px',
                letterSpacing: '0.3px',
              }}>
                Fill Out Your Vibe Planner
              </Link>
            </Section>

            <Text style={styles.text}>
              Share your must-play songs, do-not-play list, special moments, and the overall energy you're going for.
            </Text>

            {isIndependent && (
              <Text style={styles.text}>
                You'll receive a separate email shortly with your contract and deposit details so we can officially lock everything in.
              </Text>
            )}

            <Text style={styles.text}>
              If you're interested in upgrades like uplighting, cold sparks, or a custom monogram, just let me know and I'll walk you through options.
            </Text>

            <Text style={{ ...styles.text, marginBottom: '28px' }}>
              Looking forward to making this one special.
            </Text>

            {/* Signature */}
            <Hr style={{ borderColor: '#e5e0d8', margin: '0 0 20px' }} />
            <Text style={{ ...styles.text, lineHeight: '1.8', margin: '0' }}>
              <strong>JJ | DJ Enzym3</strong><br />
              Enzym3 Entertainment<br />
              520-406-8600<br />
              <Link href="mailto:booking@enzym3entertainment.vip" style={{ color: '#85D4FA', textDecoration: 'none' }}>booking@enzym3entertainment.vip</Link>
            </Text>

            {/* Footer */}
            <Section style={{ ...styles.footer, borderTop: 'none', marginTop: '24px' }}>
              <Text style={styles.footerText}>
                © {new Date().getFullYear()} Enzym3 Entertainment · Tucson, AZ
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ============================================
// 2. VENDOR INVITE EMAIL
// ============================================
interface VendorInviteEmailProps {
  recipientName: string
  companyName?: string
  vendorType: string
  code: string
  registrationLink: string
  expiryDate: string
}

// Vendor-specific styles with red/black/tan branding
const vendorStyles = {
  main: {
    backgroundColor: BRAND.backgroundColor, // Tan background
    fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  container: {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
  },
  header: {
    background: 'linear-gradient(135deg, #EAE6DC 0%, #DBD4C3 100%)',
    padding: '40px 30px',
    borderRadius: '12px 12px 0 0',
    textAlign: 'center' as const,
  },
  logo: {
    margin: '0 auto',
  },
  tagline: {
    color: BRAND.vendorPrimary,
    fontSize: '14px',
    fontWeight: '600',
    margin: '12px 0 0 0',
    letterSpacing: '0.3px',
  },
  button: {
    background: `linear-gradient(135deg, ${BRAND.vendorPrimaryLight} 0%, ${BRAND.vendorPrimary} 100%)`,
    color: '#ffffff',
    padding: '16px 32px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
  codeBox: {
    background: `linear-gradient(135deg, ${BRAND.accentColor} 0%, #EAE6DC 100%)`,
    padding: '24px',
    borderRadius: '8px',
    margin: '24px 0',
    border: `2px solid ${BRAND.vendorPrimary}`,
    textAlign: 'center' as const,
  },
  code: {
    fontFamily: "'Courier New', monospace",
    fontSize: '32px',
    fontWeight: 'bold',
    color: BRAND.vendorPrimary,
    letterSpacing: '3px',
    margin: '0',
  },
}

export const VendorInviteEmail = ({
  recipientName,
  companyName,
  vendorType,
  code,
  registrationLink,
  expiryDate,
}: VendorInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to Enzym3 Entertainment - Your Vendor Invitation</Preview>
    <Body style={vendorStyles.main}>
      <Container style={styles.container}>
        <Section style={vendorStyles.header}>
          <Img
            src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
            alt="Enzym3 Entertainment"
            width="220"
            style={vendorStyles.logo}
          />
          <Text style={vendorStyles.tagline}>Exclusive Vendor Invitation</Text>
        </Section>
        
        <Section style={styles.body}>
          <Heading style={styles.heading}>Welcome, {recipientName}!</Heading>
          
          <Text style={styles.text}>
            We're thrilled to invite you to join the Enzym3 Entertainment family as a trusted <strong>{vendorType}</strong> partner. 
            Your expertise will help us create unforgettable experiences for our clients.
          </Text>
          
          {companyName && (
            <Text style={styles.text}>
              <strong>Company:</strong> {companyName}
            </Text>
          )}
          
          <Section style={vendorStyles.codeBox}>
            <Text style={styles.codeLabel}>Your Exclusive Registration Code</Text>
            <Text style={vendorStyles.code}>{code}</Text>
          </Section>
          
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={registrationLink} style={vendorStyles.button}>
              Complete Registration
            </Link>
          </Section>
          
          <Text style={{ ...styles.mutedText, textAlign: 'center' }}>
            Or copy and paste this link into your browser:<br />
            <Link href={registrationLink} style={{ color: BRAND.vendorPrimary, fontSize: '13px' }}>
              {registrationLink}
            </Link>
          </Text>

          <Text style={{ ...styles.mutedText, textAlign: 'center', marginTop: '12px' }}>
            If the link above doesn't work, try this alternative link:<br />
            <Link href={registrationLink.replace('coordination.enzym3entertainment.vip', 'e3ecoordination.lovable.app')} style={{ color: BRAND.mutedColor, fontSize: '13px' }}>
              {registrationLink.replace('coordination.enzym3entertainment.vip', 'e3ecoordination.lovable.app')}
            </Link>
          </Text>
          
          <Section style={styles.alertWarning}>
            <Text style={{ color: '#92400E', margin: '0', fontSize: '14px' }}>
              ⏰ <strong>Important:</strong> This invitation expires on <strong>{expiryDate}</strong>. Please complete your registration before this date.
            </Text>
          </Section>
          
          <Section style={styles.card}>
            <Heading as="h3" style={{ ...styles.heading, fontSize: '18px', margin: '0 0 16px 0' }}>
              Getting Started
            </Heading>
            <ol style={{ margin: '0', paddingLeft: '20px', lineHeight: '1.8' }}>
              <li style={{ marginBottom: '12px' }}>Click the <strong>"Complete Registration"</strong> button above</li>
              <li style={{ marginBottom: '12px' }}>Enter your exclusive invite code: <strong style={{ color: BRAND.vendorPrimary, fontFamily: 'monospace' }}>{code}</strong></li>
              <li style={{ marginBottom: '12px' }}>Verify your information and complete your profile</li>
              <li style={{ marginBottom: '12px' }}>Take a quick tour of the vendor portal</li>
              <li style={{ marginBottom: '12px' }}>Start receiving premium event assignments</li>
            </ol>
          </Section>
          
          <Hr style={styles.divider} />
          
          <Text style={styles.text}>
            We're excited to work with you and look forward to building a successful partnership. If you have any questions, our team is here to help.
          </Text>
          <Text style={{ ...styles.text, margin: '0' }}>
            <strong style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>The Enzym3 Entertainment Team</strong>
          </Text>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              If you didn't expect this invitation or have questions, please contact us at team@enzym3entertainment.vip
            </Text>
            <Text style={{ ...styles.footerText, marginTop: '8px' }}>
              © {new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 3. ADMIN NOTIFICATION EMAIL (new event submitted)
// ============================================
interface AdminNotificationEmailProps {
  coupleName: string
  eventType: string
  eventDate: string
  venue?: string
  packageType?: string
  contactEmail: string
  contactPhone?: string
  guestCount?: number
  coordinatorName?: string
  submittedBy: string
  coupleCode: string
  dashboardLink: string
}

export const AdminNotificationEmail = ({
  coupleName,
  eventType,
  eventDate,
  venue,
  packageType,
  contactEmail,
  contactPhone,
  guestCount,
  coordinatorName,
  submittedBy,
  coupleCode,
  dashboardLink,
}: AdminNotificationEmailProps) => {
  const config = getEventConfig(eventType)
  
  return (
    <Html>
      <Head />
      <Preview>{config.emoji} New {config.eventLabel} Submitted - {coupleName}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.headerDark}>
            <Heading style={{ ...styles.logo, fontSize: '24px' }}>
              {config.emoji} New {config.eventLabel} Submitted
            </Heading>
          </Section>
          
          <Section style={styles.body}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Client:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coupleName}</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Event Type:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{eventType}</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Date:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{formatDate(eventDate)}</td>
              </tr>
              {venue && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Venue:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{venue}</td>
                </tr>
              )}
              {packageType && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Package:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{packageType}</td>
                </tr>
              )}
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Contact Email:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{contactEmail}</td>
              </tr>
              {contactPhone && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Phone:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{contactPhone}</td>
                </tr>
              )}
              {guestCount && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Guest Count:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{guestCount}</td>
                </tr>
              )}
              {coordinatorName && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Coordinator:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coordinatorName}</td>
                </tr>
              )}
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Submitted By:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{submittedBy}</td>
              </tr>
              <tr>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Couple Code:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>
                  <code style={{ background: BRAND.backgroundColor, padding: '4px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {coupleCode}
                  </code>
                </td>
              </tr>
            </table>
            
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Link href={dashboardLink} style={styles.button}>
                View in Dashboard
              </Link>
            </Section>
            
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                Enzym3 Entertainment Coordination System
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ============================================
// 4. MUSIC SHEET CREATED EMAIL (to admin)
// ============================================
interface MusicSheetCreatedEmailProps {
  coupleName: string
  eventDate: string
  venue?: string
  coordinatorName?: string
  hasCeremonySongs: boolean
  hasReceptionSongs: boolean
  mustPlaysCount: number
  doNotPlaysCount: number
  hasNotes: boolean
  dashboardLink: string
}

export const MusicSheetCreatedEmail = ({
  coupleName,
  eventDate,
  venue,
  coordinatorName,
  hasCeremonySongs,
  hasReceptionSongs,
  mustPlaysCount,
  doNotPlaysCount,
  hasNotes,
  dashboardLink,
}: MusicSheetCreatedEmailProps) => (
  <Html>
    <Head />
    <Preview>🎵 New Music Sheet Submitted - {coupleName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={{ ...styles.header, background: `linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)` }}>
          <Heading style={{ ...styles.logo, fontSize: '24px' }}>🎵 New Music Sheet Submitted</Heading>
        </Section>
        
        <Section style={styles.body}>
          <Section style={styles.card}>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Couple:</strong> {coupleName}</Text>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Event Date:</strong> {formatDate(eventDate)}</Text>
            {venue && <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Venue:</strong> {venue}</Text>}
            {coordinatorName && <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Coordinator:</strong> {coordinatorName}</Text>}
          </Section>
          
          <Heading as="h3" style={{ ...styles.heading, fontSize: '18px' }}>Music Sheet Summary:</Heading>
          <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px', lineHeight: '2' }}>
            <li><strong>Ceremony Songs:</strong> {hasCeremonySongs ? '✅ Provided' : '❌ Not provided'}</li>
            <li><strong>Reception Songs:</strong> {hasReceptionSongs ? '✅ Provided' : '❌ Not provided'}</li>
            <li><strong>Must-Play Songs:</strong> {mustPlaysCount} song{mustPlaysCount !== 1 ? 's' : ''}</li>
            <li><strong>Do Not Play Songs:</strong> {doNotPlaysCount} song{doNotPlaysCount !== 1 ? 's' : ''}</li>
            <li><strong>Special Notes:</strong> {hasNotes ? '✅ Included' : '❌ None'}</li>
          </ul>
          
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={dashboardLink} style={{ ...styles.button, background: `linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)` }}>
              View Music Sheet in Dashboard →
            </Link>
          </Section>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Enzym3 Entertainment Coordination System
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 5. MUSIC SHEET UPDATED EMAIL (to admin)
// ============================================
interface MusicSheetUpdatedEmailProps {
  coupleName: string
  eventDate: string
  venue?: string
  coordinatorName?: string
  fieldsChangedCount: number
  dashboardLink: string
}

export const MusicSheetUpdatedEmail = ({
  coupleName,
  eventDate,
  venue,
  coordinatorName,
  fieldsChangedCount,
  dashboardLink,
}: MusicSheetUpdatedEmailProps) => (
  <Html>
    <Head />
    <Preview>🎵 Music Sheet Updated - {coupleName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={{ ...styles.header, background: `linear-gradient(135deg, #FBBF24 0%, ${BRAND.warningColor} 100%)` }}>
          <Heading style={{ ...styles.logo, fontSize: '24px' }}>🎵 Music Sheet Updated</Heading>
        </Section>
        
        <Section style={styles.body}>
          <Section style={styles.alertWarning}>
            <Text style={{ color: '#92400E', margin: '0' }}>
              <strong>{coupleName}</strong> made changes to their music sheet
            </Text>
          </Section>
          
          <Section style={styles.card}>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Couple:</strong> {coupleName}</Text>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Event Date:</strong> {formatDate(eventDate)}</Text>
            {venue && <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Venue:</strong> {venue}</Text>}
            {coordinatorName && <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Coordinator:</strong> {coordinatorName}</Text>}
          </Section>
          
          <Heading as="h3" style={{ ...styles.heading, fontSize: '18px' }}>Changes Made:</Heading>
          <Text style={styles.text}>
            <strong>{fieldsChangedCount}</strong> field{fieldsChangedCount !== 1 ? 's' : ''} updated
          </Text>
          
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={dashboardLink} style={styles.buttonWarning}>
              View Updated Music Sheet →
            </Link>
          </Section>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Enzym3 Entertainment Coordination System
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 6. UPGRADE ORDER EMAIL (to admin)
// ============================================
interface UpgradeOrderEmailProps {
  coupleName: string
  eventDate: string
  contactEmail: string
  venue?: string
  packageName: string
  emeraldChoice?: string
  paymentStatus: string
  notes?: string
  dashboardLink: string
}

export const UpgradeOrderEmail = ({
  coupleName,
  eventDate,
  contactEmail,
  venue,
  packageName,
  emeraldChoice,
  paymentStatus,
  notes,
  dashboardLink,
}: UpgradeOrderEmailProps) => (
  <Html>
    <Head />
    <Preview>✨ New Upgrade Order - {coupleName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={{ ...styles.header, background: `linear-gradient(135deg, #34D399 0%, ${BRAND.successColor} 100%)` }}>
          <Heading style={{ ...styles.logo, fontSize: '24px' }}>✨ New Upgrade Order</Heading>
        </Section>
        
        <Section style={styles.body}>
          <Section style={styles.alertSuccess}>
            <Text style={{ color: '#065F46', margin: '0' }}>
              <strong>{coupleName}</strong> ordered the <strong>{packageName}</strong> upgrade package
            </Text>
          </Section>
          
          <Section style={styles.card}>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Couple:</strong> {coupleName}</Text>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Event Date:</strong> {formatDate(eventDate)}</Text>
            <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Contact Email:</strong> {contactEmail}</Text>
            {venue && <Text style={{ ...styles.text, margin: '8px 0' }}><strong>Venue:</strong> {venue}</Text>}
          </Section>
          
          <Heading as="h3" style={{ ...styles.heading, fontSize: '18px' }}>Order Details:</Heading>
          <ul style={{ margin: '0 0 24px 0', paddingLeft: '20px', lineHeight: '2' }}>
            <li><strong>Package:</strong> {packageName}</li>
            {emeraldChoice && <li><strong>Emerald Choice:</strong> {emeraldChoice}</li>}
            <li>
              <strong>Payment Status:</strong>{' '}
              <span style={{ 
                fontWeight: '600', 
                color: paymentStatus === 'paid' ? BRAND.successColor : paymentStatus === 'pending' ? BRAND.warningColor : BRAND.mutedColor 
              }}>
                {paymentStatus}
              </span>
            </li>
            {notes && <li><strong>Notes:</strong> {notes}</li>}
          </ul>
          
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Link href={dashboardLink} style={styles.buttonSuccess}>
              View Order in Dashboard →
            </Link>
          </Section>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Enzym3 Entertainment Coordination System
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 7. REMINDER EMAIL (to clients)
// ============================================
interface ReminderEmailProps {
  contactName: string
  messageContent: string
  eventDate?: string
  venue?: string
  notes?: string
  reminderType: string
}

export const ReminderEmail = ({
  contactName,
  messageContent,
  eventDate,
  venue,
  notes,
  reminderType,
}: ReminderEmailProps) => (
  <Html>
    <Head />
    <Preview>Reminder: {reminderType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.logo}>Enzym3 Entertainment</Heading>
          <Text style={styles.tagline}>Event Reminder</Text>
        </Section>
        
        <Section style={styles.body}>
          <Heading style={styles.heading}>Hello {contactName},</Heading>
          
          <Text style={{ ...styles.text, whiteSpace: 'pre-wrap' }}>
            {messageContent}
          </Text>
          
          {(eventDate || venue) && (
            <Section style={styles.alertInfo}>
              <Heading as="h3" style={{ ...styles.heading, fontSize: '16px', margin: '0 0 12px 0', color: BRAND.primaryColor }}>
                Event Details
              </Heading>
              {eventDate && <Text style={{ ...styles.text, margin: '4px 0' }}><strong>Date:</strong> {formatDate(eventDate)}</Text>}
              {venue && <Text style={{ ...styles.text, margin: '4px 0' }}><strong>Venue:</strong> {venue}</Text>}
            </Section>
          )}
          
          {notes && (
            <Section style={styles.alertWarning}>
              <Text style={{ color: '#92400E', margin: '0' }}>
                <strong>Note:</strong> {notes}
              </Text>
            </Section>
          )}
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              You're receiving this because you have an upcoming event with Enzym3 Entertainment.
            </Text>
            <Text style={{ ...styles.footerText, marginTop: '8px' }}>
              © {new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 8. COUPLE MUSIC SHEET CONFIRMATION EMAIL
// ============================================
interface CoupleConfirmationEmailProps {
  coupleName: string
  eventDate: string
  isUpdate: boolean
  ceremonyHtml?: string
  receptionHtml?: string
  mustPlays?: string[]
  doNotPlays?: string[]
  extraSongs?: Array<{ song_name?: string; artist_name?: string; note?: string }>
  groupDances?: Array<{ dance_name?: string }>
  grandEntranceList?: Array<{ name?: string; role?: string; pairing?: string }>
  notes?: string
  dashboardLink: string
}

export const CoupleConfirmationEmail = ({
  coupleName,
  eventDate,
  isUpdate,
  mustPlays,
  doNotPlays,
  extraSongs,
  groupDances,
  grandEntranceList,
  notes,
  dashboardLink,
}: CoupleConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>{isUpdate ? 'Music Sheet Updated' : 'Your Music Sheet Confirmation'} - {coupleName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={{ ...styles.header, background: `linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)` }}>
          <Heading style={styles.logo}>
            {isUpdate ? '🎵 Music Sheet Updated!' : '✨ Thank You!'}
          </Heading>
        </Section>
        
        <Section style={styles.body}>
          <Text style={{ ...styles.text, fontSize: '18px' }}>
            Hi {coupleName}! 👋
          </Text>
          
          <Text style={styles.text}>
            {isUpdate 
              ? `We've received your updated music selections and they look amazing! Below is your complete music sheet for ${formatDate(eventDate)}.`
              : `Thank you so much for submitting your music sheet! We're thrilled to help create the perfect soundtrack for your special day on ${formatDate(eventDate)}. 🎉`
            }
          </Text>
          
          <Section style={{ ...styles.card, borderLeft: '4px solid #8B5CF6' }}>
            {mustPlays && mustPlays.length > 0 && (
              <>
                <Heading as="h3" style={{ ...styles.heading, fontSize: '16px', margin: '0 0 12px 0' }}>⭐ Must-Play Songs</Heading>
                <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px' }}>
                  {mustPlays.map((song, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{song}</li>)}
                </ul>
              </>
            )}
            
            {doNotPlays && doNotPlays.length > 0 && (
              <>
                <Heading as="h3" style={{ ...styles.heading, fontSize: '16px', margin: '0 0 12px 0' }}>🚫 Do Not Play</Heading>
                <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px' }}>
                  {doNotPlays.map((song, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{song}</li>)}
                </ul>
              </>
            )}
            
            {groupDances && groupDances.length > 0 && (
              <>
                <Heading as="h3" style={{ ...styles.heading, fontSize: '16px', margin: '0 0 12px 0' }}>🕺 Group Dances</Heading>
                <ul style={{ margin: '0 0 20px 0', paddingLeft: '20px' }}>
                  {groupDances.map((dance, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{dance.dance_name || 'Untitled'}</li>)}
                </ul>
              </>
            )}
            
            {notes && (
              <>
                <Heading as="h3" style={{ ...styles.heading, fontSize: '16px', margin: '0 0 12px 0' }}>📝 Additional Notes</Heading>
                <Text style={{ ...styles.text, background: BRAND.backgroundColor, padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                  {notes}
                </Text>
              </>
            )}
          </Section>
          
          <Section style={styles.alertWarning}>
            <Text style={{ color: '#92400E', margin: '0 0 12px 0' }}>
              <strong>Need to make changes?</strong> No problem! You can update your music sheet anytime.
            </Text>
            <Link href={dashboardLink} style={{ ...styles.buttonWarning, padding: '10px 20px', fontSize: '14px' }}>
              View Your Music Sheet →
            </Link>
          </Section>
          
          <Text style={styles.text}>
            We'll be in touch soon with any questions. Can't wait to celebrate with you! 🎊
          </Text>
          
          <Text style={{ ...styles.text, margin: '0' }}>
            Best,<br />
            <strong>JJ & The Enzym3 Team</strong>
          </Text>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              This email is a confirmation of your music sheet {isUpdate ? 'update' : 'submission'}. Keep this for your records!
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 9. EVENT NOTIFICATION EMAIL (general)
// ============================================
interface EventNotificationEmailProps {
  coupleName: string
  eventType: string
  eventDate: string
  contactEmail: string
  venue?: string
  coordinatorName?: string
  djName?: string
  packageType?: string
  notes?: string
}

export const EventNotificationEmail = ({
  coupleName,
  eventType,
  eventDate,
  contactEmail,
  venue,
  coordinatorName,
  djName,
  packageType,
  notes,
}: EventNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Event Notification: {coupleName} - {eventType}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.header}>
          <Heading style={styles.logo}>Event Notification</Heading>
        </Section>
        
        <Section style={styles.body}>
          <Heading style={styles.heading}>{coupleName}</Heading>
          
          <Section style={styles.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Event Type:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{eventType}</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Date:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{formatDate(eventDate)}</td>
              </tr>
              <tr style={styles.tableRow}>
                <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Email:</td>
                <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{contactEmail}</td>
              </tr>
              {venue && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Venue:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{venue}</td>
                </tr>
              )}
              {coordinatorName && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Coordinator:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coordinatorName}</td>
                </tr>
              )}
              {djName && (
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Vendor:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{djName}</td>
                </tr>
              )}
              {packageType && (
                <tr>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Package:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{packageType}</td>
                </tr>
              )}
            </table>
          </Section>
          
          {notes && (
            <Section style={styles.alertWarning}>
              <Heading as="h3" style={{ color: '#92400E', margin: '0 0 8px 0', fontSize: '14px' }}>Notes:</Heading>
              <Text style={{ color: '#78350F', margin: '0', lineHeight: '1.5' }}>{notes}</Text>
            </Section>
          )}
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Sent from Enzym3 Entertainment Event Management System
            </Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

// ============================================
// 10. VENDOR ASSIGNMENT EMAIL
// ============================================
interface VendorAssignmentEmailProps {
  vendorName: string
  coupleName: string
  eventType: string
  eventDate: string
  venue?: string
  guestCount?: number
  packageType?: string
  coordinatorName?: string
  brideEmail?: string
  groomEmail?: string
  contactEmail?: string
  contactPhone?: string
  portalLink: string
  dressCode?: string
}

export const VendorAssignmentEmail = ({
  vendorName,
  coupleName,
  eventType,
  eventDate,
  venue,
  guestCount,
  packageType,
  coordinatorName,
  brideEmail,
  groomEmail,
  contactEmail,
  contactPhone,
  portalLink,
  dressCode,
}: VendorAssignmentEmailProps) => {
  const config = getEventConfig(eventType)

  return (
    <Html>
      <Head />
      <Preview>🎧 You've been assigned to {coupleName}'s {config.eventLabel} on {formatDate(eventDate)}</Preview>
       <Body style={vendorStyles.main}>
        <Container style={vendorStyles.container}>
          <Section style={vendorStyles.header}>
            <Img
              src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
              alt="Enzym3 Entertainment"
              width="220"
              style={vendorStyles.logo}
            />
            <Text style={vendorStyles.tagline}>🎧 Vendor Assignment</Text>
          </Section>

          <Section style={styles.body}>
            <Heading style={styles.heading}>You've Been Assigned!</Heading>

            <Text style={styles.text}>
              Hey {vendorName}, you've been assigned to a new event. Here are the details:
            </Text>

            <Section style={styles.card}>
              <Heading as="h3" style={{ ...styles.heading, fontSize: '18px', margin: '0 0 16px 0' }}>
                {config.emoji} Event Details
              </Heading>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Couple:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coupleName}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Event Type:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{eventType}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Date:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{formatDate(eventDate)}</td>
                </tr>
                {venue && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Venue:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{venue}</td>
                  </tr>
                )}
                {guestCount && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Guest Count:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{guestCount}</td>
                  </tr>
                )}
                {packageType && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Package:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{packageType}</td>
                  </tr>
                )}
                {coordinatorName && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Coordinator:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coordinatorName}</td>
                  </tr>
                )}
                {dressCode && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Dress Code:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{dressCode.replace(/-/g, ' ')}</td>
                  </tr>
                )}
              </table>
            </Section>

            <Section style={{ backgroundColor: '#FEE2E2', borderRadius: '8px', padding: '20px', margin: '24px 0', border: '1px solid #991B1B' }}>
              <Heading as="h3" style={{ color: '#991B1B', margin: '0 0 8px 0', fontSize: '16px' }}>
                ⚡ Action Required
              </Heading>
              <Text style={{ color: '#7F1D1D', margin: '0', lineHeight: '1.6', fontSize: '15px', fontWeight: '600' }}>
                Please reach out to the couple within 24 hours to introduce yourself and discuss their event.
              </Text>
            </Section>

            <Section style={styles.card}>
              <Heading as="h3" style={{ ...styles.heading, fontSize: '18px', margin: '0 0 16px 0' }}>
                📞 Couple Contact Info
              </Heading>
              {brideEmail && (
                <Text style={{ ...styles.text, margin: '8px 0' }}>
                  💌 <strong>Bride:</strong>{' '}
                  <Link href={`mailto:${brideEmail}`} style={{ color: BRAND.vendorPrimary }}>{brideEmail}</Link>
                </Text>
              )}
              {groomEmail && (
                <Text style={{ ...styles.text, margin: '8px 0' }}>
                  💌 <strong>Groom:</strong>{' '}
                  <Link href={`mailto:${groomEmail}`} style={{ color: BRAND.vendorPrimary }}>{groomEmail}</Link>
                </Text>
              )}
              {contactEmail && !brideEmail && !groomEmail && (
                <Text style={{ ...styles.text, margin: '8px 0' }}>
                  💌 <strong>Contact:</strong>{' '}
                  <Link href={`mailto:${contactEmail}`} style={{ color: BRAND.vendorPrimary }}>{contactEmail}</Link>
                </Text>
              )}
              {contactPhone && (
                <Text style={{ ...styles.text, margin: '8px 0' }}>
                  📱 <strong>Phone:</strong>{' '}
                  <Link href={`tel:${contactPhone}`} style={{ color: BRAND.vendorPrimary }}>{contactPhone}</Link>
                </Text>
              )}
            </Section>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Link href={portalLink} style={vendorStyles.button}>
                View in Vendor Portal
              </Link>
            </Section>

            <Hr style={styles.divider} />

            <Text style={styles.text}>
              Let's make this event unforgettable! 🎶
            </Text>
            <Text style={{ ...styles.text, margin: '0' }}>
              — <strong>Enzym3 Entertainment</strong>
            </Text>

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                Questions? Contact admin at office@enzym3entertainment.vip
              </Text>
              <Text style={{ ...styles.footerText, marginTop: '8px' }}>
                © {new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ============================================
// 11. VENDOR MEETING EMAIL
// ============================================
interface VendorMeetingEmailProps {
  vendorName: string
  coupleName: string
  meetingType: string
  bookingDate: string
  bookingTime: string
  meetingFormat?: string
  meetingLink?: string
  action: 'created' | 'updated' | 'cancelled'
  portalLink: string
}

function getMeetingActionConfig(action: string) {
  switch (action) {
    case 'cancelled':
      return { emoji: '❌', title: 'Meeting Cancelled', color: BRAND.errorColor, previewPrefix: 'Meeting Cancelled' }
    case 'updated':
      return { emoji: '🔄', title: 'Meeting Updated', color: BRAND.warningColor, previewPrefix: 'Meeting Updated' }
    default:
      return { emoji: '📅', title: 'New Meeting Scheduled', color: BRAND.vendorPrimary, previewPrefix: 'New Meeting' }
  }
}

function formatMeetingType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export const VendorMeetingEmail = ({
  vendorName,
  coupleName,
  meetingType,
  bookingDate,
  bookingTime,
  meetingFormat,
  meetingLink,
  action,
  portalLink,
}: VendorMeetingEmailProps) => {
  const config = getMeetingActionConfig(action)
  const isOnline = meetingFormat === 'online' || meetingFormat === 'video'
  
  return (
    <Html>
      <Head />
      <Preview>{config.previewPrefix} – {coupleName} {formatMeetingType(meetingType)} on {bookingDate}</Preview>
      <Body style={vendorStyles.main}>
        <Container style={vendorStyles.container}>
          <Section style={vendorStyles.header}>
            <Img
              src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
              alt="Enzym3 Entertainment"
              width="220"
              style={vendorStyles.logo}
            />
            <Text style={vendorStyles.tagline}>{config.emoji} {config.title}</Text>
          </Section>
          
          <Section style={styles.body}>
            <Heading style={styles.heading}>
              {action === 'cancelled' ? 'Meeting Cancelled' : action === 'updated' ? 'Meeting Updated' : 'You Have a New Meeting!'}
            </Heading>
            
            <Text style={styles.text}>
              Hey {vendorName},{' '}
              {action === 'cancelled'
                ? `a meeting for ${coupleName} has been cancelled.`
                : action === 'updated'
                ? `a meeting for ${coupleName} has been updated. Please review the new details below.`
                : `a new meeting has been scheduled for ${coupleName}. Here are the details:`}
            </Text>
            
            <Section style={styles.card}>
              <Heading as="h3" style={{ ...styles.heading, fontSize: '18px', margin: '0 0 16px 0' }}>
                Meeting Details
              </Heading>
              <Text style={{ ...styles.text, margin: '8px 0' }}>
                📋 <strong>Type:</strong> {formatMeetingType(meetingType)}
              </Text>
              <Text style={{ ...styles.text, margin: '8px 0' }}>
                👫 <strong>Couple:</strong> {coupleName}
              </Text>
              <Text style={{ ...styles.text, margin: '8px 0', color: action === 'cancelled' ? BRAND.errorColor : BRAND.darkColor }}>
                📅 <strong>Date:</strong> {formatDate(bookingDate)}
              </Text>
              <Text style={{ ...styles.text, margin: '8px 0' }}>
                🕐 <strong>Time:</strong> {bookingTime}
              </Text>
              <Text style={{ ...styles.text, margin: '8px 0' }}>
                {isOnline ? '💻' : '🏢'} <strong>Format:</strong> {isOnline ? 'Online / Video Call' : 'In-Person'}
              </Text>
            </Section>
            
            {meetingLink && action !== 'cancelled' && (
              <Section style={{ textAlign: 'center', margin: '24px 0' }}>
                <Link href={meetingLink} style={vendorStyles.button}>
                  Join Meeting
                </Link>
              </Section>
            )}
            
            {action === 'cancelled' && (
              <Section style={{ ...styles.alertWarning, borderLeftColor: BRAND.errorColor, background: '#FEE2E2' }}>
                <Text style={{ color: '#991B1B', margin: '0', fontSize: '14px' }}>
                  This meeting has been cancelled. No further action is needed for this meeting.
                </Text>
              </Section>
            )}
            
            {action !== 'cancelled' && (
              <Section style={{ textAlign: 'center', margin: '24px 0' }}>
                <Link href={portalLink} style={{ ...vendorStyles.button, background: BRAND.vendorAccent }}>
                  View in Vendor Portal
                </Link>
              </Section>
            )}
            
            <Hr style={styles.divider} />
            
            <Text style={{ ...styles.text, margin: '0' }}>
              — <strong>Enzym3 Entertainment</strong>
            </Text>
            
            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                Questions? Contact admin at office@enzym3entertainment.vip
              </Text>
              <Text style={{ ...styles.footerText, marginTop: '8px' }}>
                © {new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ============================================
// 12. VENDOR EVENT REMINDER EMAIL (pre-event nudges: 14 / 7 / 3 days out)
// ============================================
interface VendorEventReminderEmailProps {
  vendorName: string
  coupleName: string
  eventType: string
  eventDate: string
  milestone: '14_day' | '7_day' | '3_day'
  venue?: string
  guestCount?: number
  packageType?: string
  coordinatorName?: string
  brideEmail?: string
  groomEmail?: string
  contactEmail?: string
  contactPhone?: string
  portalLink: string
  dressCode?: string
}

function getReminderConfig(milestone: '14_day' | '7_day' | '3_day') {
  switch (milestone) {
    case '14_day':
      return {
        emoji: '📅',
        tagline: 'Heads up — 2 weeks out',
        headline: "Heads up — your event is in 2 weeks",
        intro: "Just a friendly heads up that you've got an event coming up in about two weeks. Here are the details so you can start planning your day:",
        urgencyBg: '#EFF6FF',
        urgencyBorder: '#1E40AF',
        urgencyTitleColor: '#1E3A8A',
        urgencyTextColor: '#1E40AF',
        urgencyTitle: '📋 Get Prepared',
        urgencyMessage: 'Review the event details, confirm the timeline with the couple, and make sure your gear is ready.',
      }
    case '7_day':
      return {
        emoji: '⏰',
        tagline: '1 week countdown',
        headline: '1 week to go!',
        intro: "You've got an event coming up in just one week. Now's the time to lock in the final details:",
        urgencyBg: '#FEF3C7',
        urgencyBorder: '#B45309',
        urgencyTitleColor: '#78350F',
        urgencyTextColor: '#92400E',
        urgencyTitle: '⚡ Confirm Final Details',
        urgencyMessage: 'Reach out to the couple this week to confirm timing, music must-plays, and any last-minute requests.',
      }
    case '3_day':
      return {
        emoji: '🚨',
        tagline: 'Final reminder — 3 days out',
        headline: 'Final reminder — 3 days out!',
        intro: "Your event is just 3 days away. Here's everything you need to be ready:",
        urgencyBg: '#FEE2E2',
        urgencyBorder: '#991B1B',
        urgencyTitleColor: '#7F1D1D',
        urgencyTextColor: '#991B1B',
        urgencyTitle: '🚨 Final Prep',
        urgencyMessage: 'Pack and check all gear today. Confirm arrival time and parking with the venue. We are counting on you!',
      }
  }
}

export const VendorEventReminderEmail = ({
  vendorName,
  coupleName,
  eventType,
  eventDate,
  milestone,
  venue,
  guestCount,
  packageType,
  coordinatorName,
  brideEmail,
  groomEmail,
  contactEmail,
  contactPhone,
  portalLink,
  dressCode,
}: VendorEventReminderEmailProps) => {
  const config = getEventConfig(eventType)
  const reminder = getReminderConfig(milestone)

  return (
    <Html>
      <Head />
      <Preview>{reminder.emoji} {reminder.tagline}: {coupleName}'s {config.eventLabel} on {formatDate(eventDate)}</Preview>
      <Body style={vendorStyles.main}>
        <Container style={vendorStyles.container}>
          <Section style={vendorStyles.header}>
            <Img
              src="https://e3ecoordination.lovable.app/lovable-uploads/logo_transparent_background-3.png"
              alt="Enzym3 Entertainment"
              width="220"
              style={vendorStyles.logo}
            />
            <Text style={vendorStyles.tagline}>{reminder.emoji} {reminder.tagline}</Text>
          </Section>

          <Section style={styles.body}>
            <Heading style={styles.heading}>{reminder.headline}</Heading>

            <Text style={styles.text}>
              Hey {vendorName}, {reminder.intro}
            </Text>

            <Section style={styles.card}>
              <Heading as="h3" style={{ ...styles.heading, fontSize: '18px', margin: '0 0 16px 0' }}>
                {config.emoji} Event Details
              </Heading>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Couple:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coupleName}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Event Type:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{eventType}</td>
                </tr>
                <tr style={styles.tableRow}>
                  <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Date:</td>
                  <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{formatDate(eventDate)}</td>
                </tr>
                {venue && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Venue:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{venue}</td>
                  </tr>
                )}
                {guestCount && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Guest Count:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{guestCount}</td>
                  </tr>
                )}
                {packageType && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Package:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{packageType}</td>
                  </tr>
                )}
                {coordinatorName && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Coordinator:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue }}>{coordinatorName}</td>
                  </tr>
                )}
                {dressCode && (
                  <tr style={styles.tableRow}>
                    <td style={{ ...styles.tableCell, ...styles.tableCellLabel }}>Dress Code:</td>
                    <td style={{ ...styles.tableCell, ...styles.tableCellValue, textTransform: 'capitalize' }}>{dressCode.replace(/-/g, ' ')}</td>
                  </tr>
                )}
              </table>
            </Section>

            <Section style={{ backgroundColor: reminder.urgencyBg, borderRadius: '8px', padding: '20px', margin: '24px 0', border: `1px solid ${reminder.urgencyBorder}` }}>
              <Heading as="h3" style={{ color: reminder.urgencyTitleColor, margin: '0 0 8px 0', fontSize: '16px' }}>
                {reminder.urgencyTitle}
              </Heading>
              <Text style={{ color: reminder.urgencyTextColor, margin: '0', lineHeight: '1.6', fontSize: '15px', fontWeight: '600' }}>
                {reminder.urgencyMessage}
              </Text>
            </Section>

            {(brideEmail || groomEmail || contactEmail || contactPhone) && (
              <Section style={styles.card}>
                <Heading as="h3" style={{ ...styles.heading, fontSize: '18px', margin: '0 0 16px 0' }}>
                  📞 Couple Contact Info
                </Heading>
                {brideEmail && (
                  <Text style={{ ...styles.text, margin: '8px 0' }}>
                    💌 <strong>Bride:</strong>{' '}
                    <Link href={`mailto:${brideEmail}`} style={{ color: BRAND.vendorPrimary }}>{brideEmail}</Link>
                  </Text>
                )}
                {groomEmail && (
                  <Text style={{ ...styles.text, margin: '8px 0' }}>
                    💌 <strong>Groom:</strong>{' '}
                    <Link href={`mailto:${groomEmail}`} style={{ color: BRAND.vendorPrimary }}>{groomEmail}</Link>
                  </Text>
                )}
                {contactEmail && !brideEmail && !groomEmail && (
                  <Text style={{ ...styles.text, margin: '8px 0' }}>
                    💌 <strong>Contact:</strong>{' '}
                    <Link href={`mailto:${contactEmail}`} style={{ color: BRAND.vendorPrimary }}>{contactEmail}</Link>
                  </Text>
                )}
                {contactPhone && (
                  <Text style={{ ...styles.text, margin: '8px 0' }}>
                    📱 <strong>Phone:</strong>{' '}
                    <Link href={`tel:${contactPhone}`} style={{ color: BRAND.vendorPrimary }}>{contactPhone}</Link>
                  </Text>
                )}
              </Section>
            )}

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Link href={portalLink} style={vendorStyles.button}>
                Open Vendor Portal
              </Link>
            </Section>

            <Hr style={styles.divider} />

            <Text style={styles.text}>
              Thanks for being part of the team — let's make this one great. 🎶
            </Text>
            <Text style={{ ...styles.text, margin: '0' }}>
              — <strong>Enzym3 Entertainment</strong>
            </Text>

            <Section style={styles.footer}>
              <Text style={styles.footerText}>
                Questions? Contact admin at office@enzym3entertainment.vip
              </Text>
              <Text style={{ ...styles.footerText, marginTop: '8px' }}>
                © {new Date().getFullYear()} Enzym3 Entertainment. All rights reserved.
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default {
  WelcomeEmail,
  VendorInviteEmail,
  AdminNotificationEmail,
  MusicSheetCreatedEmail,
  MusicSheetUpdatedEmail,
  UpgradeOrderEmail,
  ReminderEmail,
  CoupleConfirmationEmail,
  EventNotificationEmail,
  VendorAssignmentEmail,
  VendorMeetingEmail,
  VendorEventReminderEmail,
}
