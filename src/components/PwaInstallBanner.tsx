import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, X, Share } from "lucide-react";
import { usePwaInstall } from "@/hooks/usePwaInstall";

export default function PwaInstallBanner() {
  const { canInstall, isIOS, showBanner, promptInstall, dismiss } = usePwaInstall();

  if (!showBanner) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">Install App</p>
          {isIOS ? (
            <p className="text-xs text-muted-foreground">
              Tap <Share className="inline h-3 w-3 -mt-0.5" /> Share, then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Get quick access from your home screen
            </p>
          )}
        </div>
        {canInstall && (
          <Button size="sm" onClick={promptInstall}>
            Install
          </Button>
        )}
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
