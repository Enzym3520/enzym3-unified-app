import { supabase } from "@/integrations/supabase/client";

/**
 * Standardized three-step event resolution for client-facing pages.
 * 
 * 1. couple_codes — partner-invited users whose email may not be on event_notification_history
 * 2. event_notification_history — primary lookup by contact/bride/groom email
 * 3. vendor_client_assignments — vendor-portal clients linked by user ID
 * 
 * Returns the event_notification_history row matching the given `select` columns, or null.
 */
export async function resolveClientEvent<T = any>(
  userId: string,
  userEmail: string,
  select: string
): Promise<T | null> {
  // Normalize — auth.users emails are always lowercase, but legacy event/couple_code
  // rows may contain mixed-case emails. Use ilike for case-insensitive matching.
  const emailLower = userEmail.toLowerCase();

  // Step 1: Check couple_codes for partner-invited users (case-insensitive)
  const { data: coupleCode } = await supabase
    .from('couple_codes')
    .select('wedding_id')
    .or(`bride_email.ilike.${emailLower},groom_email.ilike.${emailLower}`)
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (coupleCode?.wedding_id) {
    const { data } = await supabase
      .from('event_notification_history')
      .select(select)
      .eq('id', coupleCode.wedding_id)
      .maybeSingle();
    if (data) {
      console.log('[resolveClientEvent] Resolved via couple_codes:', coupleCode.wedding_id);
      return data as T;
    }
  }

  // Step 2: Direct email match on event_notification_history (case-insensitive)
  const { data: emailMatch } = await supabase
    .from('event_notification_history')
    .select(select)
    .or(`contact_email.ilike.${emailLower},bride_email.ilike.${emailLower},groom_email.ilike.${emailLower}`)
    .not('status', 'in', '("cancelled","deleted")')
    .order('event_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (emailMatch) {
    console.log('[resolveClientEvent] Resolved via email match on event_notification_history');
    return emailMatch as T;
  }

  // Step 3: Fallback — vendor_client_assignments
  const { data: vcAssignment } = await supabase
    .from('vendor_client_assignments')
    .select('event_id')
    .eq('client_user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (vcAssignment?.event_id) {
    const { data: vcEvent } = await supabase
      .from('event_notification_history')
      .select(select)
      .eq('id', vcAssignment.event_id)
      .maybeSingle();
    if (vcEvent) {
      console.log('[resolveClientEvent] Resolved via vendor_client_assignments:', vcAssignment.event_id);
      return vcEvent as T;
    }
  }

  console.warn('[resolveClientEvent] No event found for user:', userId);
  return null;
}
