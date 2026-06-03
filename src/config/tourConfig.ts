import { LayoutDashboard, Calendar, Upload, Settings, Ban, FileText, DollarSign, Video, Users, Bell, Globe, MessageSquare, Package, BarChart3, History, Shield } from 'lucide-react';

export const TOUR_VERSION = 3;

export interface TourStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

export const vendorTourSteps: TourStep[] = [
  {
    title: 'Welcome to Your Portal',
    description: 'Your command center for managing all event assignments, uploads, and communications with the Enzym3 team.',
    icon: LayoutDashboard,
  },
  {
    title: 'My Events',
    description: 'Browse all events assigned to you. Confirm bookings, decline if unavailable, and view full event details including couple information, venue, and coordinator contacts.',
    icon: Calendar,
  },
  {
    title: 'Calendar',
    description: 'View all your upcoming bookings on a visual calendar. Switch between month, week, and day views to plan your schedule.',
    icon: Calendar,
  },
  {
    title: 'Meetings',
    description: 'View scheduled meetings with coordinators and couples. See meeting details, links, and notes all in one place.',
    icon: Video,
  },
  {
    title: 'Messages',
    description: 'Chat directly with coordinators and the Enzym3 team. Share files, ask questions, and stay in sync on event details.',
    icon: MessageSquare,
  },
  {
    title: 'Availability',
    description: 'Set blackout dates for vacation, personal time, or existing bookings. This helps admins assign events when you\'re actually available.',
    icon: Ban,
  },
  {
    title: 'Services & Rates',
    description: 'Manage your service offerings, pricing model, and rates. Keep this updated so admins can match you with the right events.',
    icon: DollarSign,
  },
  {
    title: 'My Earnings',
    description: 'Track your payments and earnings history. View completed events, pending payouts, and total revenue over time.',
    icon: DollarSign,
  },
  {
    title: 'My Documents',
    description: 'Keep your W9, insurance certificates, and business licenses current. Upload event-specific files like contracts, invoices, and final deliverables.',
    icon: Upload,
  },
  {
    title: 'My Page',
    description: 'Build your own public profile page with a drag-and-drop editor. Add a hero image, bio, gallery, services, and reviews to showcase your brand.',
    icon: Globe,
  },
  {
    title: 'Notifications',
    description: 'Stay on top of new assignments, meeting invites, and important updates from the Enzym3 team — all in one place.',
    icon: Bell,
  },
  {
    title: 'Profile Settings',
    description: 'Keep your business information, contact details, equipment notes, and service areas up to date for smooth coordination.',
    icon: Settings,
  },
];

export const coordinatorTourSteps: TourStep[] = [
  {
    title: 'Welcome to Your Dashboard',
    description: 'Your central hub for managing Enzym3 events. Track total submissions, this week\'s activity, and pending events at a glance — all from your home screen.',
    icon: LayoutDashboard,
  },
  {
    title: 'Event Notification',
    description: 'Submit new event details step by step — coordinator info, event details, contacts, and review. Notifications are sent automatically to the team and assigned vendors.',
    icon: FileText,
  },
  {
    title: 'Notification History',
    description: 'Review all past event notifications you\'ve sent. Resend, edit, or check email delivery status for any submission.',
    icon: History,
  },
  {
    title: 'Details Forms',
    description: 'Access and manage comprehensive detail forms for weddings and other events. Review vibe sheets, timelines, and special requests submitted by clients.',
    icon: Upload,
  },
  {
    title: 'Contacts',
    description: 'Manage couple and vendor contacts. Search, filter, tag, and export contact information for all your events.',
    icon: Users,
  },
  {
    title: 'Calendar',
    description: 'View all events on a visual calendar — color-coded by event type with month, week, and day views for easy scheduling.',
    icon: Calendar,
  },
  {
    title: 'Messages',
    description: 'Communicate directly with vendors, clients, and team members. Share files and keep all event conversations organized in one place.',
    icon: MessageSquare,
  },
  {
    title: 'Reminders',
    description: 'Schedule and manage automated follow-ups for clients and vendors — invoice reminders, anniversary touches, payment nudges, and custom messages.',
    icon: Bell,
  },
  {
    title: 'Submissions',
    description: 'Review and manage all form submissions from couples and clients. Track completion status and follow up on missing details.',
    icon: Package,
  },
  {
    title: 'Reporting',
    description: 'View revenue trends, event type distribution, vendor performance, and other analytics to guide business decisions. (Super admins only.)',
    icon: BarChart3,
  },
  {
    title: 'Vendor Management',
    description: 'Invite, assign, and review vendors. Track performance, manage availability, and keep vendor documents and certifications current.',
    icon: Users,
  },
  {
    title: 'Settings',
    description: 'Update your profile, notification preferences, and account details. Replay this tour anytime from the help icon in the header.',
    icon: Settings,
  },
];
