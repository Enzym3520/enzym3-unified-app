
import React from 'react';
import { Button } from '@/components/ui/button';

interface SubmitButtonProps {
  isSubmitting: boolean;
  formProgress: number;
}

const SubmitButton = ({ isSubmitting, formProgress }: SubmitButtonProps) => {
  return (
    <div className="space-y-3">
      <Button
        type="submit"
        disabled={isSubmitting || formProgress < 50}
        className="w-full bg-enzym3-blue hover:bg-enzym3-blue/90 text-gray-800 font-poppins font-medium py-3 text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></div>
            Sending...
          </>
        ) : (
          "Send Event Notification"
        )}
      </Button>
      
      {formProgress < 50 && (
        <p className="text-sm text-gray-500 text-center font-poppins">
          Please complete at least 50% of the form to submit
        </p>
      )}
    </div>
  );
};

export default SubmitButton;
