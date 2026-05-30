import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileOptimizedFormProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOptimizedForm({ children, className }: MobileOptimizedFormProps) {
  const isMobile = useIsMobile();

  return (
    <div 
      className={cn(
        "w-full space-y-4 md:space-y-6",
        isMobile && "px-1", // Tighter padding on mobile
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileFormFieldProps {
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function MobileFormField({ children, className, fullWidth = false }: MobileFormFieldProps) {
  const isMobile = useIsMobile();

  return (
    <div 
      className={cn(
        "space-y-2",
        isMobile && fullWidth && "w-full",
        isMobile && "min-h-[60px] flex flex-col justify-center", // Better touch targets
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export function MobileButton({ 
  children, 
  className, 
  onClick, 
  disabled, 
  variant = 'primary',
  size = 'md'
}: MobileButtonProps) {
  const isMobile = useIsMobile();

  const sizeClasses = {
    sm: isMobile ? "px-4 py-3 text-sm" : "px-3 py-2 text-sm",
    md: isMobile ? "px-6 py-4 text-base" : "px-4 py-2 text-sm",
    lg: isMobile ? "px-8 py-5 text-lg" : "px-6 py-3 text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg font-medium transition-all duration-200 active:scale-95",
        sizeClasses[size],
        isMobile && "min-h-[48px] touch-manipulation", // Better touch targets
        variant === 'primary' && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === 'secondary' && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === 'outline' && "border border-border bg-background hover:bg-accent",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}