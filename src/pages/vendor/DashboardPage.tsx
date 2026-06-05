import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { parseEventDate } from '@/utils/vendorHelpers';
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Award, Download, CheckCircle, FileText, Palette, CalendarOff, UserCircle, Package, Bell, X, Plus, Radio, Inbox, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useInstallPrompt } from "@/hooks/vendor-use-install-prompt";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { EventList } from "@/components/vendor/dashboard/EventList";
import { useAchievements } from "@/hooks/use-achievements";
import { useAssignments } from "@/hooks/use-assignments";
import { useProfile } from "@/hooks/use-profile";
import { useServices } from "@/hooks/use-services";
import { useVendorPage } from "@/hooks/use-vendor-page";
import { useBlackoutDates, useAvailabilityBlocks } from "@/hooks/use-availability";
import { VendorWelcomeHeader } from "@/components/vendor/VendorWelcomeHeader";
import { VendorDashboardStats } from "@/components/vendor/VendorDashboardStats";
import { NextEventCard } from "@/components/vendor/NextEventCard";
import { VendorEventDetails } from "@/components/vendor/VendorEventDetails";
import { IOSInstallModal } from "@/components/vendor/IOSInstallModal";
import { format, startOfDay } from "date-fns";
import type { VendorAssignment } from "@/types";
import { ACHIEVEMENT_ICONS } from "@/types";

function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
      </div>
    </div>
  );
}

