import { useEffect, useState } from "react";
import FlipCard from "./FlipCard";

interface FlipCountdownProps {
  targetDate: Date;
  eventType?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const FlipCountdown = ({ targetDate }: FlipCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsPast(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setIsPast(false);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const padNumber = (num: number, digits: number = 2): string[] => {
    return num.toString().padStart(digits, '0').split('');
  };


  if (isPast) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          <FlipCard digit="0" />
          <FlipCard digit="0" />
          <FlipCard digit="0" />
        </div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Event Passed
        </span>
      </div>
    );
  }

  const dayDigits = padNumber(Math.min(timeLeft.days, 999), 3);
  const hourDigits = padNumber(timeLeft.hours);
  const minuteDigits = padNumber(timeLeft.minutes);
  const secondDigits = padNumber(timeLeft.seconds);

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6">
      {/* Days */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {dayDigits.map((digit, index) => (
            <FlipCard key={`day-${index}`} digit={digit} />
          ))}
        </div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Days
        </span>
      </div>

      {/* Separator */}
      <div className="text-2xl sm:text-3xl font-bold text-muted-foreground/50 hidden sm:block self-start mt-3">:</div>

      {/* Hours */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {hourDigits.map((digit, index) => (
            <FlipCard key={`hour-${index}`} digit={digit} />
          ))}
        </div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Hours
        </span>
      </div>

      {/* Separator */}
      <div className="text-2xl sm:text-3xl font-bold text-muted-foreground/50 hidden sm:block self-start mt-3">:</div>

      {/* Minutes */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {minuteDigits.map((digit, index) => (
            <FlipCard key={`min-${index}`} digit={digit} />
          ))}
        </div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Mins
        </span>
      </div>

      {/* Separator */}
      <div className="text-2xl sm:text-3xl font-bold text-muted-foreground/50 hidden sm:block self-start mt-3">:</div>

      {/* Seconds */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {secondDigits.map((digit, index) => (
            <FlipCard key={`sec-${index}`} digit={digit} />
          ))}
        </div>
        <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Secs
        </span>
      </div>
    </div>
  );
};

export default FlipCountdown;
