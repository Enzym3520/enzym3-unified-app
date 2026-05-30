import { supabase } from "@/integrations/supabase/client";

export const logAction = async (
  weddingId: string,
  action: string,
  userId: string,
  userName: string,
  page: string,
  details?: object
) => {
  try {
    await supabase.from("action_logs").insert([{
      wedding_id: weddingId,
      step: action,
      user_id: userId,
      user_name: userName,
      action_type: "portal_action",
      page,
      outcome: details || {},
    }] as any);
  } catch (err) {
    // Silently fail — logging should never break the user experience
    console.warn("[activityLogger] Failed to log action:", err);
  }
};
