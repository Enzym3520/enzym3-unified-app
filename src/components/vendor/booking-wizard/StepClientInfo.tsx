import { useBookingWizard } from "@/contexts/BookingWizardContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Mail, Phone, Heart, Crown, PartyPopper, Users, FileText } from "lucide-react";
import { smartCapitalize, formatPhone } from "@/utils/smartFields";

function FieldRow({ icon: Icon, id, label, required, type = "text", value, onChange, placeholder }: {
  icon: React.ElementType; id: string; label: string; required?: boolean;
  type?: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required ? " *" : ""}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input id={id} type={type} className="pl-9" required={required}
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}

function WeddingFields() {
  const { data, updateField } = useBookingWizard();
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow icon={Heart} id="w-bride" label="Bride's Name" required
          value={data.bride_name} onChange={(v) => updateField("bride_name", smartCapitalize(v))} placeholder="Bride's name" />
        <FieldRow icon={Heart} id="w-groom" label="Groom's Name" required
          value={data.groom_name} onChange={(v) => updateField("groom_name", smartCapitalize(v))} placeholder="Groom's name" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow icon={Mail} id="w-bride-email" label="Bride's Email" type="email"
          value={data.bride_email} onChange={(v) => updateField("bride_email", v)} placeholder="bride@example.com" />
        <FieldRow icon={Mail} id="w-groom-email" label="Groom's Email" type="email"
          value={data.groom_email} onChange={(v) => updateField("groom_email", v)} placeholder="groom@example.com" />
      </div>
      <p className="text-xs text-muted-foreground">At least one email is required</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow icon={Phone} id="w-bride-phone" label="Bride's Phone"
          value={data.bride_phone} onChange={(v) => updateField("bride_phone", formatPhone(v))} placeholder="(555) 123-4567" />
        <FieldRow icon={Phone} id="w-groom-phone" label="Groom's Phone"
          value={data.groom_phone} onChange={(v) => updateField("groom_phone", formatPhone(v))} placeholder="(555) 987-6543" />
      </div>
    </>
  );
}

function QuinceFields() {
  const { data, updateField } = useBookingWizard();
  return (
    <>
      <FieldRow icon={Crown} id="w-honoree" label="Quinceañera's Name" required
        value={data.honoree_name} onChange={(v) => updateField("honoree_name", smartCapitalize(v))} placeholder="Quinceañera's name" />
      <FieldRow icon={User} id="w-parent" label="Parent/Guardian Name" required
        value={data.parent_name} onChange={(v) => updateField("parent_name", smartCapitalize(v))} placeholder="Parent or guardian name" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow icon={Mail} id="w-parent-email" label="Parent Email" required type="email"
          value={data.parent_email} onChange={(v) => updateField("parent_email", v)} placeholder="parent@example.com" />
        <FieldRow icon={Phone} id="w-parent-phone" label="Parent Phone"
          value={data.parent_phone} onChange={(v) => updateField("parent_phone", formatPhone(v))} placeholder="(555) 123-4567" />
      </div>
    </>
  );
}

function BirthdayFields() {
  const { data, updateField } = useBookingWizard();
  return (
    <>
      <FieldRow icon={PartyPopper} id="w-honoree" label="Honoree's Name" required
        value={data.honoree_name} onChange={(v) => updateField("honoree_name", smartCapitalize(v))} placeholder="Honoree's name" />
      <FieldRow icon={User} id="w-contact" label="Contact Name" required
        value={data.contact_name} onChange={(v) => updateField("contact_name", smartCapitalize(v))} placeholder="Contact person" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow icon={Mail} id="w-contact-email" label="Contact Email" required type="email"
          value={data.contact_email} onChange={(v) => updateField("contact_email", v)} placeholder="contact@example.com" />
        <FieldRow icon={Phone} id="w-contact-phone" label="Contact Phone"
          value={data.contact_phone} onChange={(v) => updateField("contact_phone", formatPhone(v))} placeholder="(555) 123-4567" />
      </div>
    </>
  );
}

function GenericFields() {
  const { data, updateField } = useBookingWizard();
  return (
    <>
      <FieldRow icon={User} id="w-contact" label="Contact Name" required
        value={data.contact_name} onChange={(v) => updateField("contact_name", smartCapitalize(v))} placeholder="Contact person" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldRow icon={Mail} id="w-contact-email" label="Contact Email" required type="email"
          value={data.contact_email} onChange={(v) => updateField("contact_email", v)} placeholder="contact@example.com" />
        <FieldRow icon={Phone} id="w-contact-phone" label="Contact Phone"
          value={data.contact_phone} onChange={(v) => updateField("contact_phone", formatPhone(v))} placeholder="(555) 123-4567" />
      </div>
    </>
  );
}

const TITLE_MAP: Record<string, string> = {
  wedding: "Wedding Contact Info",
  quinceanera: "Quinceañera Contact Info",
  birthday: "Birthday Contact Info",
  sweet_16: "Sweet 16 Contact Info",
};

export function StepClientInfo() {
  const { data, updateField } = useBookingWizard();
  const eventType = data.event_type;
  const title = TITLE_MAP[eventType] || "Contact Information";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>Enter the contact details for this event</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {eventType === "wedding" && <WeddingFields />}
        {eventType === "quinceanera" && <QuinceFields />}
        {(eventType === "birthday" || eventType === "sweet_16") && <BirthdayFields />}
        {!["wedding", "quinceanera", "birthday", "sweet_16"].includes(eventType) && <GenericFields />}

        <div className="space-y-1.5">
          <Label htmlFor="w-notes" className="flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-muted-foreground" /> Notes
          </Label>
          <Textarea
            id="w-notes"
            value={data.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="Any details about this booking…"
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