function AchievementsCard() {
  const { data: achievements = [], isLoading } = useAchievements();
  if (isLoading || achievements.length === 0) return null;
  return (
    <Card className="card-luxury">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />Achievements
        </CardTitle>
        <CardDescription>Milestones you've earned</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {achievements.slice(0, 5).map((a) => (
          <div key={a.id} className="flex items-center gap-3 rounded-lg border p-3">
            <span className="text-xl">{ACHIEVEMENT_ICONS[a.achievement_type] ?? "🏅"}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{a.achievement_name}</p>
              {a.description && <p className="text-xs text-muted-foreground truncate">{a.description}</p>}
            </div>
            {a.earned_at && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                {format(new Date(a.earned_at), "MMM yyyy")}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

interface SetupStep {
  label: string;
  done: boolean;
  href: string;
  icon: React.ElementType;
}

function QuickActions({ pendingCount }: { pendingCount: number }) {
  const navigate = useNavigate();
  const actions = [
    { icon: Plus, label: "New Booking", desc: "Create booking", onClick: () => navigate("/vendor/new-booking"), accent: false },
    { icon: Radio, label: "Go Live", desc: "Song requests", onClick: () => navigate("/vendor/live"), accent: true },
    { icon: Inbox, label: "Requests", desc: pendingCount > 0 ? `${pendingCount} pending` : "View all", onClick: () => navigate("/vendor/booking-requests"), accent: pendingCount > 0 },
    { icon: Users, label: "My Clients", desc: "Contact & history", onClick: () => navigate("/vendor/clients"), accent: false },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors hover:bg-accent/50 active:scale-95 ${a.accent ? "border-primary/40 bg-primary/5" : "bg-card"}`}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${a.accent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            <a.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">{a.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const completed = steps.filter((s) => s.done).length;
  if (completed === steps.length) return null;

  return (
    <Card className="card-luxury border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">🚀 Get Started</CardTitle>
        <CardDescription>{completed}/{steps.length} steps complete</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {steps.map((s) => (
          <Link
            key={s.label}
            to={s.href}
            className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 ${s.done ? "opacity-60" : ""}`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {s.done ? <CheckCircle className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className={`text-sm font-medium ${s.done ? "line-through text-muted-foreground" : ""}`}>{s.label}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { canPrompt, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<VendorAssignment | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { supported: pushSupported, permission: pushPermission, isSubscribed: pushSubscribed, subscribe: subscribePush, loading: pushLoading } = usePushNotifications();
  const [pushPromptDismissed, setPushPromptDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("push-prompt-dismissed") === "1"
  );
  const showPushPrompt = pushSupported && pushPermission === "default" && !pushSubscribed && !pushPromptDismissed;
  const dismissPushPrompt = () => {
    localStorage.setItem("push-prompt-dismissed", "1");
    setPushPromptDismissed(true);
  };

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: services = [] } = useServices();
  const { data: vendorPage } = useVendorPage();
  const { data: blackouts = [] } = useBlackoutDates();
  const { data: availBlocks = [] } = useAvailabilityBlocks();

  const isLoading = profileLoading || assignmentsLoading;

  // Auto-open event details from ?event=<assignment_id or event_id> URL param
  useEffect(() => {
    const eventParam = searchParams.get("event");
    if (!eventParam || assignments.length === 0) return;
    const match = assignments.find(
      (a) => a.id === eventParam || a.event?.id === eventParam
    );
    if (match) {
      setDetailAssignment(match);
      // Clean the URL so refresh doesn't re-open
      searchParams.delete("event");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, assignments, setSearchParams]);

  const pendingCount = assignments.filter((a) => a.status === "assigned" || a.status === "pending").length;
  const todayStart = startOfDay(new Date());
  const upcomingCount = assignments.filter(
    (a) => a.status === "confirmed" && a.event?.event_date && parseEventDate(a.event.event_date) >= todayStart
  ).length;

  // Setup checklist for new vendors
  const setupSteps: SetupStep[] = [
    { label: "Complete your profile", done: !!(profile?.first_name && profile?.company_name), href: "/vendor/profile", icon: UserCircle },
    { label: "Add services & pricing", done: (services?.length ?? 0) > 0, href: "/vendor/services", icon: Package },
    { label: "Set up your vendor page", done: !!vendorPage, href: "/vendor/my-page", icon: Palette },
    { label: "Set your availability", done: blackouts.length > 0 || availBlocks.length > 0, href: "/vendor/availability", icon: CalendarOff },
  ];

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <VendorWelcomeHeader
        firstName={profile?.first_name ?? null}
        pendingCount={pendingCount}
        upcomingCount={upcomingCount}
      />

      <QuickActions pendingCount={pendingCount} />

      {showPushPrompt && (
        <Card className="card-luxury border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <Bell className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Enable notifications</p>
              <p className="text-sm text-muted-foreground">
                Get instant alerts for new bookings, messages, and meetings.
              </p>
            </div>
            <Button size="sm" onClick={subscribePush} disabled={pushLoading}>
              {pushLoading ? "Enabling..." : "Enable"}
            </Button>
            <Button size="icon" variant="ghost" onClick={dismissPushPrompt} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <NextEventCard
        assignments={assignments}
        onViewDetails={(a) => setDetailAssignment(a)}
      />

      {user && <VendorDashboardStats vendorId={user.id} />}

      {!isInstalled && (canPrompt || isIOS) && (
        <Card className="card-luxury border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <Download className="h-8 w-8 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Install the App</p>
              <p className="text-sm text-muted-foreground">
                {isIOS ? "Add to your home screen for the best experience." : "Get quick access from your home screen."}
              </p>
            </div>
            {canPrompt && <Button size="sm" onClick={promptInstall}>Install</Button>}
            {isIOS && <Button size="sm" variant="outline" onClick={() => setIosModalOpen(true)}>How?</Button>}
          </CardContent>
        </Card>
      )}

      <SetupChecklist steps={setupSteps} />

      <AchievementsCard />

      <EventList onViewDetails={(a) => setDetailAssignment(a)} />

      <IOSInstallModal open={iosModalOpen} onClose={() => setIosModalOpen(false)} />

      {detailAssignment && (
        <VendorEventDetails
          assignment={detailAssignment}
          open={!!detailAssignment}
          onOpenChange={(open) => { if (!open) setDetailAssignment(null); }}
        />
      )}
    </div>
  );
}
