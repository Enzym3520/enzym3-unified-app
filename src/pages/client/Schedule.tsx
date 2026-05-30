import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock } from "lucide-react";
import { BookingCalendar } from "@/components/BookingCalendar";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { BookingForm } from "@/components/BookingForm";
import { StaffSelectionCards, StaffMember } from "@/components/StaffSelectionCards";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { logAction } from "@/lib/activityLogger";
import { useToast } from "@/hooks/use-toast";

const Schedule = () => {
  const navigate = useNavigate();
  const { event: eventData, loading: eventLoading, user } = useClientEvent<{ id: string; coordinator_name: string | null }>("id, coordinator_name");
  const [step, setStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember>();
  const [loadingStaff, setLoadingStaff] = useState(true);
  const { toast } = useToast();

  const eventId = eventData?.id;

  useEffect(() => {
    if (eventLoading) return;
    if (!eventData) { setLoadingStaff(false); return; }

    const loadStaff = async () => {
      setLoadingStaff(true);
      try {
        const members: StaffMember[] = [];

        const { data: assignments } = await supabase
          .from('event_dj_assignments')
          .select('dj_user_id, profiles:dj_user_id(first_name, last_name, company_name)')
          .eq('event_id', eventData.id)
          .in('status', ['confirmed', 'pending']);

        if (assignments) {
          for (const a of assignments) {
            const p = a.profiles as any;
            const name = p?.company_name || `${p?.first_name || ''} ${p?.last_name || ''}`.trim() || 'Your DJ';
            members.push({ id: a.dj_user_id, name, role: 'vendor', roleLabel: 'Your DJ' });
          }
        }

        if (eventData.coordinator_name) {
          members.push({ id: null, name: eventData.coordinator_name, role: 'coordinator', roleLabel: 'Your Coordinator' });
        }

        setStaffMembers(members);
        if (members.length === 1) {
          setSelectedStaff(members[0]);
          setStep(1);
        }
      } catch (error) {
        console.error('Error loading staff:', error);
      } finally {
        setLoadingStaff(false);
      }
    };

    loadStaff();
  }, [eventData, eventLoading]);

  const handleStaffSelect = (member: StaffMember) => {
    setSelectedStaff(member);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setStep(1);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(undefined);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep(2);
  };

  const handleSuccess = async () => {
    setStep(3);
    if (user && eventId) {
      await logAction(eventId, "booked meeting", user.id, user.email || "Unknown", "Schedule");
    }
  };

  const handleBackToStaffSelect = () => {
    setSelectedStaff(undefined);
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setStep(0);
  };

  const handleBackToStep1 = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setStep(1);
  };

  if (!eventId && !loadingStaff && !eventLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <Calendar className="h-14 w-14 text-muted-foreground/50 mx-auto" />
            <h2 className="text-xl font-semibold">Profile Setup Required</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Before you can schedule a meeting, we need a few details about your event.
            </p>
            <Link to="/app/profile-setup">
              <Button className="mt-2">Complete Profile Setup</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSteps = staffMembers.length > 1 ? 4 : 3;
  const progressStep = staffMembers.length > 1 ? step : step > 0 ? step - 1 : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto" data-tour="schedule-intro">
      <div>
        <h1 className="text-3xl font-bold">
          {selectedStaff
            ? `Schedule a Meeting with ${selectedStaff.name}`
            : 'Schedule Your Meeting'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {selectedStaff
            ? `Book a time to meet with ${selectedStaff.name} about your event`
            : "Select who you\u2019d like to meet with"}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-16 rounded-full transition-colors ${
              progressStep >= i ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Step 0: Staff selection (only if multiple staff) */}
      {step === 0 && staffMembers.length > 1 && (
        <StaffSelectionCards staff={staffMembers} onSelect={handleStaffSelect} />
      )}

      {step === 1 && (
        <>
          {staffMembers.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleBackToStaffSelect}>
              ← Change Team Member
            </Button>
          )}
          <Card className="bg-primary/10 dark:bg-primary/10 border-primary/20 dark:border-primary/20">
            <CardContent className="py-4">
              <p className="text-sm">
                <strong>Standard availability:</strong> Tuesday through Saturday (10 AM - 3 PM Arizona Time).
                If these days don't work for you, please <Link to="/app/contact" className="text-primary font-semibold hover:underline">contact us</Link> to request an alternative time.
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-4 md:p-6 border shadow-sm overflow-hidden" data-tour="calendar-view">
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
              
              <div className="border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6" data-tour="time-slots">
                {selectedDate ? (
                  <TimeSlotPicker
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onTimeSelect={handleTimeSelect}
                    vendorId={selectedStaff?.id ?? undefined}
                  />
                ) : (
                  <div className="h-full min-h-[200px] sm:min-h-[300px] flex flex-col items-center justify-center">
                    <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Select a date to see available times
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {step === 2 && selectedDate && selectedTime && (
        <div className="space-y-4">
          <Button variant="outline" onClick={handleBackToStep1}>
            ← Change Date & Time
          </Button>
          <BookingForm
            weddingId={eventId!}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSuccess={handleSuccess}
            onBack={handleBackToStep1}
            vendorId={selectedStaff?.id ?? undefined}
            staffName={selectedStaff?.name}
          />
        </div>
      )}

      {step === 3 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
            <div>
              <h3 className="text-2xl font-semibold">Booking Confirmed!</h3>
              <p className="text-muted-foreground mt-2">
                Your meeting{selectedStaff ? ` with ${selectedStaff.name}` : ''} has been scheduled. You'll receive a confirmation email with calendar invite shortly.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={handleBackToStaffSelect}>
                Schedule Another Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardContent className="py-4">
          <p className="text-sm">
            <strong>Pro tip:</strong> Make sure you've completed your vibe sheet before the meeting 
            so we can have a productive discussion about your perfect event soundtrack!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;
