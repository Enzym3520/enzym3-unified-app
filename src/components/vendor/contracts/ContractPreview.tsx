import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DOMPurify from "dompurify";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  html: string;
}

export function ContractPreview({ open, onOpenChange, title, html }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div
          className="prose prose-sm dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
        />
      </DialogContent>
    </Dialog>
  );
}
