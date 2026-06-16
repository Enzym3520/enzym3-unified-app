import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { 
  convert24HourTo12Hour, 
  convert12HourTo24Hour, 
  getHourOptions, 
  getMinuteOptions,
  getAllMinuteOptions,
  Time12Hour,
  validateTime12Hour
} from '@/utils/timeUtils';

interface TimeInput12HourProps {
  value?: string; // 24-hour format (HH:mm)
  onChange: (value: string) => void; // Returns 24-hour format
  label: string;
  placeholder?: string;
  tooltip?: string;
  required?: boolean;
  disabled?: boolean;
  showAllMinutes?: boolean; // If true, shows 00-59, otherwise 00,15,30,45
}

export const TimeInput12Hour = ({
  value = '',
  onChange,
  label,
  tooltip,
  required = false,
  disabled = false,
  showAllMinutes = false,
}: TimeInput12HourProps) => {
  const [time12, setTime12] = useState<Time12Hour>(() => convert24HourTo12Hour(value));

  // Update internal state when external value changes
  useEffect(() => {
    setTime12(convert24HourTo12Hour(value));
  }, [value]);

  // Handle changes and convert to 24-hour format
  const handleTimeChange = (newTime12: Time12Hour) => {
    setTime12(newTime12);
    
    if (validateTime12Hour(newTime12)) {
      const time24 = convert12HourTo24Hour(newTime12);
      onChange(time24);
    } else {
      onChange('');
    }
  };

  const handleHourChange = (hour: string) => {
    handleTimeChange({ ...time12, hour });
  };

  const handleMinuteChange = (minute: string) => {
    handleTimeChange({ ...time12, minute });
  };

  const handlePeriodChange = (period: 'AM' | 'PM') => {
    handleTimeChange({ ...time12, period });
  };

  const hourOptions = getHourOptions();
  const minuteOptions = showAllMinutes ? getAllMinuteOptions() : getMinuteOptions();

  return (
    <FormItem>
      <div className="flex items-center gap-2">
        <FormLabel>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </FormLabel>
        {tooltip && <FieldTooltip content={tooltip} />}
      </div>
      
      <FormControl>
        <div className="flex gap-2 items-center">
          {/* Hour Select */}
          <Select
            value={time12.hour}
            onValueChange={handleHourChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Hr" />
            </SelectTrigger>
            <SelectContent>
              {hourOptions.map((hour) => (
                <SelectItem key={hour} value={hour}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">:</span>

          {/* Minute Select */}
          <Select
            value={time12.minute}
            onValueChange={handleMinuteChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="Min" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((minute) => (
                <SelectItem key={minute} value={minute}>
                  {minute}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* AM/PM Select */}
          <Select
            value={time12.period}
            onValueChange={handlePeriodChange}
            disabled={disabled}
          >
            <SelectTrigger className="w-20">
              <SelectValue placeholder="AM/PM" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">AM</SelectItem>
              <SelectItem value="PM">PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </FormControl>
      
      <FormMessage />
    </FormItem>
  );
};