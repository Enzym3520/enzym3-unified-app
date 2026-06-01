import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CONTRACT_PLACEHOLDERS } from "@/utils/contractFields";
import { Badge } from "@/components/ui/badge";
import type { ContractTemplate } from "@/hooks/use-contracts";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template?: ContractTemplate | null;
  onSave: (data: { id?: string; name: string; body_html: string; is_default: boolean }) => void;
  saving?: boolean;
}

export function ContractTemplateEditor({ open, onOpenChange, template, onSave, saving }: Props) {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Reset state when dialog opens or template changes
  useEffect(() => {
    if (open) {
      setName(template?.name ?? "");
      setBody(template?.body_html ?? "");
      setIsDefault(template?.is_default ?? false);
    }
  }, [open, template?.id]);

  const insertPlaceholder = (key: string) => {
    setBody((prev) => prev + key);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ id: template?.id, name: name.trim(), body_html: body, is_default: isDefault });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="tpl-name">Template Name</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Standard DJ Contract" />
          </div>

          <div>
            <Label>Smart Fields</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {CONTRACT_PLACEHOLDERS.map((p) => (
                <Badge
                  key={p.key}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 text-xs"
                  onClick={() => insertPlaceholder(p.key)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="tpl-body">Contract Body (HTML)</Label>
            <Textarea
              id="tpl-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={14}
              className="font-mono text-xs"
              placeholder="<h2>SERVICE AGREEMENT</h2>&#10;&#10;This agreement is between {{vendor_company}} and {{couple_name}}..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} id="tpl-default" />
            <Label htmlFor="tpl-default">Set as default template</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? "Saving…" : "Save Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
