import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TimeSlotInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const HOURS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const PERIODS = ['AM','PM'];

interface WheelColumnProps {
  items: string[];
  selected: string;
  onSelect: (item: string) => void;
}

const WheelColumn: React.FC<WheelColumnProps> = ({ items, selected, onSelect }) => {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selected]);

  return (
    <div className="flex-1 h-40 overflow-y-auto scrollbar-none flex flex-col gap-0.5 px-1">
      {items.map((item) => (
        <button
          key={item}
          ref={item === selected ? selectedRef : null}
          type="button"
          onClick={() => onSelect(item)}
          className={cn(
            'w-full text-center py-1.5 rounded-md text-sm font-medium transition-colors',
            item === selected
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
};

export const TimeSlotInput: React.FC<TimeSlotInputProps> = ({
  value,
  onChange,
  placeholder = 'Select time'
}) => {
  const [open, setOpen] = useState(false);
  const [wheelHour, setWheelHour] = useState('7');
  const [wheelMinute, setWheelMinute] = useState('00');
  const [wheelPeriod, setWheelPeriod] = useState('PM');

  useEffect(() => {
    if (open) {
      if (value) {
        const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
          setWheelHour(match[1]);
          setWheelMinute(match[2]);
          setWheelPeriod(match[3].toUpperCase());
        }
      } else {
        setWheelHour('7');
        setWheelMinute('00');
        setWheelPeriod('PM');
      }
    }
  }, [open, value]);

  const handleSetTime = () => {
    onChange(`${wheelHour}:${wheelMinute} ${wheelPeriod}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-left"
          type="button"
        >
          <Clock className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
          <span className={value ? '' : 'text-muted-foreground'}>
            {value || placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex gap-1">
          <WheelColumn items={HOURS} selected={wheelHour} onSelect={setWheelHour} />
          <WheelColumn items={MINUTES} selected={wheelMinute} onSelect={setWheelMinute} />
          <WheelColumn items={PERIODS} selected={wheelPeriod} onSelect={setWheelPeriod} />
        </div>
        <Button className="w-full mt-3" size="sm" onClick={handleSetTime}>
          Set Time
        </Button>
      </PopoverContent>
    </Popover>
  );
};
