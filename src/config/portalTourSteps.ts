import { DriveStep } from "driver.js";
import { normalizeEventType, getEventLabel, hasCeremonyPhase } from "@/lib/eventUtils";

export interface TourStep extends DriveStep {
  route?: string;
  tab?: string;
}

export const getTourSteps = (eventType?: string): TourStep[] => {
  const type = normalizeEventType(eventType);
  const label = getEventLabel(eventType); // e.g. "Wedding", "Quinceañera", "Birthday Party"
  const isCeremonyEvent = hasCeremonyPhase(eventType);

  // Emoji and countdown text per event type
  const countdownEmoji = type === 'wedding' ? '💍' : type === 'quince' ? '👑' : type === 'birthday' ? '🎉' : '📅';
  const countdownTitle = `${countdownEmoji} ${label} Countdown`;

  const vibeSheetTabsDesc = isCeremonyEvent
    ? 'Use these tabs to navigate between Ceremony, Cocktail Hour, Reception, and Special Songs. Each section has its own music preferences.'
    : 'Use these tabs to navigate between Music Style, Announcements, and Song Requests. Each section lets you customize your experience.';

  const vibeSheetIntroDesc = isCeremonyEvent
    ? `The Vibe Sheet is where you tell us your music preferences for every part of your ${label.toLowerCase()} — from ceremony to reception!`
    : `The Vibe Sheet is where you tell us your music preferences. Help us create the perfect soundtrack for your ${label.toLowerCase()}!`;

  const upgradesDesc = `Browse packages and à la carte upgrades to enhance your ${label.toLowerCase()} entertainment. From photo booths to LED dance floors!`;

  const scheduleDesc = `Book your final details meeting with your DJ/coordinator. This is where we go over everything to make sure your ${type === 'wedding' || type === 'quince' ? 'day is perfect' : 'event goes great'}!`;

  const steps: TourStep[] = [
    // Dashboard Tour
    {
      element: '[data-tour="dashboard-welcome"]',
      route: '/app/dashboard',
      popover: {
        title: `👋 Welcome to Your ${label} Portal`,
        description: `Let us show you around! This dashboard is your central hub for managing all your ${label.toLowerCase()} details with Enzym3 Entertainment. On the day of your event, you'll also see a live banner to join your planning meeting right from here.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="countdown-card"]',
      route: '/app/dashboard',
      popover: {
        title: countdownTitle,
        description: 'Keep track of how many days until your special day! This countdown updates automatically every day.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="progress-tracker"]',
      route: '/app/dashboard',
      popover: {
        title: '✅ Your Progress Checklist',
        description: 'This tracker shows your key milestones: Contract, Deposit, Vibe Sheet, Meeting, and Files. Click any item to jump straight to that section. Watch the progress bar fill up as you complete each step!',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="wedding-details"]',
      route: '/app/dashboard',
      popover: {
        title: `📋 Your ${label} Details`,
        description: `All your ${label.toLowerCase()} information at a glance — names, venue, contact info, and package type.`,
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="coordinator-files"]',
      route: '/app/dashboard',
      popover: {
        title: '📁 Detail Forms from Coordinator',
        description: 'When your coordinator uploads important detail forms, they\'ll appear here. Click the download button to save them to your device.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="quick-actions"]',
      route: '/app/dashboard',
      popover: {
        title: '⚡ Quick Actions',
        description: 'Jump to the most important features: Complete your Vibe Sheet, browse Upgrades, Schedule meetings, and Upload files. Click any card to navigate!',
        side: 'top',
        align: 'start',
      },
    },

    // Vibe Sheet Tour
    {
      element: '[data-tour="vibe-sheet-intro"]',
      route: '/app/vibe-sheet',
      popover: {
        title: '🎵 Vibe Sheet Overview',
        description: vibeSheetIntroDesc,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="vibe-tabs"]',
      route: '/app/vibe-sheet',
      popover: {
        title: '📑 Different Sections',
        description: vibeSheetTabsDesc,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="spotify-search"]',
      route: '/app/vibe-sheet',
      tab: 'songs',
      popover: {
        title: '🔍 Spotify Search',
        description: 'Search for songs directly from Spotify! Type a song name or artist, select from results, and we\'ll add it to your list.',
        side: 'left',
        align: 'start',
      },
    },
    // Reception Timeline step — only for wedding/quince
    ...(isCeremonyEvent ? [{
      element: '[data-tour="timeline-editor"]',
      route: '/app/vibe-sheet',
      tab: 'reception',
      popover: {
        title: '⏰ Reception Timeline',
        description: 'Customize your reception timeline with drag-and-drop reordering. Set times for each event like toasts, first dance, and cake cutting.',
        side: 'left',
        align: 'start',
      },
    } as TourStep] : []),
    {
      element: '[data-tour="save-draft"]',
      route: '/app/vibe-sheet',
      popover: {
        title: '💾 Save Your Work',
        description: 'Click "Save Draft" anytime to save your progress. Tip: Use Cmd/Ctrl+S keyboard shortcut! Your draft is saved automatically.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="submit-vibe"]',
      route: '/app/vibe-sheet',
      popover: {
        title: '✅ Submit When Ready',
        description: 'Once you\'ve completed all sections, click "Submit Vibe Sheet" to send it to your DJ. You can also use the Share button to share a link, or Export/Print to save a PDF copy. You can still update after submission if needed!',
        side: 'top',
        align: 'start',
      },
    },

    // Upgrades Tour
    {
      element: '[data-tour="upgrades-intro"]',
      route: '/app/upgrades',
      popover: {
        title: '✨ Upgrade Your Experience',
        description: upgradesDesc,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="package-options"]',
      route: '/app/upgrades',
      popover: {
        title: '💎 Premium Packages',
        description: 'Choose from Ruby, Emerald, or Sapphire packages for comprehensive entertainment upgrades. Each includes multiple features at a discounted rate.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="cart-system"]',
      route: '/app/upgrades',
      popover: {
        title: '🛒 Add to Cart',
        description: 'Click "Add to Cart" on any upgrade you\'re interested in. Items are saved in your cart until you\'re ready to submit your request.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="cart-icon"]',
      route: '/app/upgrades',
      popover: {
        title: '🛍️ View Your Cart',
        description: 'The cart icon in the header shows how many items you\'ve added. Click it (or press Cmd/Ctrl+K) to review and checkout! The badge shows your item count.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="submit-request"]',
      route: '/app/upgrades',
      popover: {
        title: '📤 Submit Upgrade Request',
        description: 'When you\'re ready to purchase, open your cart and click \'Pay with Card\' to complete your order through our secure checkout. Your upgrades will be confirmed automatically after payment!',
        side: 'top',
        align: 'start',
      },
    },

    // Schedule Tour
    {
      element: '[data-tour="schedule-intro"]',
      route: '/app/schedule',
      popover: {
        title: '📅 Schedule Your Meeting',
        description: scheduleDesc,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="calendar-view"]',
      route: '/app/schedule',
      popover: {
        title: '🗓️ Pick a Date',
        description: 'Select an available date from the calendar. Dates with available time slots are highlighted.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="time-slots"]',
      route: '/app/schedule',
      popover: {
        title: '⏰ Choose a Time',
        description: 'After selecting a date, pick from available time slots. Meetings typically last 30-60 minutes.',
        side: 'left',
        align: 'start',
      },
    },

    // Uploads Tour
    {
      element: '[data-tour="uploads-intro"]',
      route: '/app/uploads',
      popover: {
        title: '📤 Upload Files & Links',
        description: 'Share important documents and external links with your coordinator - timelines, photos, vendor contacts, or any other content.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="uploads-tabs"]',
      route: '/app/uploads',
      popover: {
        title: '📂 Files & Links Tabs',
        description: 'Use these tabs to switch between uploading files and adding external links to photos or documents hosted elsewhere.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="file-upload"]',
      route: '/app/uploads',
      popover: {
        title: '📎 Drop or Click to Upload',
        description: 'Drag and drop files, or click to browse your computer. Files are stored securely and only accessible to you and your coordinator.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="add-link-form"]',
      route: '/app/uploads',
      popover: {
        title: '🔗 Add External Links',
        description: 'Share links to photos on Google Drive, Dropbox, Instagram, or other platforms. Just add a label, paste the URL, and select the platform type.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="links-list"]',
      route: '/app/uploads',
      popover: {
        title: '📋 Your Saved Links',
        description: 'All your saved links appear here. Click "Open" to visit them in a new tab, or delete links you no longer need.',
        side: 'top',
        align: 'start',
      },
    },

    // Settings Tour
    {
      element: '[data-tour="settings-intro"]',
      route: '/app/settings',
      popover: {
        title: '⚙️ Manage Your Account',
        description: 'Customize your portal experience and manage your account. Set your preferred theme (Light, Dark, or System), update your contact info, invite your partner for their own login, and change your password — all in one place.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="keyboard-shortcuts"]',
      route: '/app/settings',
      popover: {
        title: '⌨️ Pro Tip: Keyboard Shortcuts',
        description: 'Press ? or click the keyboard icon to see all available shortcuts. Navigate faster with shortcuts like "g then d" for dashboard!',
        side: 'bottom',
        align: 'start',
      },
    },
  ];

  return steps;
};

// Legacy static export for any code that still imports tourSteps directly
export const tourSteps = getTourSteps(undefined);

// Dynamic tour sections derived from generated steps
export const getTourSections = (eventType?: string) => {
  const steps = getTourSteps(eventType);
  const isCeremonyEvent = hasCeremonyPhase(eventType);
  const vibeSheetEnd = isCeremonyEvent ? 12 : 11;
  const upgradesEnd = vibeSheetEnd + 5;
  const scheduleEnd = upgradesEnd + 3;
  const uploadsEnd = scheduleEnd + 5;

  return {
    dashboard: steps.slice(0, 6),
    vibeSheet: steps.slice(6, vibeSheetEnd),
    upgrades: steps.slice(vibeSheetEnd, upgradesEnd),
    schedule: steps.slice(upgradesEnd, scheduleEnd),
    uploads: steps.slice(scheduleEnd, uploadsEnd),
    settings: steps.slice(uploadsEnd),
  };
};

// Legacy static export
export const tourSections = getTourSections(undefined);
