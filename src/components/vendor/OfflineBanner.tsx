import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-offline";

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  if (isOnline) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive px-4 py-1.5 text-xs font-medium border-b border-destructive/20">
      <WifiOff className="h-3.5 w-3.5" />
      <span>You're offline — changes will sync when reconnected</span>
    </div>
  );
}
