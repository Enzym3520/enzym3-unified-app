import React from 'react';
import { FieldErrors, FieldValues, Path } from 'react-hook-form';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface RealTimeValidationProps<T extends FieldValues> {
  fieldName: Path<T>;
  value: any;
  errors: FieldErrors<T>;
  isValid?: boolean;
  showSuccess?: boolean;
}

function RealTimeValidation<T extends FieldValues>({ 
  fieldName, 
  value, 
  errors, 
  isValid, 
  showSuccess = true 
}: RealTimeValidationProps<T>) {
  const hasError = errors[fieldName];
  const hasValue = value !== undefined && value !== null && value !== '';
  const fieldIsValid = !hasError && hasValue && (isValid !== undefined ? isValid : true);

  if (!hasValue && !hasError) {
    return null;
  }

  return (
    <div className="flex items-center mt-1">
      {hasError ? (
        <div className="flex items-center text-red-500">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span className="text-xs font-poppins">{String(hasError.message)}</span>
        </div>
      ) : fieldIsValid && showSuccess ? (
        <div className="flex items-center text-green-500">
          <CheckCircle2 className="h-4 w-4 mr-1" />
          <span className="text-xs font-poppins">Valid</span>
        </div>
      ) : null}
    </div>
  );
}

export default RealTimeValidation;