import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { capitalizeWords } from "@/lib/utils";
import { formatPackageType, parseLocalDate } from "@/lib/formatters";
import { 
  getClientLabel, 
  getCountdownText, 
  getDetailsCardTitle,
  normalizeEventType,
  getPortalDisplayName
} from "@/lib/eventUtils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { useNavigate } from "react-router-dom";
import { 
  Music, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Upload, 
  Settings, 
  Heart,
  MapPin,
  Mail,
  Phone,
  User,
  FileText,
  Download,
  PartyPopper,
  Crown,
  Video
} from "lucide-react";
import FlipCountdown from "@/components/FlipCountdown";
import ProgressTracker from "@/components/ProgressTracker";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import { toast } from "sonner";

const Dashboard = () => {
  const { event: wedding, loading: eventLoading, refetch } = useClientEvent<any>(
    'id, couple_name, event_date, venue, event_type, contact_email, contact_phone, guest_count, package_type, booking_source, payment_required, deposit_paid, contract_signed, file_uploaded, coordinator_name, primary_contact_name'
  );
  const navigate = useNavigate();
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [vibeSheet, setVibeSheet] = useState<any>(null);
  const [upgradeOrders, setUpgradeOrders] = useState<any[]>([]);
  const [daysUntilWedding, setDaysUntilWedding] = useState<number | null>(null);
  const [coordinatorUploads, setCoordinatorUploads] = useState<any[]>([]);
  const [, setHasBooking] = useState(false);
  const [todayMeeting, setTodayMeeting] = useState<{ time: string; link: string | null } | null>(null);

  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const paymentWeddingId = searchParams.get('wedding_id');

  // Load dashboard details when wedding data is available
  useEffect(() => {
    if (eventLoading) return;
    if (!wedding) { setDetailsLoading(false); return; }

    let cancelled = false;
    const loadDetails = async () => {
      setDetailsLoading(true);
      try {
        if (wedding.event_date) {
          const eventDate = parseLocalDate(wedding.event_date);
          const today = new Date();
          const diffTime = eventDate.getTime() - today.getTime();
          if (!cancelled) setDaysUntilWedding(Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        const [vibeResult, upgradesResult, detailFormsResult, bookingResult] = await Promise.all([
          supabase.from('vibe_sheets').select('*').eq('wedding_id', wedding.id).maybeSingle(),
          supabase.from('upgrade_orders').select('*').eq('wedding_id', wedding.id).order('created_at', { ascending: false }),
          supabase.from('uploaded_details_forms').select('*').eq('wedding_id', wedding.id).order('uploaded_at', { ascending: false }),
          supabase.from('bookings').select('id, booking_date, booking_time, meeting_link, status')
            .eq('wedding_id', wedding.id).in('status', ['confirmed', 'pending'])
            .order('booking_date', { ascending: true }).limit(1).maybeSingle(),
        ]);

        if (cancelled) return;

        setVibeSheet(vibeResult.data);
        setUpgradeOrders(upgradesResult.data || []);
        setCoordinatorUploads(detailFormsResult.data || []);
        setHasBooking(!!bookingResult.data);

        if (bookingResult.data) {
          const today = new Date();
          const bookingDate = new Date(bookingResult.data.booking_date + 'T00:00:00');
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          if (bookingDate.getTime() === todayDate.getTime() && bookingResult.data.booking_time) {
            const [h, m] = bookingResult.data.booking_time.split(':');
            const d = new Date();
            d.setHours(Number(h), Number(m));
            setTodayMeeting({
              time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              link: bookingResult.data.meeting_link,
            });
          } else {
            setTodayMeeting(null);
          }
        } else {
          setTodayMeeting(null);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
        if (!cancelled) toast.error('Failed to load dashboard data');
      } finally {
        if (!cancelled) setDetailsLoading(false);
      }
    };

    loadDetails();
    return () => { cancelled = true; };
  }, [wedding, eventLoading]);

  // Verify deposit payment when redirected back from Stripe
  useEffect(() => {
    if (paymentStatus === 'success' && paymentWeddingId) {
      toast.success("Payment received! Verifying deposit...");
      window.history.replaceState({}, '', '/app/dashboard');

      const verifyPayment = async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const { data, error } = await supabase.functions.invoke('verify-deposit-payment', {
              body: { wedding_id: paymentWeddingId },
            });
            if (error) throw error;
            if (data?.verified) {
              toast.success("Deposit confirmed! Your portal is now unlocked.");
              refetch();
              return;
            }
          } catch (err) {
            console.error('Verify attempt failed:', err);
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        toast.error("Could not verify payment automatically. Please refresh.");
      };
      verifyPayment();
    }
  }, [paymentStatus, paymentWeddingId, refetch]);

  const handleFileDownload = async (file: any) => {
    try {
      // Try vendor-uploads bucket first
      const { data, error } = await supabase.storage
        .from('vendor-uploads')
        .download(file.file_path);

      if (error) {
        // Try wedding-files bucket if first one fails
        const { data: data2, error: error2 } = await supabase.storage
          .from('wedding-files')
          .download(file.file_path);
        
        if (error2) throw error2;
        
        const url = URL.createObjectURL(data2);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file_name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  const loading = eventLoading || detailsLoading;

  useEffect(() => {
    if (!eventLoading && !wedding) {
      navigate('/app/settings', { replace: true });
    }
  }, [eventLoading, wedding, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Vibe Sheet",
      description: vibeSheet?.submitted_at 
        ? "View or update your vibe sheet" 
        : "Complete your music preferences",
      icon: Music,
      path: "/app/vibe-sheet",
      status: vibeSheet?.submitted_at ? "Submitted" : "Pending",
      statusVariant: vibeSheet?.submitted_at ? "secondary" : "outline"
    },
    {
      title: "Upgrades",
      description: "Browse and request upgrades",
      icon: Sparkles,
      path: "/app/upgrades",
      status: upgradeOrders.length > 0 ? `${upgradeOrders.length} Request${upgradeOrders.length > 1 ? 's' : ''}` : "None",
      statusVariant: upgradeOrders.length > 0 ? "secondary" : "outline"
    },
    {
      title: "Schedule Meeting",
      description: "Book your final details meeting",
      icon: CalendarIcon,
      path: "/app/schedule"
    },
    {
      title: "Upload Files",
      description: "Share documents securely",
      icon: Upload,
      path: "/app/uploads"
    }
  ];

  const eventType = wedding?.event_type;
  const eventIcon = normalizeEventType(eventType) === 'wedding' 
    ? Heart 
    : normalizeEventType(eventType) === 'quince' 
      ? Crown 
      : PartyPopper;
  const EventIcon = eventIcon;

  return (
    // Tour step: portalTourSteps.ts — "Welcome to Your Portal"
    <div className="space-y-6 max-w-5xl mx-auto" data-tour="dashboard-welcome">
      {/* Today's Meeting Banner */}
      {todayMeeting && (
        <Card className="card-luxury border-primary/60 bg-primary/5 cursor-pointer" onClick={() => navigate('/app/meeting')}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Video className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Your meeting starts at {todayMeeting.time}</p>
                  <p className="text-sm text-muted-foreground">Tap to open Meeting Room</p>
                </div>
              </div>
              <Button size="sm" onClick={(e) => { e.stopPropagation(); navigate('/app/meeting'); }}>
                Join Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <PwaInstallBanner />

      {/* Tour step: portalTourSteps.ts — "Countdown" */}
      <Card className="card-luxury bg-background border-primary/20 overflow-hidden" data-tour="countdown-card">
        <CardContent className="pt-6 pb-6 landscape:pt-4 landscape:pb-4">
          {wedding?.event_date ? (
            <div className="flex flex-col items-center gap-6">
              {/* Header with icon and couple name */}
              <div className="flex items-center gap-3 text-center">
                <EventIcon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{capitalizeWords(getPortalDisplayName(wedding.event_type, wedding.couple_name, wedding.primary_contact_name))}</p>
                  <p className="text-sm text-muted-foreground">
                    {parseLocalDate(wedding.event_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {/* Flip countdown */}
              <FlipCountdown 
                targetDate={parseLocalDate(wedding.event_date)} 
                eventType={eventType}
              />
              
              {/* Subtitle */}
              <p className="text-sm text-muted-foreground text-center">
                {getCountdownText(eventType, daysUntilWedding || 0)}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <EventIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-muted-foreground">Your countdown will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracker */}
      <ProgressTracker
        contractSigned={!!wedding?.contract_signed}
        depositPaid={!!wedding?.deposit_paid}
        vibeSheetCompleted={!!vibeSheet?.submitted_at}
        bookingSource={wedding?.booking_source}
        paymentRequired={wedding?.payment_required}
        hasUpgrades={upgradeOrders.length > 0}
        hasUnpaidUpgrades={upgradeOrders.some((o: any) => o.payment_status !== 'paid')}
        eventDate={wedding?.event_date}
      />

      {/* Tour step: portalTourSteps.ts — "Your Event Details" */}
      <Card className="card-luxury" data-tour="wedding-details">
        <CardHeader className="landscape:py-4">
          <CardTitle className="landscape:text-lg">{getDetailsCardTitle(eventType)}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 landscape:space-y-2 landscape:p-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{capitalizeWords(wedding.couple_name)}</p>
              <p className="text-sm text-muted-foreground">{getClientLabel(eventType)}</p>
            </div>
          </div>
          {wedding.venue && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{wedding.venue}</p>
                <p className="text-sm text-muted-foreground">Venue</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">{wedding.contact_email}</p>
              <p className="text-sm text-muted-foreground">Email</p>
            </div>
          </div>
          {wedding.contact_phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{wedding.contact_phone}</p>
                <p className="text-sm text-muted-foreground">Phone</p>
              </div>
            </div>
          )}
          {wedding.package_type && (
            <div className="pt-2">
              <Badge variant="secondary">{formatPackageType(wedding.package_type)} Package</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour step: portalTourSteps.ts — "Detail Forms from Coordinator" */}
      <Card className="card-luxury" data-tour="coordinator-files">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detail Forms from Your Coordinator</CardTitle>
              <CardDescription className="mt-1.5">
                Important documents uploaded by {wedding?.coordinator_name || 'your coordinator'}
              </CardDescription>
            </div>
            {coordinatorUploads.length > 0 && (
              <Badge variant="secondary">
                {coordinatorUploads.length} File{coordinatorUploads.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {coordinatorUploads.length > 0 ? (
            <div className="space-y-3">
              {coordinatorUploads.slice(0, 3).map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.file_name}</p>
                      {file.notes && (
                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{file.notes}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(file.uploaded_at || file.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleFileDownload(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {coordinatorUploads.length > 3 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  and {coordinatorUploads.length - 3} more file{coordinatorUploads.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No files uploaded yet</p>
              <p className="text-xs mt-1">
                Your coordinator will upload important detail forms here when ready
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tour step: portalTourSteps.ts — "Quick Actions" */}
      <div className="grid landscape:grid-cols-2 md:grid-cols-2 gap-4 landscape:gap-3" data-tour="quick-actions">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card
              key={action.path}
              className="card-luxury cursor-pointer"
              onClick={() => navigate(action.path)}
            >
              <CardHeader className="landscape:p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                  {action.status && (
                    <Badge variant={action.statusVariant as any}>
                      {action.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Settings Quick Link */}
      <Card className="card-luxury">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Need to update your contact information?
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/app/settings')}
            >
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
