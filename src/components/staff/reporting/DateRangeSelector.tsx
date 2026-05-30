import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

interface DateRangeSelectorProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
}

export function DateRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeSelectorProps) {
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    onStartDateChange(date);
                    setIsStartOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    onEndDateChange(date);
                    setIsEndOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                onStartDateChange(new Date(now.getFullYear(), now.getMonth(), 1));
                onEndDateChange(now);
              }}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const now = new Date();
                onStartDateChange(new Date(now.getFullYear(), 0, 1));
                onEndDateChange(now);
              }}
            >
              This Year
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
