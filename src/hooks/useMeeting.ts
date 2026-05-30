import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { toast } from "sonner";

export interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  meeting_type: string;
  meeting_format: string | null;
  meeting_link: string | null;
  status: string;
  customer_notes: string | null;
}

export interface WeddingData {
  id: string;
  couple_name: string;
  event_date: string;
  event_type: string;
  venue: string | null;
  guest_count: number | null;
  hours_booked: number | null;
  package_type: string | null;
  coordinator_name: string | null;
  contract_signed: boolean | null;
  deposit_paid: boolean | null;
  file_uploaded: boolean | null;
  primary_contact_name: string | null;
}

export interface MeetingSummary {
  id: string;
  ai_summary: string | null;
  action_items: ActionItem[];
  raw_transcript: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
}

export interface ActionItem {
  task: string;
  responsible: string;
  priority: string;
  deadline?: string;
}

export type UpcomingState = "none" | "upcoming" | "today";

export function useMeeting() {
  const { event: weddingData, loading: eventLoading, user } = useClientEvent<WeddingData>(
    "id, couple_name, event_date, event_type, venue, guest_count, hours_booked, package_type, coordinator_name, contract_signed, deposit_paid, file_uploaded, primary_contact_name"
  );
  const navigate = useNavigate();
  const location = useLocation();
  const isVendorPortal = location.pathname.startsWith('/vendor-portal/');
  const vendorPortalMatch = location.pathname.match(/^\/vendor-portal\/([^/]+)/);
  const basePath = isVendorPortal && vendorPortalMatch ? `/vendor-portal/${vendorPortalMatch[1]}` : '/app';

  const [meetingLoading, setMeetingLoading] = useState(true);
  const [upcomingBooking, setUpcomingBooking] = useState<Booking | null>(null);
  const [pastBooking, setPastBooking] = useState<Booking | null>(null);
  const [upcomingState, setUpcomingState] = useState<UpcomingState>("none");
  const [countdown, setCountdown] = useState("");
  const [vibeSheetDone, setVibeSheetDone] = useState(false);
  const [jaasToken, setJaasToken] = useState<string | null>(null);
  const [jaasRoomUrl, setJaasRoomUrl] = useState<string | null>(null);
  const [jaasLoading, setJaasLoading] = useState(false);
  const [pastSummary, setPastSummary] = useState<MeetingSummary | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [resending, setResending] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [coordinatorUploads, setCoordinatorUploads] = useState<any[]>([]);

  const loading = eventLoading || meetingLoading;

  // Load meeting details when event data is available
  useEffect(() => {
    if (eventLoading) return;
    if (!weddingData) { setMeetingLoading(false); return; }

    const loadDetails = async () => {
      try {
        // Vendor name
        const { data: assignment } = await supabase.from('event_dj_assignments')
          .select('dj_user_id, profiles:dj_user_id(first_name, last_name, company_name)')
          .eq('event_id', weddingData.id).in('status', ['confirmed', 'pending']).limit(1).maybeSingle();
        if (assignment) {
          const p = assignment.profiles as any;
          if (p) setVendorName(p.company_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || null);
        }

        const todayStr = new Date().toISOString().split('T')[0];

        const { data: upcomingRow } = await supabase.from("bookings")
          .select("id, booking_date, booking_time, meeting_type, meeting_format, meeting_link, status, customer_notes")
          .eq("wedding_id", weddingData.id).in("status", ["confirmed", "pending", "scheduled"])
          .gte("booking_date", todayStr).order("booking_date", { ascending: true })
          .limit(1).maybeSingle();

        const { data: completedRow } = await supabase.from("bookings")
          .select("id, booking_date, booking_time, meeting_type, meeting_format, meeting_link, status, customer_notes")
          .eq("wedding_id", weddingData.id).eq("status", "completed")
          .order("booking_date", { ascending: false }).limit(1).maybeSingle();

        if (upcomingRow) {
          setUpcomingBooking(upcomingRow);
          const today = new Date();
          const bookingDate = new Date(upcomingRow.booking_date + "T00:00:00");
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

          if (bookingDate.getTime() === todayDate.getTime()) {
            const [hours, minutes] = upcomingRow.booking_time.split(':').map(Number);
            const meetingDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
            const meetingEndWindow = new Date(meetingDateTime.getTime() + 2 * 60 * 60 * 1000);
            if (today < meetingEndWindow) { setUpcomingState("today"); }
            else { setUpcomingState("none"); setPastBooking(upcomingRow); loadSummary(upcomingRow.id); }
          } else { setUpcomingState("upcoming"); }
        } else { setUpcomingState("none"); }

        if (completedRow) {
          setPastBooking(completedRow);
          loadSummary(completedRow.id);
        }

        const { data: detailFormsData } = await supabase.from('uploaded_details_forms')
          .select('*').eq('wedding_id', weddingData.id).order('uploaded_at', { ascending: false });
        setCoordinatorUploads(detailFormsData || []);

        const { data: vibeData } = await supabase.from("vibe_sheets")
          .select("submitted_at").eq("wedding_id", weddingData.id).maybeSingle();
        setVibeSheetDone(!!vibeData?.submitted_at);
      } catch (error) {
        console.error("Error loading meeting data:", error);
        toast.error("Failed to load meeting data");
      } finally { setMeetingLoading(false); }
    };

    loadDetails();
  }, [weddingData, eventLoading]);

  const loadSummary = async (bookingId: string) => {
    const { data } = await supabase.from("meeting_summaries")
      .select("id, ai_summary, action_items, raw_transcript, status, sent_at, created_at")
      .eq("booking_id", bookingId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (data) setPastSummary({ ...data, action_items: (data.action_items as unknown as ActionItem[]) || [] });
  };

  const handleResendSummary = async () => {
    if (!pastSummary) return;
    setResending(true);
    try {
      const res = await supabase.functions.invoke('send-meeting-summary', { body: { summaryId: pastSummary.id } });
      if (res.error) throw res.error;
      toast.success("Summary email resent!");
    } catch { toast.error("Failed to resend summary"); }
    finally { setResending(false); }
  };

  // JaaS token
  useEffect(() => {
    if (!upcomingBooking || upcomingState !== "today") return;
    const fetchJaasToken = async () => {
      setJaasLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const res = await supabase.functions.invoke('jaas-token', { body: { bookingId: upcomingBooking.id } });
        if (res.error) { console.error('JaaS token error:', res.error); toast.error('Failed to connect to video meeting'); return; }
        setJaasToken(res.data.token);
        setJaasRoomUrl(res.data.roomUrl);
      } catch (err) { console.error('JaaS token fetch failed:', err); toast.error('Failed to set up video meeting'); }
      finally { setJaasLoading(false); }
    };
    fetchJaasToken();
  }, [upcomingBooking, upcomingState]);

  // Countdown timer
  useEffect(() => {
    if (!upcomingBooking || upcomingState === "none") return;
    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = upcomingBooking.booking_time.split(":").map(Number);
      const meetingDate = new Date(upcomingBooking.booking_date + "T00:00:00");
      meetingDate.setHours(hours, minutes, 0, 0);
      const diff = meetingDate.getTime() - now.getTime();
      if (diff <= 0) { setCountdown("Meeting time!"); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [upcomingBooking, upcomingState]);

  const handleJoinMeeting = () => {
    const url = jaasRoomUrl && jaasToken ? `${jaasRoomUrl}#jwt=${jaasToken}` : upcomingBooking?.meeting_link;
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDownloadFile = async (file: any) => {
    try {
      const { data, error } = await supabase.storage.from('vendor-uploads').download(file.file_path);
      if (error) {
        const { data: data2, error: error2 } = await supabase.storage.from('wedding-files').download(file.file_path);
        if (error2) throw error2;
        triggerDownload(data2, file.file_name);
      } else {
        triggerDownload(data, file.file_name);
      }
      toast.success('File downloaded successfully!');
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error('Failed to download file');
    }
  };

  return {
    loading, upcomingBooking, pastBooking, weddingData, upcomingState, countdown,
    vibeSheetDone, jaasToken, jaasRoomUrl, jaasLoading,
    pastSummary, showTranscript, setShowTranscript, resending,
    vendorName, coordinatorUploads, isVendorPortal, basePath,
    navigate, handleJoinMeeting, handleResendSummary, handleDownloadFile,
  };
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
