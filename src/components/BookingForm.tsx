import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface BookingFormProps {
  weddingId: string;
  selectedDate: Date;
  selectedTime: string;
  onSuccess: () => void;
  onBack: () => void;
  vendorId?: string;
  staffName?: string;
}

export const BookingForm = ({ weddingId, selectedDate, selectedTime, onSuccess, onBack, vendorId, staffName }: BookingFormProps) => {
  const [meetingType, setMeetingType] = useState("dj_details");
  const [meetingFormat, setMeetingFormat] = useState("in_person");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('create-booking', {
        body: {
          wedding_id: weddingId,
          booking_date: dateStr,
          booking_time: selectedTime,
          meeting_type: meetingType,
          meeting_format: meetingFormat,
          customer_notes: notes,
          vendor_id: vendorId
        }
      });

      if (error) throw error;

      // Check for slot conflict (409 response)
      if (data?.error && data.error.includes('just booked')) {
        toast({
          title: "Slot No Longer Available",
          description: "This time was just booked by someone else. Please choose another time.",
          variant: "destructive"
        });
        onBack();
        return;
      }

      toast({
        title: "Success!",
        description: "Your meeting has been scheduled. You'll receive a confirmation email shortly.",
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      
      // Handle slot conflict error
      if (error?.message?.includes('just booked') || error?.message?.includes('409')) {
        toast({
          title: "Slot No Longer Available",
          description: "This time was just booked by someone else. Please choose another time.",
          variant: "destructive"
        });
        onBack();
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    const [hour, min] = time.split(':').map(Number);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${String(min).padStart(2, '0')} ${period}`;
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Confirm Your Meeting</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><strong>Date:</strong> {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> {formatTime(selectedTime)} (Arizona Time)</p>
            {staffName && <p><strong>With:</strong> {staffName}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingType">Meeting Type</Label>
          <Select value={meetingType} onValueChange={setMeetingType}>
            <SelectTrigger id="meetingType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dj_details">DJ Details Meeting</SelectItem>
              <SelectItem value="consultation">Quick Consultation</SelectItem>
              <SelectItem value="follow_up">Follow-up Call</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingFormat">Meeting Format</Label>
          <Select value={meetingFormat} onValueChange={setMeetingFormat}>
            <SelectTrigger id="meetingFormat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Questions or Special Requests (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific topics you'd like to discuss? Need a different day/time? Let us know!"
            rows={4}
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Booking
          </Button>
        </div>
      </form>
    </Card>
  );
};