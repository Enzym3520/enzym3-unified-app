import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────
export interface AppEventType {
  id: string;
  value: string;
  label: string;
  emoji: string;
  calendar_color: string;
  contact_label: string;
  form_label: string;
  contact_schema: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AppPackageType {
  id: string;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface AppUpgradePackage {
  id: string;
  name: string;
  price: number;
  features: string[];
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface AppMeetingType {
  id: string;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
}

export interface AppPricingDefault {
  id: string;
  key: string;
  value: number;
  label: string;
}

// ── Hardcoded fallbacks (used if DB query fails) ───────────
const FALLBACK_EVENT_TYPES: AppEventType[] = [
  { id: '', value: 'wedding', label: 'Wedding', emoji: '💒', calendar_color: 'pink-500', contact_label: 'Couple Names', form_label: 'Couple Names', contact_schema: 'wedding', sort_order: 1, is_active: true },
  { id: '', value: 'quince', label: 'Quinceañera', emoji: '👑', calendar_color: 'purple-500', contact_label: 'Quinceañera Name', form_label: 'Quinceañera Name', contact_schema: 'quince', sort_order: 2, is_active: true },
  { id: '', value: 'birthday', label: 'Birthday', emoji: '🎂', calendar_color: 'blue-500', contact_label: 'Honoree Name', form_label: 'Honoree Name', contact_schema: 'birthday', sort_order: 3, is_active: true },
  { id: '', value: 'banquet', label: 'Banquet', emoji: '🍽️', calendar_color: 'amber-500', contact_label: 'Event Name', form_label: 'Event Name', contact_schema: 'banquet', sort_order: 4, is_active: true },
  { id: '', value: 'graduation', label: 'Graduation Party', emoji: '🎓', calendar_color: 'emerald-500', contact_label: 'Graduate Name', form_label: 'Graduate Name', contact_schema: 'birthday', sort_order: 5, is_active: true },
  { id: '', value: 'sweet16', label: 'Sweet 16', emoji: '🎀', calendar_color: 'rose-500', contact_label: 'Honoree Name', form_label: 'Honoree Name', contact_schema: 'birthday', sort_order: 6, is_active: true },
];

const FALLBACK_PACKAGE_TYPES: AppPackageType[] = [
  { id: '', value: 'ceremony-only', label: 'Ceremony Only', sort_order: 1, is_active: true },
  { id: '', value: 'ceremony-w-patio', label: 'Ceremony W/ Patio', sort_order: 2, is_active: true },
  { id: '', value: 'bronze', label: 'Bronze', sort_order: 3, is_active: true },
  { id: '', value: 'silver', label: 'Silver', sort_order: 4, is_active: true },
  { id: '', value: 'standard', label: 'Standard', sort_order: 5, is_active: true },
  { id: '', value: 'gold', label: 'Gold', sort_order: 6, is_active: true },
  { id: '', value: 'premium', label: 'Premium', sort_order: 7, is_active: true },
  { id: '', value: 'platinum', label: 'Platinum', sort_order: 8, is_active: true },
  { id: '', value: 'diamond', label: 'Diamond', sort_order: 9, is_active: true },
];

const FALLBACK_UPGRADE_PACKAGES: AppUpgradePackage[] = [
  { id: '', name: 'Ruby', price: 250, features: ['Uplights'], description: null, sort_order: 1, is_active: true },
  { id: '', name: 'Emerald', price: 500, features: ['Uplights', 'Choice of: Projector Monogram OR Cold Sparks'], description: null, sort_order: 2, is_active: true },
  { id: '', name: 'Sapphire', price: 1000, features: ['Uplights', 'Projector Monogram', 'Cold Sparks', 'Cloud 9'], description: null, sort_order: 3, is_active: true },
];

const FALLBACK_MEETING_TYPES: AppMeetingType[] = [
  { id: '', value: 'consultation', label: 'Initial Consultation', sort_order: 1, is_active: true },
  { id: '', value: 'dj_details', label: 'Vendor Details Review', sort_order: 2, is_active: true },
  { id: '', value: 'follow_up', label: 'Follow-up Call', sort_order: 3, is_active: true },
  { id: '', value: 'venue_tour', label: 'Venue Tour', sort_order: 4, is_active: true },
  { id: '', value: 'final_walkthrough', label: 'Final Walkthrough', sort_order: 5, is_active: true },
  { id: '', value: 'planning', label: 'Planning Session', sort_order: 6, is_active: true },
];

const FALLBACK_PRICING: AppPricingDefault[] = [
  { id: '', key: 'hourly_rate', value: 150, label: 'Hourly Rate ($)' },
  { id: '', key: 'overtime_rate', value: 100, label: 'Overtime Rate ($)' },
  { id: '', key: 'deposit_percentage', value: 50, label: 'Deposit Percentage (%)' },
];

// ── 30-min stale time for all config queries ───────────────
const CONFIG_STALE_TIME = 30 * 60 * 1000;

// ── Hooks ──────────────────────────────────────────────────
export function useEventTypes() {
  const query = useQuery({
    queryKey: ['app_event_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_event_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(200);
      if (error) throw error;
      return data as AppEventType[];
    },
    staleTime: CONFIG_STALE_TIME,
    placeholderData: FALLBACK_EVENT_TYPES,
  });

  const types = query.data ?? FALLBACK_EVENT_TYPES;

  const getLabel = (value: string) =>
    types.find(t => t.value === value?.toLowerCase())?.label ?? value;

  const getEmoji = (value: string) =>
    types.find(t => t.value === value?.toLowerCase())?.emoji ?? '🎉';

  const getCalendarColor = (value: string) =>
    types.find(t => t.value === value?.toLowerCase())?.calendar_color ?? 'primary';

  const getContactLabel = (value: string) =>
    types.find(t => t.value === value?.toLowerCase())?.contact_label ?? 'Event Name';

  const getFormLabel = (value: string) =>
    types.find(t => t.value === value?.toLowerCase())?.form_label ?? 'Event Name';

  const getContactSchema = (value: string) =>
    types.find(t => t.value === value?.toLowerCase())?.contact_schema ?? null;

  return { eventTypes: types, getLabel, getEmoji, getCalendarColor, getContactLabel, getFormLabel, getContactSchema, ...query };
}

export function usePackageTypes() {
  const query = useQuery({
    queryKey: ['app_package_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_package_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(200);
      if (error) throw error;
      return data as AppPackageType[];
    },
    staleTime: CONFIG_STALE_TIME,
    placeholderData: FALLBACK_PACKAGE_TYPES,
  });

  const types = query.data ?? FALLBACK_PACKAGE_TYPES;

  const getLabel = (value: string) => {
    if (!value) return 'Not specified';
    const t = types.find(t => t.value === value);
    return t ? t.label : value.charAt(0).toUpperCase() + value.slice(1);
  };

  const options = types.map(t => ({ value: t.value, label: t.label }));

  return { packageTypes: types, getLabel, options, ...query };
}

export function useUpgradePackages() {
  const query = useQuery({
    queryKey: ['app_upgrade_packages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_upgrade_packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(200);
      if (error) throw error;
      return data as AppUpgradePackage[];
    },
    staleTime: CONFIG_STALE_TIME,
    placeholderData: FALLBACK_UPGRADE_PACKAGES,
  });

  const packages = query.data ?? FALLBACK_UPGRADE_PACKAGES;

  const getPackage = (name: string) =>
    packages.find(p => p.name.toLowerCase() === name?.toLowerCase());

  const getPrice = (name: string) => getPackage(name)?.price ?? 0;

  const getFeatures = (name: string) => getPackage(name)?.features ?? [];

  // Build a map compatible with the old UPGRADE_PACKAGES shape
  const packagesMap = Object.fromEntries(
    packages.map(p => [p.name, { price: p.price, features: p.features }])
  ) as Record<string, { price: number; features: string[] }>;

  return { upgradePackages: packages, packagesMap, getPackage, getPrice, getFeatures, ...query };
}

export function useMeetingTypes() {
  const query = useQuery({
    queryKey: ['app_meeting_types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_meeting_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(200);
      if (error) throw error;
      return data as AppMeetingType[];
    },
    staleTime: CONFIG_STALE_TIME,
    placeholderData: FALLBACK_MEETING_TYPES,
  });

  const types = query.data ?? FALLBACK_MEETING_TYPES;

  const getLabel = (value: string) =>
    types.find(t => t.value === value)?.label ?? value;

  const options = types.map(t => ({ value: t.value, label: t.label }));

  return { meetingTypes: types, getLabel, options, ...query };
}

export function usePricingDefaults() {
  const query = useQuery({
    queryKey: ['app_pricing_defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_pricing_defaults')
        .select('*')
        .order('key')
        .limit(200);
      if (error) throw error;
      return data as AppPricingDefault[];
    },
    staleTime: CONFIG_STALE_TIME,
    placeholderData: FALLBACK_PRICING,
  });

  const defaults = query.data ?? FALLBACK_PRICING;

  const getValue = (key: string) =>
    defaults.find(d => d.key === key)?.value ?? 0;

  const hourlyRate = getValue('hourly_rate');
  const overtimeRate = getValue('overtime_rate');
  const depositPercentage = getValue('deposit_percentage');

  return { pricingDefaults: defaults, getValue, hourlyRate, overtimeRate, depositPercentage, ...query };
}
