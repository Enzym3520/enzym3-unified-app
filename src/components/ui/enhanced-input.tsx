
import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface EnhancedInputProps
  extends React.ComponentProps<typeof Input> {
  clearOnFocus?: boolean;
  defaultText?: string;
  onClear?: () => void;
}

const EnhancedInput = React.forwardRef<
  HTMLInputElement,
  EnhancedInputProps
>(({ className, clearOnFocus = false, defaultText, onClear, onFocus, ...props }, ref) => {
  const [hasBeenFocused, setHasBeenFocused] = React.useState(false);

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    if (clearOnFocus && !hasBeenFocused && props.value === defaultText) {
      onClear?.();
      setHasBeenFocused(true);
    }
    onFocus?.(event);
  };

  return (
    <Input
      ref={ref}
      className={cn(
        "transition-all duration-200 hover:border-enzym3-blue/50 focus:scale-[1.02] focus:shadow-md",
        className
      )}
      onFocus={handleFocus}
      {...props}
    />
  );
});

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };
