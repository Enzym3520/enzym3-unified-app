import { Link } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEventAccess } from "@/hooks/useEventAccess";

interface PortalGateProps {
  children: React.ReactNode;
}

export function PortalGate({ children }: PortalGateProps) {
  const { depositPaid, isVenuePartner, isLoading } = useEventAccess();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (depositPaid || isVenuePartner) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="max-w-sm mx-auto w-full bg-card border rounded-2xl p-8 shadow-lg text-center space-y-5">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Unlock Your Portal</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sign your contract and complete your deposit to access this section.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link to="/app/contract">Go to Contract</Link>
        </Button>
      </div>
    </div>
  );
}
