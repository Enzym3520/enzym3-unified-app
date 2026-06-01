import { useClientEvent } from "@/hooks/useClientEvent";
import type { WeddingDetails } from "@/hooks/useContract";

const EVENT_ACCESS_SELECT =
  "id, couple_name, event_date, event_type, venue, booking_source, payment_required, deposit_paid, contract_signed";

export interface EventAccess {
  event: WeddingDetails | null;
  paymentType: "independent" | "venue_partner";
  depositPaid: boolean;
  isVenuePartner: boolean;
  isLoading: boolean;
}

export function useEventAccess(): EventAccess {
  const { event, loading } = useClientEvent<WeddingDetails>(EVENT_ACCESS_SELECT);

  const paymentType: "independent" | "venue_partner" =
    event?.booking_source === "venue_partner" || event?.payment_required === false
      ? "venue_partner"
      : "independent";

  const depositPaid = event?.deposit_paid === true;
  const isVenuePartner = paymentType === "venue_partner";

  return {
    event,
    paymentType,
    depositPaid,
    isVenuePartner,
    isLoading: loading,
  };
}
