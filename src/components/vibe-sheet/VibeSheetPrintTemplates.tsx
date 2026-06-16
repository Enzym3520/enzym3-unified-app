import { capitalizeWords } from "@/lib/utils";
import { parseLocalDate } from "@/lib/formatters";
import { getEventLabel, getPortalDisplayName } from "@/lib/eventUtils";
import { CeremonyTimelineEvent } from "@/components/CeremonyTimeline";
import { TimelineEvent } from "@/components/ReceptionTimeline";
import { QuinceTimelineEvent } from "@/components/QuinceTimeline";
import { AgendaItem } from "@/components/EventAgenda";
import { Announcement } from "@/components/AnnouncementsSection";

interface PrintTemplateProps {
  wedding: any;
  eventType: string;
  activeTabValue: string;
  vibeSheet: any;
  ceremony: any;
  ceremonyEvents: CeremonyTimelineEvent[];
  receptionEvents: TimelineEvent[];
  quinceReceptionEvents: QuinceTimelineEvent[];
  agendaItems: AgendaItem[];
  announcements: Announcement[];
  preferences: any;
  groupDances: any;
  additionalSongs: any[];
  songRequests: string;
  playlistLinks: any[];
  toasts: any[];
  grandIntro: any;
}

const HEADER_STYLE = { fontSize: '20px', fontWeight: 'bold' as const, color: '#6ba3be', marginBottom: '15px', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' };
const CARD_STYLE = { margin: '10px 0', padding: '8px', backgroundColor: '#f9fafb', borderLeft: '3px solid #6ba3be' };

const BrandedHeader = () => (
  <div style={{ backgroundColor: '#6ba3be', padding: '30px 20px', textAlign: 'center' as const }}>
    <img
      src="https://ytembomoyhuwdtrzlwbi.supabase.co/storage/v1/object/public/email-assets/logo-blue.png?v=1"
      alt="Enzym3 Entertainment"
      style={{ width: '180px', margin: '0 auto', display: 'block' }}
      crossOrigin="anonymous"
    />
  </div>
);

const PrintFooter = ({ submittedAt }: { submittedAt?: string | null }) => (
  <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #e5e7eb', textAlign: 'center' as const }}>
    <p style={{ fontSize: '13px', color: '#6ba3be', fontWeight: 'bold', margin: '5px 0' }}>Enzym3 Entertainment</p>
    <p style={{ fontSize: '11px', color: '#9ca3af', margin: '3px 0' }}>enzym3entertainment.vip</p>
    {submittedAt && (
      <p style={{ fontSize: '11px', color: '#9ca3af', margin: '5px 0' }}>
        Submitted: {new Date(submittedAt).toLocaleDateString()}
      </p>
    )}
  </div>
);

const DanceList = ({ groupDances }: { groupDances: any }) => {
  const dances = [
    ['macarena', 'Macarena'], ['chicken_dance', 'Chicken Dance'], ['electric_slide', 'Electric Slide'],
    ['conga_line', 'Conga Line'], ['cotton_eyed_joe', 'Cotton-Eyed Joe'], ['cha_cha_slide', 'Cha Cha Slide'],
    ['ymca', 'YMCA'], ['cupid_shuffle', 'Cupid Shuffle'], ['wobble', 'Wobble']
  ];
  return (
    <div style={{ marginLeft: '15px' }}>
      {dances.map(([key, label]) => groupDances[key] && (
        <p key={key} style={{ margin: '4px 0', fontSize: '14px' }}>✓ {label}</p>
      ))}
      {groupDances.other && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Other:</strong> {groupDances.other}</p>}
    </div>
  );
};

const NamesLine = ({ label, arr }: { label: string; arr: string[] | undefined }) => {
  const names = (arr || []).filter(Boolean);
  if (!names.length) return null;
  return <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>{label}:</strong> {names.join(', ')}</p>;
};

/** Full print template (all sections) */
export const FullPrintTemplate = (props: PrintTemplateProps) => {
  const { wedding, eventType, vibeSheet, ceremony, ceremonyEvents, receptionEvents, quinceReceptionEvents, agendaItems, announcements, preferences, groupDances, additionalSongs, songRequests, playlistLinks, toasts, grandIntro } = props;

  return (
    <div id="pdf-template" style={{ display: 'none', position: 'absolute', left: '0', top: '0', width: '210mm', background: 'white' }}>
      <BrandedHeader />
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#1f2937' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #6ba3be', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 10px 0' }}>
            {getEventLabel(wedding?.event_type)} Vibe Sheet
          </h1>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#6ba3be', margin: '5px 0' }}>
            {capitalizeWords(getPortalDisplayName(wedding?.event_type, wedding.couple_name, wedding?.primary_contact_name))}
          </p>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: '5px 0' }}>
            {parseLocalDate(wedding.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Ceremony — Wedding */}
        {eventType === 'wedding' && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={HEADER_STYLE}>Ceremony Details</h2>
              {ceremony.arrival_time && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Invite Time:</strong> {ceremony.arrival_time}</p>}
              {ceremony.ceremony_time && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Ceremony Time:</strong> {ceremony.ceremony_time}</p>}
              {ceremony.cocktail_hour?.music_info && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Cocktail Hour Music:</strong> {ceremony.cocktail_hour.music_info}</p>}
            </div>
            {ceremonyEvents.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Ceremony Music</h2>
                <div style={{ marginLeft: '15px' }}>
                  {ceremonyEvents.map((event, idx) => event.song && (
                    <div key={idx} style={CARD_STYLE}>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{event.event_name}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{event.song} {event.artist && `by ${event.artist}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {receptionEvents.length > 0 && (
              <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
                <h2 style={HEADER_STYLE}>Reception Timeline</h2>
                <div style={{ marginLeft: '15px' }}>
                  {receptionEvents.map((event, idx) => (
                    <div key={idx} style={CARD_STYLE}>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{event.time && `[${event.time}] `}{event.event_name}</p>
                      {event.song && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{event.song} {event.artist && `by ${event.artist}`}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Quince reception */}
        {eventType === 'quince' && quinceReceptionEvents.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Reception Timeline</h2>
            <div style={{ marginLeft: '15px' }}>
              {quinceReceptionEvents.map((event, idx) => (
                <div key={idx} style={CARD_STYLE}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{event.event_name}</p>
                  {event.song && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{event.song} {event.artist && `by ${event.artist}`}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event agenda — party types */}
        {eventType !== 'wedding' && eventType !== 'quince' && agendaItems.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Event Agenda</h2>
            <div style={{ marginLeft: '15px' }}>
              {agendaItems.map((item, idx) => (
                <div key={idx} style={CARD_STYLE}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{item.time && `[${item.time}] `}{item.event_name}</p>
                  {item.notes && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{item.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferences */}
        {(preferences.favorite_style || preferences.second_favorite_style || preferences.do_not_play) && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Music Preferences</h2>
            {preferences.favorite_style && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Favorite Style:</strong> {preferences.favorite_style}</p>}
            {preferences.second_favorite_style && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Second Favorite:</strong> {preferences.second_favorite_style}</p>}
            {preferences.do_not_play && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Do Not Play:</strong> {preferences.do_not_play}</p>}
          </div>
        )}

        {/* Group dances */}
        {Object.keys(groupDances).some(k => groupDances[k]) && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Group / Line Dances</h2>
            <DanceList groupDances={groupDances} />
          </div>
        )}

        {/* Song requests */}
        {songRequests && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Song Requests</h2>
            <p style={{ margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{songRequests}</p>
          </div>
        )}

        {/* Playlist links */}
        {playlistLinks.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Playlist Links</h2>
            <div style={{ marginLeft: '15px' }}>
              {playlistLinks.map((link, idx) => <p key={idx} style={{ margin: '6px 0', fontSize: '14px' }}>• {link.label || 'Playlist'}: {link.url}</p>)}
            </div>
          </div>
        )}

        {/* Additional songs */}
        {additionalSongs.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Additional Song Requests</h2>
            <div style={{ marginLeft: '15px' }}>
              {additionalSongs.map((song, idx) => <p key={idx} style={{ margin: '6px 0', fontSize: '14px' }}>• {song.song || 'Untitled'} {song.artist && `by ${song.artist}`}</p>)}
            </div>
          </div>
        )}

        {/* Toasts */}
        {toasts.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Toasts</h2>
            <div style={{ marginLeft: '15px' }}>
              {toasts.map((t, idx) => (
                <div key={idx} style={CARD_STYLE}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{t.name || `Toast #${idx + 1}`}{t.time ? ` — ${t.time}` : ''}</p>
                  {t.notes && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Notes: {t.notes}</p>}
                  {t.song && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Song after: {t.song}{t.artist ? ` by ${t.artist}` : ''}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grand intro — wedding */}
        {eventType === 'wedding' && (grandIntro.announcement_line || grandIntro.bridesmaids?.some((b: string) => b) || grandIntro.groomsmen?.some((g: string) => g)) && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Grand Introduction</h2>
            <NamesLine label="Grandparents (Bride)" arr={grandIntro.grandparents_bride} />
            <NamesLine label="Grandparents (Groom)" arr={grandIntro.grandparents_groom} />
            <NamesLine label="Parents (Bride)" arr={grandIntro.parents_bride} />
            <NamesLine label="Parents (Groom)" arr={grandIntro.parents_groom} />
            <NamesLine label="Bridesmaids" arr={grandIntro.bridesmaids} />
            <NamesLine label="Groomsmen" arr={grandIntro.groomsmen} />
            {grandIntro.announcement_line && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Introduced As:</strong> {grandIntro.announcement_line}</p>}
          </div>
        )}

        {/* Court intro — quince */}
        {eventType === 'quince' && (grandIntro.chambelan_de_honor || grandIntro.damas?.some((d: string) => d) || grandIntro.chambelanes?.some((c: string) => c) || grandIntro.padrinos?.some((p: string) => p)) && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Court Introduction</h2>
            {grandIntro.chambelan_de_honor && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Chambelán de Honor:</strong> {grandIntro.chambelan_de_honor}</p>}
            <NamesLine label="Padrinos" arr={grandIntro.padrinos} />
            <NamesLine label="Damas" arr={grandIntro.damas} />
            <NamesLine label="Chambelanes" arr={grandIntro.chambelanes} />
            {grandIntro.announcement_line && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Introduced As:</strong> {grandIntro.announcement_line}</p>}
          </div>
        )}

        {/* Announcements — party types */}
        {eventType !== 'wedding' && eventType !== 'quince' && announcements.length > 0 && (
          <div style={{ marginBottom: '30px', pageBreakInside: 'avoid' }}>
            <h2 style={HEADER_STYLE}>Announcements & Intros</h2>
            <div style={{ marginLeft: '15px' }}>
              {announcements.map((ann, idx) => (
                <div key={idx} style={CARD_STYLE}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{ann.title || `Announcement #${idx + 1}`}{ann.timing ? ` — ${ann.timing}` : ''}</p>
                  {ann.content && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{ann.content}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <PrintFooter submittedAt={vibeSheet?.submitted_at} />
      </div>
    </div>
  );
};

/** Current-tab print template */
export const CurrentTabPrintTemplate = (props: PrintTemplateProps) => {
  const { wedding, eventType, activeTabValue, ceremony, ceremonyEvents, receptionEvents, quinceReceptionEvents, preferences, groupDances, additionalSongs, songRequests, playlistLinks, toasts, grandIntro, announcements } = props;

  const tabLabel = activeTabValue === 'ceremony' ? 'Ceremony' :
    activeTabValue === 'reception' ? 'Reception Timeline' :
    activeTabValue === 'music' ? 'Music Preferences' :
    activeTabValue === 'toasts' ? 'Toasts & Speeches' :
    activeTabValue === 'songs' ? 'Song Requests & Playlists' :
    activeTabValue === 'grand-intro' ? 'Grand Introduction' :
    activeTabValue === 'announcements' ? 'Announcements' :
    activeTabValue;

  return (
    <div id="pdf-template-current" style={{ display: 'none', position: 'absolute', left: 0, top: 0, width: '210mm', background: 'white' }}>
      <BrandedHeader />
      <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', color: '#1f2937' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '3px solid #6ba3be', paddingBottom: '20px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 8px 0' }}>
            {getEventLabel(wedding?.event_type)} Vibe Sheet
          </h1>
          <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#6ba3be', margin: '4px 0' }}>
            {capitalizeWords(getPortalDisplayName(wedding?.event_type, wedding.couple_name, wedding?.primary_contact_name))}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0' }}>
            {parseLocalDate(wedding.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p style={{ fontSize: '13px', color: '#6ba3be', fontWeight: 'bold', margin: '10px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {tabLabel}
          </p>
        </div>

        {/* Ceremony tab */}
        {activeTabValue === 'ceremony' && (
          <>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={HEADER_STYLE}>Ceremony Details</h2>
              {ceremony.arrival_time && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Invite Time:</strong> {ceremony.arrival_time}</p>}
              {ceremony.ceremony_time && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Ceremony Time:</strong> {ceremony.ceremony_time}</p>}
              {ceremony.cocktail_hour?.music_info && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Cocktail Hour Music:</strong> {ceremony.cocktail_hour.music_info}</p>}
              {!ceremony.arrival_time && !ceremony.ceremony_time && !ceremony.cocktail_hour?.music_info && (
                <p style={{ margin: '8px 0', fontSize: '14px', color: '#9ca3af' }}>No ceremony details added yet.</p>
              )}
            </div>
            {ceremonyEvents.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Ceremony Music</h2>
                <div style={{ marginLeft: '15px' }}>
                  {ceremonyEvents.map((event, idx) => (
                    <div key={idx} style={CARD_STYLE}>
                      <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{event.event_name}</p>
                      <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
                        {event.song ? `${event.song}${event.artist ? ` by ${event.artist}` : ''}` : <span style={{ color: '#9ca3af' }}>No song assigned</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Reception tab */}
        {activeTabValue === 'reception' && eventType === 'wedding' && receptionEvents.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={HEADER_STYLE}>Reception Timeline</h2>
            <div style={{ marginLeft: '15px' }}>
              {receptionEvents.map((event, idx) => (
                <div key={idx} style={CARD_STYLE}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{event.time && `[${event.time}] `}{event.event_name}</p>
                  {event.song && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{event.song}{event.artist ? ` by ${event.artist}` : ''}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTabValue === 'reception' && eventType === 'quince' && quinceReceptionEvents.length > 0 && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={HEADER_STYLE}>Reception Timeline</h2>
            <div style={{ marginLeft: '15px' }}>
              {quinceReceptionEvents.map((event, idx) => (
                <div key={idx} style={CARD_STYLE}>
                  <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{event.event_name}</p>
                  {event.song && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{event.song}{event.artist ? ` by ${event.artist}` : ''}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Music tab */}
        {activeTabValue === 'music' && (
          <>
            {(preferences.favorite_style || preferences.second_favorite_style || preferences.do_not_play) && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Music Preferences</h2>
                {preferences.favorite_style && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Favorite Style:</strong> {preferences.favorite_style}</p>}
                {preferences.second_favorite_style && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Second Favorite:</strong> {preferences.second_favorite_style}</p>}
                {preferences.do_not_play && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Do Not Play:</strong> {preferences.do_not_play}</p>}
              </div>
            )}
            {Object.keys(groupDances).some(k => groupDances[k]) && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Group / Line Dances</h2>
                <DanceList groupDances={groupDances} />
              </div>
            )}
            {additionalSongs.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Additional Song Requests</h2>
                <div style={{ marginLeft: '15px' }}>
                  {additionalSongs.map((song, idx) => <p key={idx} style={{ margin: '6px 0', fontSize: '14px' }}>• {song.song || 'Untitled'}{song.artist ? ` by ${song.artist}` : ''}</p>)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Toasts tab */}
        {activeTabValue === 'toasts' && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={HEADER_STYLE}>Toasts & Speeches</h2>
            {toasts.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>No toasts added yet.</p>
            ) : (
              <div style={{ marginLeft: '15px' }}>
                {toasts.map((t, idx) => (
                  <div key={idx} style={CARD_STYLE}>
                    <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{t.name || `Toast #${idx + 1}`}{t.time ? ` — ${t.time}` : ''}</p>
                    {t.notes && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Notes: {t.notes}</p>}
                    {t.song && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Song after: {t.song}{t.artist ? ` by ${t.artist}` : ''}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Songs tab */}
        {activeTabValue === 'songs' && (
          <>
            {songRequests && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Song Requests</h2>
                <p style={{ margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{songRequests}</p>
              </div>
            )}
            {playlistLinks.length > 0 && (
              <div style={{ marginBottom: '30px' }}>
                <h2 style={HEADER_STYLE}>Playlist Links</h2>
                <div style={{ marginLeft: '15px' }}>
                  {playlistLinks.map((link, idx) => <p key={idx} style={{ margin: '6px 0', fontSize: '14px' }}>• {link.label || 'Playlist'}: {link.url}</p>)}
                </div>
              </div>
            )}
            {!songRequests && playlistLinks.length === 0 && (
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>No song requests or playlists added yet.</p>
            )}
          </>
        )}

        {/* Grand intro tab — wedding */}
        {activeTabValue === 'intro' && eventType === 'wedding' && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={HEADER_STYLE}>Grand Introduction</h2>
            <NamesLine label="Grandparents (Bride)" arr={grandIntro.grandparents_bride} />
            <NamesLine label="Grandparents (Groom)" arr={grandIntro.grandparents_groom} />
            <NamesLine label="Parents (Bride)" arr={grandIntro.parents_bride} />
            <NamesLine label="Parents (Groom)" arr={grandIntro.parents_groom} />
            <NamesLine label="Bridesmaids" arr={grandIntro.bridesmaids} />
            <NamesLine label="Groomsmen" arr={grandIntro.groomsmen} />
            {grandIntro.announcement_line && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Introduced As:</strong> {grandIntro.announcement_line}</p>}
          </div>
        )}

        {/* Court intro tab — quince */}
        {activeTabValue === 'intro' && eventType === 'quince' && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={HEADER_STYLE}>Court Introduction</h2>
            {grandIntro.chambelan_de_honor && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Chambelán de Honor:</strong> {grandIntro.chambelan_de_honor}</p>}
            <NamesLine label="Padrinos" arr={grandIntro.padrinos} />
            <NamesLine label="Damas" arr={grandIntro.damas} />
            <NamesLine label="Chambelanes" arr={grandIntro.chambelanes} />
            {grandIntro.announcement_line && <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Introduced As:</strong> {grandIntro.announcement_line}</p>}
          </div>
        )}

        {/* Announcements tab */}
        {activeTabValue === 'announcements' && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={HEADER_STYLE}>Announcements & Intros</h2>
            {announcements.length === 0 ? (
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>No announcements added yet.</p>
            ) : (
              <div style={{ marginLeft: '15px' }}>
                {announcements.map((ann, idx) => (
                  <div key={idx} style={CARD_STYLE}>
                    <p style={{ margin: '0', fontSize: '14px', fontWeight: 'bold' }}>{ann.title || `Announcement #${idx + 1}`}{ann.timing ? ` — ${ann.timing}` : ''}</p>
                    {ann.content && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{ann.content}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <PrintFooter />
      </div>
    </div>
  );
};
