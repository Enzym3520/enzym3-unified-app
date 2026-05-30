import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export interface WeddingDetailsValues {
  [key: string]: any;
}

const toISODate = (dateLike?: string | Date) => {
  if (!dateLike) return null;
  try {
    if (typeof dateLike === "string") return dateLike; // assume YYYY-MM-DD
    return format(dateLike, "yyyy-MM-dd");
  } catch {
    return null;
  }
};

export const useWeddingDetailsSubmission = () => {
  const { toast } = useToast();

  const submit = async (values: WeddingDetailsValues) => {
    // Map key fields to top-level columns
    const bride_name = values.bride || null;
    const groom_name = values.groom || null;
    const coordinator_name = values.coordinator || null;

    const event_date = toISODate(values.date_of_event);

    // Try to map ceremony and reception times if present
    const ceremony_time = values.ceremony_invites_say || null;
    const reception_time = values.dinner || null;

    // Guest count strategy: prefer provided total_people, else adults + kids
    const guest_count =
      values.total_people ??
      (typeof values.adults === "number" || typeof values.kids === "number"
        ? (Number(values.adults) || 0) + (Number(values.kids) || 0)
        : null);

    const signature_client = values.signature_bride || null;
    const signature_coordinator = values.sb_coordinator_signature || null;
    const signed_at = toISODate(values.signature_date) || null;

    const payload = {
      bride_name,
      groom_name,
      coordinator_name,
      event_date,
      ceremony_time,
      reception_time,
      guest_count,
      signature_client,
      signature_coordinator,
      signed_at,
      // Persist the full form in metadata
      metadata: values,
    } as const;

    const { error } = await supabase
      .from("wedding_details_submissions")
      .insert(payload);

    if (error) {
      if (import.meta.env.DEV) console.error("Failed to insert wedding details:", error);
      toast({
        title: "Submission failed",
        description: "We couldn't save the form. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "Saved", description: "Wedding details submitted successfully." });
    return true;
  };

  return { submit };
};
