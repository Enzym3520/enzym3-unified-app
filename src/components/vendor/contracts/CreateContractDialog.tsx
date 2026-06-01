import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssignments } from "@/hooks/use-assignments";
import { useContractTemplates } from "@/hooks/use-contracts";
import { useProfile } from "@/hooks/use-profile";
import { renderContractBody } from "@/utils/contractFields";
import { Eye } from "lucide-react";
import { ContractPreview } from "./ContractPreview";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (data: {
    title: string;
    body_html: string;
    event_id: string | null;
    template_id: string | null;
    signer_email: string;
    signer_name: string;
  }) => void;
  saving?: boolean;
}

export function CreateContractDialog({ open, onOpenChange, onSave, saving }: Props) {
  const { data: assignments } = useAssignments();
  const { data: templates } = useContractTemplates();
  const { data: profile } = useProfile();

  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState<string>("");
  const [templateId, setTemplateId] = useState<string>("");
  const [body, setBody] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signerName, setSignerName] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Reset all fields when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setEventId("");
      setTemplateId("");
      setBody("");
      setSignerEmail("");
      setSignerName("");
      setShowPreview(false);
    }
  }, [open]);

  const selectedEvent = useMemo(
    () => assignments?.find((a) => a.event_id === eventId)?.event,
    [assignments, eventId]
  );

  const vendorData = useMemo(
    () => ({
      vendor_name: profile ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() : "",
      vendor_company: profile?.company_name ?? "",
    }),
    [profile]
  );

  const renderedHtml = useMemo(
    () => renderContractBody(body, selectedEvent, vendorData),
    [body, selectedEvent, vendorData]
  );

  const handleTemplateChange = (id: string) => {
    setTemplateId(id);
    const tpl = templates?.find((t) => t.id === id);
    if (tpl) {
      setBody(tpl.body_html);
      if (!title) setTitle(tpl.name);
    }
  };

  const handleEventChange = (id: string) => {
    setEventId(id);
    const evt = assignments?.find((a) => a.event_id === id)?.event;
    if (evt) {
      setSignerEmail(evt.contact_email ?? "");
      setSignerName(evt.couple_name ?? "");
      if (!title) setTitle(`Contract — ${evt.couple_name}`);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      body_html: renderedHtml,
      event_id: eventId || null,
      template_id: templateId || null,
      signer_email: signerEmail,
      signer_name: signerName,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Contract</DialogTitle>
            <DialogDescription>Create a contract to send to your client for e-signature.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Event</Label>
                <Select value={eventId} onValueChange={handleEventChange}>
                  <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
                  <SelectContent>
                    {assignments?.filter((a) => a.event).map((a) => (
                      <SelectItem key={a.event_id} value={a.event_id}>
                        {a.event.couple_name} — {a.event.event_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Template</Label>
                <Select value={templateId} onValueChange={handleTemplateChange}>
                  <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="c-title">Contract Title</Label>
              <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contract — Smith Wedding" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="c-signer">Client Name</Label>
                <Input id="c-signer" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="c-email">Client Email</Label>
                <Input id="c-email" type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="c-body">Contract Body</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="h-3 w-3 mr-1" /> Preview
                </Button>
              </div>
              <Textarea id="c-body" value={body} onChange={(e) => setBody(e.target.value)} rows={10} className="font-mono text-xs" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? "Saving…" : "Create Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ContractPreview open={showPreview} onOpenChange={setShowPreview} title={title || "Preview"} html={renderedHtml} />
    </>
  );
}
