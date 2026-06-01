import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus } from "lucide-react";

interface IOSInstallModalProps {
  open: boolean;
  onClose: () => void;
}

export function IOSInstallModal({ open, onClose }: IOSInstallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Download className="h-5 w-5" /> Add to Home Screen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">Install the vendor portal on your iPhone for instant access to your events and meetings.</p>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
              <div>
                <p className="font-medium">Tap the Share button</p>
                <p className="text-muted-foreground text-xs">The <Share className="inline h-3 w-3" /> icon at the bottom of Safari</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
              <div>
                <p className="font-medium">Scroll down and tap</p>
                <p className="text-muted-foreground text-xs flex items-center gap-1"><Plus className="h-3 w-3" /> <strong>Add to Home Screen</strong></p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
              <div>
                <p className="font-medium">Tap <strong>Add</strong> to confirm</p>
                <p className="text-muted-foreground text-xs">The Enzym3 app icon appears on your home screen</p>
              </div>
            </li>
          </ol>
          <Button onClick={onClose} className="w-full">Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
