import jsPDF from "jspdf";
import { capitalizeWords } from "@/lib/utils";
import { parseLocalDate } from "@/lib/formatters";
import { CeremonyTimelineEvent } from "@/components/CeremonyTimeline";
import { TimelineEvent } from "@/components/ReceptionTimeline";
import { QuinceTimelineEvent } from "@/components/QuinceTimeline";
import { AgendaItem } from "@/components/EventAgenda";
import { Announcement } from "@/components/AnnouncementsSection";

interface ToastEntry {
  id: string;
  name: string;
  time: string;
  notes: string;
  song?: string;
  artist?: string;
}

export interface VibeSheetPDFData {
  wedding: any;
  eventType: string;
  activeTab: string;
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
  toasts: ToastEntry[];
  grandIntro: any;
}

export const buildVibeSheetPDF = (data: VibeSheetPDFData, scope: 'full' | 'current'): jsPDF => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const BLUE: [number, number, number] = [107, 163, 190];
  const DARK: [number, number, number] = [31, 41, 55];
  const GRAY: [number, number, number] = [107, 114, 128];
  const LIGHT_BG: [number, number, number] = [249, 250, 251];
  let y = 0;

  const { wedding, eventType, activeTab, ceremony, ceremonyEvents, receptionEvents, quinceReceptionEvents, agendaItems, announcements, preferences, groupDances, additionalSongs, songRequests, playlistLinks, toasts, grandIntro } = data;

  const coupleName = capitalizeWords(wedding?.couple_name || '');
  const eventDateStr = wedding?.event_date
    ? parseLocalDate(wedding.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const drawPageHeader = () => {
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, PAGE_W, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('ENZYM3 ENTERTAINMENT', PAGE_W / 2, 9, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('enzym3entertainment.vip', PAGE_W / 2, 16, { align: 'center' });

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(coupleName, PAGE_W / 2, 32, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text(eventDateStr, PAGE_W / 2, 39, { align: 'center' });

    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 43, PAGE_W - MARGIN, 43);
    y = 50;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      drawPageHeader();
    }
  };

  const sectionHeading = (title: string) => {
    checkPageBreak(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...BLUE);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 2;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;
  };

  const cardRow = (title: string, subtitle?: string, badge?: string) => {
    const titleLines = doc.splitTextToSize(title, CONTENT_W - 10);
    const subLines = subtitle ? doc.splitTextToSize(subtitle, CONTENT_W - 10) : [];
    const cardH = 5 + titleLines.length * 5.5 + (subLines.length > 0 ? subLines.length * 4.5 + 2 : 0) + 4;
    checkPageBreak(cardH);

    doc.setFillColor(...LIGHT_BG);
    doc.rect(MARGIN, y, CONTENT_W, cardH, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(MARGIN, y, 2.5, cardH, 'F');

    let textX = MARGIN + 6;
    if (badge) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...BLUE);
      doc.text(`[${badge}]`, textX, y + 5.5);
      textX += doc.getTextWidth(`[${badge}]`) + 3;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...DARK);
    titleLines.forEach((line: string, i: number) => {
      doc.text(line, textX, y + 5.5 + i * 5.5);
    });

    if (subLines.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY);
      const subY = y + 5.5 + titleLines.length * 5.5 + 2;
      subLines.forEach((line: string, i: number) => {
        doc.text(line, textX, subY + i * 4.5);
      });
    }

    y += cardH + 2.5;
  };

  const simpleRow = (label: string, value: string) => {
    if (!value) return;
    checkPageBreak(8);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...DARK);
    const labelW = doc.getTextWidth(label + ' ');
    doc.text(label, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    const valLines = doc.splitTextToSize(value, CONTENT_W - labelW - 2);
    doc.text(valLines[0] || '', MARGIN + labelW, y);
    y += 5.5;
    if (valLines.length > 1) {
      valLines.slice(1).forEach((l: string) => {
        checkPageBreak(5);
        doc.text(l, MARGIN + labelW, y);
        y += 5;
      });
    }
  };

  // ── Section renderers ──

  const renderCeremony = () => {
    sectionHeading('Ceremony');
    simpleRow('Invite Time:', ceremony.arrival_time || '');
    simpleRow('Ceremony Time:', ceremony.ceremony_time || '');
    simpleRow('Cocktail Hour Music:', ceremony.cocktail_hour?.music_info || '');
    if (ceremonyEvents.filter(e => e.song).length > 0) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BLUE);
      doc.text('Ceremony Music', MARGIN, y);
      y += 5;
      ceremonyEvents.forEach(ev => {
        if (ev.event_name || ev.song) {
          const sub = ev.song ? `${ev.song}${ev.artist ? ` by ${ev.artist}` : ''}` : undefined;
          cardRow(ev.event_name || 'Untitled', sub);
        }
      });
    }
    y += 4;
  };

  const renderReception = () => {
    sectionHeading('Reception Timeline');
    receptionEvents.forEach(ev => {
      const sub = ev.song ? `${ev.song}${ev.artist ? ` by ${ev.artist}` : ''}` : undefined;
      cardRow(ev.event_name || 'Event', sub, ev.time || undefined);
    });
    y += 4;
  };

  const renderQuinceReception = () => {
    sectionHeading('Reception Timeline');
    quinceReceptionEvents.forEach(ev => {
      const sub = ev.song ? `${ev.song}${ev.artist ? ` by ${ev.artist}` : ''}` : undefined;
      cardRow(ev.event_name || 'Event', sub);
    });
    y += 4;
  };

  const renderQuinceCourtIntro = () => {
    const hasAny = grandIntro.announcement_line ||
      grandIntro.chambelan_de_honor ||
      grandIntro.padrinos?.some((p: string) => p) ||
      grandIntro.damas?.some((d: string) => d) ||
      grandIntro.chambelanes?.some((c: string) => c);
    if (!hasAny) return;
    sectionHeading('Court Introduction');
    const renderNames = (label: string, arr: string[] | undefined) => {
      const names = (arr || []).filter(Boolean);
      if (names.length) simpleRow(label + ':', names.join(', '));
    };
    simpleRow('Chambelán de Honor:', grandIntro.chambelan_de_honor || '');
    renderNames('Padrinos', grandIntro.padrinos);
    renderNames('Damas', grandIntro.damas);
    renderNames('Chambelanes', grandIntro.chambelanes);
    simpleRow('Introduced As:', grandIntro.announcement_line || '');
    y += 4;
  };

  const renderAgenda = () => {
    if (!agendaItems.length) return;
    sectionHeading('Event Agenda');
    agendaItems.forEach(item => {
      const sub = item.notes || undefined;
      cardRow(item.event_name || 'Item', sub, item.time || undefined);
    });
    y += 4;
  };

  const renderPreferences = () => {
    const hasPref = preferences.favorite_style || preferences.second_favorite_style ||
      (Array.isArray(preferences.dislikes) ? preferences.dislikes.join('') : preferences.dislikes) ||
      (Array.isArray(preferences.other_styles) ? preferences.other_styles.join('') : preferences.other_styles);
    if (!hasPref) return;
    sectionHeading('Music Preferences');
    simpleRow('Favorite Style:', preferences.favorite_style || '');
    if (Array.isArray(preferences.favorite_examples)) {
      preferences.favorite_examples.forEach((ex: any) => {
        if (ex?.song) simpleRow('  Example:', `${ex.song}${ex.artist ? ` by ${ex.artist}` : ''}`);
      });
    }
    simpleRow('Second Favorite:', preferences.second_favorite_style || '');
    if (Array.isArray(preferences.second_favorite_examples)) {
      preferences.second_favorite_examples.forEach((ex: any) => {
        if (ex?.song) simpleRow('  Example:', `${ex.song}${ex.artist ? ` by ${ex.artist}` : ''}`);
      });
    }
    const dislikes = Array.isArray(preferences.dislikes) ? preferences.dislikes.join(', ') : (preferences.dislikes || '');
    simpleRow('Dislikes:', dislikes);
    const other = Array.isArray(preferences.other_styles) ? preferences.other_styles.join(', ') : (preferences.other_styles || '');
    simpleRow('Other Styles:', other);
    y += 4;
  };

  const renderGroupDances = () => {
    const danceMap: Record<string, string> = {
      macarena: 'Macarena', chicken_dance: 'Chicken Dance', electric_slide: 'Electric Slide',
      conga_line: 'Conga Line', cotton_eyed_joe: 'Cotton-Eyed Joe', cha_cha_slide: 'Cha Cha Slide',
      ymca: 'YMCA', cupid_shuffle: 'Cupid Shuffle', wobble: 'Wobble'
    };
    const approved = Object.keys(danceMap).filter(k => groupDances[k]);
    if (!approved.length && !groupDances.other) return;
    sectionHeading('Group / Line Dances');
    approved.forEach(k => {
      checkPageBreak(6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DARK);
      doc.text(`✓  ${danceMap[k]}`, MARGIN + 2, y);
      y += 5.5;
    });
    if (groupDances.other) simpleRow('Other:', groupDances.other);
    y += 4;
  };

  const renderSongRequests = () => {
    if (!additionalSongs.length && !songRequests) return;
    sectionHeading('Song Requests');
    if (songRequests) {
      const lines = doc.splitTextToSize(songRequests, CONTENT_W);
      lines.forEach((l: string) => {
        checkPageBreak(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text(l, MARGIN, y);
        y += 5;
      });
      y += 2;
    }
    additionalSongs.forEach(song => {
      if (song.song) {
        const sub = song.artist ? `by ${song.artist}${song.notes ? `  · ${song.notes}` : ''}` : (song.notes || undefined);
        cardRow(song.song, sub);
      }
    });
    y += 4;
  };

  const renderPlaylists = () => {
    if (!playlistLinks.length) return;
    sectionHeading('Playlist Links');
    playlistLinks.forEach(link => {
      if (link.url) {
        checkPageBreak(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(...DARK);
        doc.text(`${link.label || 'Playlist'}:`, MARGIN + 2, y);
        const labelW = doc.getTextWidth(`${link.label || 'Playlist'}:`) + 3;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BLUE);
        const urlLines = doc.splitTextToSize(link.url, CONTENT_W - labelW - 4);
        doc.text(urlLines[0] || '', MARGIN + 2 + labelW, y);
        y += 5.5;
      }
    });
    y += 4;
  };

  const renderToasts = () => {
    if (!toasts.length) return;
    sectionHeading('Toasts & Speeches');
    toasts.forEach((t, i) => {
      const title = t.name || `Toast #${i + 1}`;
      const parts: string[] = [];
      if (t.notes) parts.push(`Notes: ${t.notes}`);
      if (t.song) parts.push(`Song after: ${t.song}${t.artist ? ` by ${t.artist}` : ''}`);
      cardRow(title, parts.join('  ·  ') || undefined, t.time || undefined);
    });
    y += 4;
  };

  const renderGrandIntro = () => {
    const hasAny = grandIntro.announcement_line ||
      grandIntro.bridesmaids?.some((b: string) => b) ||
      grandIntro.groomsmen?.some((g: string) => g) ||
      grandIntro.parents_bride?.some((p: string) => p) ||
      grandIntro.parents_groom?.some((p: string) => p) ||
      grandIntro.grandparents_bride?.some((g: string) => g) ||
      grandIntro.grandparents_groom?.some((g: string) => g);
    if (!hasAny) return;
    sectionHeading('Grand Introduction');
    const renderNames = (label: string, arr: string[] | undefined) => {
      const names = (arr || []).filter(Boolean);
      if (names.length) simpleRow(label + ':', names.join(', '));
    };
    renderNames('Grandparents (Bride)', grandIntro.grandparents_bride);
    renderNames('Grandparents (Groom)', grandIntro.grandparents_groom);
    renderNames('Parents (Bride)', grandIntro.parents_bride);
    renderNames('Parents (Groom)', grandIntro.parents_groom);
    renderNames('Bridesmaids', grandIntro.bridesmaids);
    renderNames('Groomsmen', grandIntro.groomsmen);
    simpleRow('Introduced As:', grandIntro.announcement_line || '');
    y += 4;
  };

  const renderAnnouncements = () => {
    if (!announcements.length) return;
    sectionHeading('Announcements & Intros');
    announcements.forEach(ann => {
      const parts: string[] = [];
      if (ann.timing) parts.push(`When: ${ann.timing}`);
      if (ann.content) parts.push(ann.content);
      cardRow(ann.title || 'Announcement', parts.join('  ·  ') || undefined);
    });
    y += 4;
  };

  const renderFooter = () => {
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text('Enzym3 Entertainment  ·  enzym3entertainment.vip', MARGIN, PAGE_H - 7);
      doc.text(`Page ${p} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 7, { align: 'right' });
    }
  };

  // ── Build the document ──
  drawPageHeader();

  if (scope === 'full') {
    if (eventType === 'wedding') {
      renderCeremony();
      renderReception();
      renderToasts();
      renderGrandIntro();
    } else if (eventType === 'quince') {
      renderQuinceReception();
      renderToasts();
      renderQuinceCourtIntro();
    } else {
      renderAgenda();
      renderAnnouncements();
    }
    renderPreferences();
    renderGroupDances();
    renderSongRequests();
    renderPlaylists();
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BLUE);
    const tabLabel = activeTab === 'ceremony' ? 'Ceremony' :
      activeTab === 'reception' ? 'Reception Timeline' :
      activeTab === 'preferences' ? 'Music Preferences' :
      activeTab === 'toasts' ? 'Toasts & Speeches' :
      activeTab === 'songs' ? 'Song Requests' :
      activeTab === 'intro' ? (eventType === 'quince' ? 'Court Introduction' : 'Grand Introduction') :
      activeTab === 'dances' ? 'Group Dances' :
      activeTab === 'playlists' ? 'Playlist Links' :
      activeTab === 'agenda' ? 'Event Agenda' :
      activeTab === 'announcements' ? 'Announcements' : activeTab;
    doc.text(`— ${tabLabel} —`, PAGE_W / 2, 47, { align: 'center' });
    y = 54;

    switch (activeTab) {
      case 'ceremony': renderCeremony(); break;
      case 'reception': eventType === 'quince' ? renderQuinceReception() : renderReception(); break;
      case 'preferences': renderPreferences(); break;
      case 'dances': renderGroupDances(); break;
      case 'songs': renderSongRequests(); break;
      case 'playlists': renderPlaylists(); break;
      case 'toasts': renderToasts(); break;
      case 'intro': eventType === 'quince' ? renderQuinceCourtIntro() : renderGrandIntro(); break;
      case 'agenda': renderAgenda(); break;
      case 'announcements': renderAnnouncements(); break;
      default: break;
    }
  }

  renderFooter();
  return doc;
};

export const generatePDFAsBase64 = (data: VibeSheetPDFData): string => {
  const doc = buildVibeSheetPDF(data, 'full');
  return doc.output('datauristring').split(',')[1];
};
