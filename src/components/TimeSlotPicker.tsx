import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TimeSlot {
  time: string;
  available: boolean;
  label: string;
}

interface TimeSlotPickerProps {
  selectedDate: Date;
  onTimeSelect: (time: string) => void;
  selectedTime?: string;
  vendorId?: string;
}

export const TimeSlotPicker = ({ selectedDate, onTimeSelect, selectedTime, vendorId }: TimeSlotPickerProps) => {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadAvailableSlots = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      const { data, error } = await supabase.functions.invoke('get-available-slots', {
        body: { date: dateStr, vendor_id: vendorId }
      });

      if (error) throw error;

      setSlots(data.slots || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
    // Reload whenever the date OR the vendor changes — previously vendorId changes
    // were missed, leaving stale slots from the prior vendor.
  }, [selectedDate, vendorId, toast]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Select a Time</h3>
        <p className="text-sm text-muted-foreground">
          {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {(() => {
        const availableSlots = slots.filter(slot => slot.available);
        return availableSlots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No available slots for this date
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                onClick={() => onTimeSelect(slot.time)}
                className="w-full"
              >
                {slot.label}
              </Button>
            ))}
          </div>
        );
      })()}

      <div className="text-xs text-muted-foreground">
        <p>All times shown in Mountain Time (Arizona)</p>
      </div>
    </div>
  );
};
