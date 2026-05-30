import { useEffect, useState, useRef } from "react";

interface FlipCardProps {
  digit: string;
  label?: string;
}

const FlipCard = ({ digit }: FlipCardProps) => {
  const [displayDigit, setDisplayDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);
  const prevDigitRef = useRef(digit);

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      setIsFlipping(true);
      
      // Mid-flip: update digit
      const flipTimer = setTimeout(() => {
        setDisplayDigit(digit);
      }, 150);

      // End flip
      const endTimer = setTimeout(() => {
        setIsFlipping(false);
        prevDigitRef.current = digit;
      }, 300);

      return () => {
        clearTimeout(flipTimer);
        clearTimeout(endTimer);
      };
    }
  }, [digit]);

  return (
    <div className="relative w-10 h-14 sm:w-12 sm:h-16 perspective-500">
      {/* Card container */}
      <div className="relative w-full h-full">
        {/* Static bottom half (shows next digit) */}
        <div className="absolute inset-0 rounded-md bg-[#c9b896] overflow-hidden shadow-lg border border-[#a89068]/30">
          {/* Top static half */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-[#d4c4a8] flex items-end justify-center overflow-hidden border-b border-[#8b7355]/40">
            <span className="text-2xl sm:text-3xl font-bold text-[#2d3748] translate-y-1/2 font-mono">
              {displayDigit}
            </span>
          </div>
          
          {/* Bottom static half */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#c9b896] flex items-start justify-center overflow-hidden">
            <span className="text-2xl sm:text-3xl font-bold text-[#1a202c] -translate-y-1/2 font-mono">
              {displayDigit}
            </span>
          </div>

          {/* Center divider line */}
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-[#8b7355]/50 -translate-y-1/2 z-10" />
          
          {/* Subtle shine effect */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>

        {/* Flipping top half */}
        <div 
          className={`absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-[#d4c4a8] overflow-hidden origin-bottom shadow-md z-20 ${
            isFlipping ? 'animate-flip-down' : ''
          }`}
        >
          <div className="absolute inset-0 flex items-end justify-center overflow-hidden">
            <span className="text-2xl sm:text-3xl font-bold text-[#2d3748] translate-y-1/2 font-mono">
              {isFlipping ? prevDigitRef.current : displayDigit}
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Bottom shadow */}
      <div className="absolute -bottom-1 inset-x-1 h-2 bg-[#8b7355]/30 rounded-b-md blur-sm -z-10" />
    </div>
  );
};

export default FlipCard;
