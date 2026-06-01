import React, { createContext, useContext, useState, useCallback } from "react";

export interface BookingWizardData {
  // Step 1 - Event Details
  event_type: string;
  custom_event_type: string;
  event_date: string;
  start_time: string;
  venue: string;
  guest_count: string;
  notes: string;
  // Step 2 - Contact Info (event-type-specific)
  bride_name: string;
  groom_name: string;
  bride_email: string;
  groom_email: string;
  bride_phone: string;
  groom_phone: string;
  honoree_name: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
}

const DEFAULT_DATA: BookingWizardData = {
  event_type: "",
  custom_event_type: "",
  event_date: "",
  start_time: "",
  venue: "",
  guest_count: "",
  notes: "",
  bride_name: "",
  groom_name: "",
  bride_email: "",
  groom_email: "",
  bride_phone: "",
  groom_phone: "",
  honoree_name: "",
  parent_name: "",
  parent_email: "",
  parent_phone: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
};

interface WizardContextValue {
  data: BookingWizardData;
  step: number;
  setStep: (s: number) => void;
  updateField: <K extends keyof BookingWizardData>(key: K, value: BookingWizardData[K]) => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function BookingWizardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<BookingWizardData>(DEFAULT_DATA);
  const [step, setStep] = useState(1);

  const updateField = useCallback(<K extends keyof BookingWizardData>(key: K, value: BookingWizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setData(DEFAULT_DATA);
    setStep(1);
  }, []);

  return (
    <WizardContext.Provider value={{ data, step, setStep, updateField, reset }}>
      {children}
    </WizardContext.Provider>
  );
}

export function useBookingWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useBookingWizard must be used within BookingWizardProvider");
  return ctx;
}

/** Derive client name for event_notification_history based on event type */
export function deriveCoupleNameFromData(data: BookingWizardData): string {
  const type = data.event_type;
  if (type === "wedding") {
    const b = data.bride_name.trim();
    const g = data.groom_name.trim();
    if (b && g) return `${b} & ${g}`;
    return b || g || "Wedding Client";
  }
  if (type === "quinceanera") return data.honoree_name.trim() || "Quinceañera Client";
  if (type === "birthday" || type === "sweet_16") return data.honoree_name.trim() || "Birthday Client";
  return data.contact_name.trim() || "Client";
}

/** Derive the primary contact email based on event type */
export function derivePrimaryEmail(data: BookingWizardData): string {
  const type = data.event_type;
  if (type === "wedding") return data.bride_email.trim() || data.groom_email.trim();
  if (type === "quinceanera") return data.parent_email.trim();
  if (type === "birthday" || type === "sweet_16") return data.contact_email.trim();
  return data.contact_email.trim();
}
