import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar } from "@/components/ui/calendar";

interface BookingCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate?: Date;
}

export const BookingCalendar = ({ onDateSelect, selectedDate }: BookingCalendarProps) => {
  const [month, setMonth] = useState<Date>(new Date());

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Only allow Tuesday through Saturday (2-6)
    const dayOfWeek = date.getDay();
    const allowedDays = [2, 3, 4, 5, 6]; // Tue, Wed, Thu, Fri, Sat
    if (!allowedDays.includes(dayOfWeek)) return true;
    
    // Disable dates more than 90 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 90);
    if (date > maxDate) return true;
    
    return false;
  };

  return (
    <div className="space-y-4 w-full">
      <div>
        <h3 className="text-lg font-semibold">Select a Date</h3>
        <p className="text-sm text-muted-foreground">
          Choose an available date for your meeting
        </p>
      </div>
      
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && onDateSelect(date)}
        disabled={isDateDisabled}
        month={month}
        onMonthChange={setMonth}
        className="rounded-md border p-4"
        classNames={{
          months: "flex flex-col w-full",
          month: "space-y-4 w-full",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-base font-semibold",
          nav: "space-x-1 flex items-center",
          table: "w-full border-collapse",
          head_row: "flex justify-between",
          head_cell: "text-muted-foreground rounded-md flex-1 font-medium text-sm text-center",
          row: "flex w-full justify-between mt-2",
          cell: "flex-1 h-10 md:h-12 text-center text-sm p-0 relative",
          day: "h-10 w-10 md:h-12 md:w-12 p-0 font-normal mx-auto rounded-md hover:bg-accent aria-selected:opacity-100",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_disabled: "text-muted-foreground opacity-50",
          day_outside: "text-muted-foreground opacity-50",
        }}
      />
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Available: Tuesday - Saturday</p>
        <p>• Bookable up to 90 days in advance</p>
        <p>• Need a different day? <Link to="/app/contact" className="text-primary hover:underline">Contact us</Link></p>
      </div>
    </div>
  );
};
