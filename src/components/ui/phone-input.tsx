
import * as React from "react";
import { EnhancedInput } from "./enhanced-input";

export interface PhoneInputProps
  extends Omit<React.ComponentProps<typeof EnhancedInput>, 'onChange'> {
  onChange?: (value: string) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ onChange, ...props }, ref) => {
    const formatPhoneNumber = (value: string) => {
      const phoneNumber = value.replace(/\D/g, '');
      const phoneNumberLength = phoneNumber.length;
      
      if (phoneNumberLength < 4) return phoneNumber;
      if (phoneNumberLength < 7) {
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
      }
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const formattedValue = formatPhoneNumber(event.target.value);
      onChange?.(formattedValue);
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text');
      const formattedValue = formatPhoneNumber(pastedText);
      onChange?.(formattedValue);
    };

    return (
      <EnhancedInput
        {...props}
        ref={ref}
        type="tel"
        maxLength={14}
        onChange={handleChange}
        onPaste={handlePaste}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
