import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from "https://esm.sh/@react-email/components@0.0.12";
import * as React from "https://esm.sh/react@18.3.1";

const brandColors = {
  header: "#6ba3be",
  headerDark: "#5a92ad",
  accent: "#6ba3be",
  white: "#ffffff",
  background: "#f5f5f5",
  textPrimary: "#1f2937",
  textSecondary: "#374151",
  textMuted: "#6b7280",
  border: "#e5e7eb",
};

const logoUrl =
  "https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1";

interface VibeSheetEmailProps {
  coupleName: string;
  eventDate: string;
  vibeSheetData: any;
  personalMessage?: string;
}

export const VibeSheetEmail = ({
  coupleName,
  eventDate,
  vibeSheetData,
  personalMessage,
}: VibeSheetEmailProps) => (
  <Html>
    <Head />
    <Preview>Wedding Vibe Sheet for {coupleName}</Preview>
    <Body style={main}>
      <Section style={header}>
        <Img src={logoUrl} alt="Enzym3 Entertainment" width="180" style={logo} />
      </Section>

      <Container style={container}>
        <Heading style={h1}>Wedding Vibe Sheet</Heading>

        <Section style={headerSection}>
          <Text style={headerText}>
            <strong>{coupleName}</strong>
          </Text>
          <Text style={dateText}>{eventDate}</Text>
        </Section>

        {personalMessage && (
          <Section style={messageSection}>
            <Text style={messageText}>{personalMessage}</Text>
          </Section>
        )}

        <Hr style={hr} />

        <Section style={section}>
          <Heading style={h2}>Ceremony Details</Heading>
          {vibeSheetData.arrivalTime && (
            <Text style={detailText}>
              <strong>Invite Time:</strong> {vibeSheetData.arrivalTime}
            </Text>
          )}
          {vibeSheetData.ceremonyTime && (
            <Text style={detailText}>
              <strong>Ceremony Time:</strong> {vibeSheetData.ceremonyTime}
            </Text>
          )}
          {vibeSheetData.cocktailVibe && (
            <Text style={detailText}>
              <strong>Cocktail Hour Vibe:</strong> {vibeSheetData.cocktailVibe}
            </Text>
          )}
        </Section>

        {vibeSheetData.ceremonyEvents && vibeSheetData.ceremonyEvents.length > 0 && (
          <Section style={section}>
            <Heading style={h2}>Ceremony Timeline</Heading>
            {vibeSheetData.ceremonyEvents.map((event: any, idx: number) => (
              <Text key={idx} style={detailText}>
                <strong>{event.eventName}:</strong> {event.song} by {event.artist}
              </Text>
            ))}
          </Section>
        )}

        <Hr style={hr} />

        <Section style={section}>
          <Heading style={h2}>Reception Timeline</Heading>
          {vibeSheetData.receptionEvents && vibeSheetData.receptionEvents.length > 0 ? (
            vibeSheetData.receptionEvents.map((event: any, idx: number) => (
              <Text key={idx} style={detailText}>
                <strong>
                  {event.time} - {event.eventName}:
                </strong>{" "}
                {event.song && event.artist
                  ? `${event.song} by ${event.artist}`
                  : event.description || "TBD"}
              </Text>
            ))
          ) : (
            <Text style={detailText}>No reception timeline provided yet.</Text>
          )}
        </Section>

        <Hr style={hr} />

        <Section style={section}>
          <Heading style={h2}>Music Preferences</Heading>
          {vibeSheetData.favoriteStyles && (
            <Text style={detailText}>
              <strong>Favorite Styles:</strong> {vibeSheetData.favoriteStyles}
            </Text>
          )}
          {vibeSheetData.doNotPlay && (
            <Text style={detailText}>
              <strong>Do Not Play:</strong> {vibeSheetData.doNotPlay}
            </Text>
          )}
        </Section>

        {vibeSheetData.groupDances && vibeSheetData.groupDances.length > 0 && (
          <Section style={section}>
            <Heading style={h2}>Group Dances</Heading>
            {vibeSheetData.groupDances.map((dance: any, idx: number) => (
              <Text key={idx} style={detailText}>
                • {dance.song} by {dance.artist}
              </Text>
            ))}
          </Section>
        )}

        {vibeSheetData.additionalSongs && vibeSheetData.additionalSongs.length > 0 && (
          <Section style={section}>
            <Heading style={h2}>Additional Song Requests</Heading>
            {vibeSheetData.additionalSongs.map((song: any, idx: number) => (
              <Text key={idx} style={detailText}>
                • {song.song} by {song.artist}
              </Text>
            ))}
          </Section>
        )}

        {vibeSheetData.grandIntro && (
          <Section style={section}>
            <Heading style={h2}>Grand Introduction</Heading>
            <Text style={detailText}>
              <strong>Intro Style:</strong> {vibeSheetData.grandIntro}
            </Text>
            {vibeSheetData.introSong && vibeSheetData.introArtist && (
              <Text style={detailText}>
                <strong>Song:</strong> {vibeSheetData.introSong} by{" "}
                {vibeSheetData.introArtist}
              </Text>
            )}
          </Section>
        )}

        <Hr style={hr} />

        <Section style={footerSection}>
          <Text style={footerText}>
            This vibe sheet was submitted via the wedding portal.
          </Text>
          <Text style={footerText}>PDF attachment included with complete details.</Text>
          <Text style={footerLink}>
            Questions?{" "}
            <a href="mailto:booking@enzym3.com" style={{ color: brandColors.accent }}>
              booking@enzym3.com
            </a>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default VibeSheetEmail;

const main = {
  backgroundColor: brandColors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const header = {
  backgroundColor: brandColors.header,
  padding: "30px 20px",
  textAlign: "center" as const,
};

const logo = { margin: "0 auto" };

const container = {
  backgroundColor: brandColors.white,
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
  borderRadius: "0 0 12px 12px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
};

const h1 = {
  color: brandColors.textPrimary,
  fontSize: "32px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0 48px",
  textAlign: "center" as const,
};

const h2 = {
  color: brandColors.accent,
  fontSize: "20px",
  fontWeight: "bold",
  margin: "16px 0 12px",
  borderLeft: `4px solid ${brandColors.accent}`,
  paddingLeft: "12px",
};

const headerSection = {
  padding: "0 48px",
  textAlign: "center" as const,
  marginBottom: "32px",
};

const headerText = { color: brandColors.textPrimary, fontSize: "24px", margin: "8px 0" };

const dateText = { color: brandColors.textMuted, fontSize: "16px", margin: "8px 0" };

const section = { padding: "0 48px", marginBottom: "24px" };

const detailText = {
  color: brandColors.textSecondary,
  fontSize: "14px",
  lineHeight: "24px",
  margin: "8px 0",
};

const messageSection = {
  padding: "16px 48px",
  backgroundColor: "#e8f4f8",
  margin: "0 24px 24px",
  borderRadius: "8px",
  borderLeft: `4px solid ${brandColors.accent}`,
};

const messageText = {
  color: brandColors.textPrimary,
  fontSize: "15px",
  lineHeight: "24px",
  fontStyle: "italic" as const,
};

const hr = { borderColor: brandColors.border, margin: "32px 48px" };

const footerSection = {
  padding: "0 48px",
  marginTop: "32px",
  textAlign: "center" as const,
};

const footerText = {
  color: brandColors.textMuted,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "4px 0",
};

const footerLink = {
  color: brandColors.textMuted,
  fontSize: "12px",
  lineHeight: "20px",
  margin: "12px 0 4px 0",
};
