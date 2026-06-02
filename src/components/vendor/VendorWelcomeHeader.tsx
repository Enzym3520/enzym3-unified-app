import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, DollarSign, CalendarOff } from "lucide-react";
import { Link } from "react-router-dom";

interface VendorWelcomeHeaderProps {
  firstName: string | null;
  pendingCount: number;
  upcomingCount: number;
}

export function VendorWelcomeHeader({ firstName, pendingCount, upcomingCount }: VendorWelcomeHeaderProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const subtitle = upcomingCount > 0
    ? `You have ${upcomingCount} upcoming event${upcomingCount !== 1 ? "s" : ""}`
    : "No upcoming events — enjoy the break ✨";

  return (
    <div className="space-y-3">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {greeting}, {firstName || "there"}!
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {pendingCount > 0 && (
          <Button variant="default" size="sm" className="text-xs h-8 gap-1.5" asChild>
            <Link to="/vendor/booking-requests"><CheckCircle className="h-3.5 w-3.5" /> Confirm Events ({pendingCount})</Link>
          </Button>
        )}
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" asChild>
          <Link to="/vendor/documents"><FileText className="h-3.5 w-3.5" /> Documents</Link>
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" asChild>
          <Link to="/vendor/earnings"><DollarSign className="h-3.5 w-3.5" /> Earnings</Link>
        </Button>
        <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5" asChild>
          <Link to="/vendor/availability"><CalendarOff className="h-3.5 w-3.5" /> Availability</Link>
        </Button>
      </div>
    </div>
  );
}
