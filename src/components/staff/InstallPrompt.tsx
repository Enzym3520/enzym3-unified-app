import React from 'react';
import { Download, X, Share, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface IOSInstallModalProps {
  open: boolean;
  onClose: () => void;
}

function IOSInstallModal({ open, onClose }: IOSInstallModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Add to Home Screen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="flex items-start gap-2 bg-destructive/10 text-destructive rounded-md p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium">
              Important: You must open this page in Safari — Chrome on iPhone does not support app installation.
            </p>
          </div>
          <p className="text-muted-foreground">
            Install the Enzym3 app on your iPhone for quick access to your events and meetings.
          </p>
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
                <p className="text-muted-foreground text-xs flex items-center gap-1">
                  <Plus className="h-3 w-3" /> <strong>Add to Home Screen</strong>
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">3</span>
              <div>
                <p className="font-medium">Tap <strong>Add</strong> to confirm</p>
                <p className="text-muted-foreground text-xs">The app icon will appear on your home screen</p>
              </div>
            </li>
          </ol>
          <Button onClick={onClose} className="w-full">Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InstallPrompt() {
  const { canInstall, promptInstall, showIOSInstructions, isAndroid } = useInstallPrompt();
  const { requestPermission } = usePushNotifications();
  const [dismissed, setDismissed] = React.useState(false);
  const [showIOSModal, setShowIOSModal] = React.useState(false);

  const handleInstall = async () => {
    if (showIOSInstructions) {
      setShowIOSModal(true);
      return;
    }
    const installed = await promptInstall();
    if (installed) {
      setTimeout(() => {
        requestPermission();
      }, 1000);
    }
  };

  // Show on Android (canInstall) or iOS (showIOSInstructions) — but not if dismissed
  if ((!canInstall && !showIOSInstructions) || dismissed) return null;

  const subtextMessage = showIOSInstructions
    ? '📱 Must use Safari to install'
    : isAndroid
      ? '📱 Use Chrome for best results'
      : 'Add to your home screen for quick access, offline use, and push notifications';

  const descriptionMessage = showIOSInstructions
    ? 'Open this page in Safari, then tap How to Install'
    : isAndroid
      ? 'Tap Install below to add the app from Chrome'
      : 'Add to your home screen for quick access, offline use, and push notifications';

  return (
    <>
      <IOSInstallModal open={showIOSModal} onClose={() => setShowIOSModal(false)} />
      <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm animate-slide-up md:max-w-md md:left-auto md:right-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Install Enzym3 App</h3>
              <p className="text-xs text-muted-foreground mb-1">
                {descriptionMessage}
              </p>
              <p className="text-xs font-medium text-foreground/70 mb-3">
                {subtextMessage}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="text-xs"
                >
                  {showIOSInstructions ? 'How to Install' : 'Install'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissed(true)}
                  className="text-xs"
                >
                  Not now
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 self-start"
              onClick={() => setDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
