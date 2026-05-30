import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Send, AlertCircle } from 'lucide-react';

interface EnhancedSubmitButtonProps {
  isSubmitting: boolean;
  formProgress: number;
  onSubmit?: () => void;
}

const EnhancedSubmitButton = ({ isSubmitting, formProgress, onSubmit }: EnhancedSubmitButtonProps) => {
  const [submitStage, setSubmitStage] = useState<'idle' | 'validating' | 'sending' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isSubmitting) {
      setSubmitStage('validating');
      setProgress(0);
      
      // Simulate validation stage
      setTimeout(() => {
        setSubmitStage('sending');
        setProgress(30);
      }, 500);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(progressInterval);
    } else {
      setSubmitStage('idle');
      setProgress(0);
    }
  }, [isSubmitting]);

  const getButtonContent = () => {
    switch (submitStage) {
      case 'validating':
        return (
          <>
            <div className="animate-pulse rounded-full h-4 w-4 bg-white mr-2"></div>
            Validating...
          </>
        );
      case 'sending':
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Sending... {progress}%
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Sent Successfully!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Failed - Try Again
          </>
        );
      default:
        return (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Event Notification
          </>
        );
    }
  };

  const getButtonClass = () => {
    const baseClass = "w-full font-poppins font-medium py-3 text-lg transition-all duration-300 disabled:cursor-not-allowed relative overflow-hidden";
    
    switch (submitStage) {
      case 'success':
        return `${baseClass} bg-green-500 hover:bg-green-600 text-white`;
      case 'error':
        return `${baseClass} bg-red-500 hover:bg-red-600 text-white`;
      default:
        return `${baseClass} bg-enzym3-blue hover:bg-enzym3-blue/90 text-gray-800 disabled:opacity-50`;
    }
  };

  const isDisabled = isSubmitting || formProgress < 50 || submitStage === 'success';

  return (
    <div className="space-y-3">
      <div className="relative">
        <Button
          type="submit"
          disabled={isDisabled}
          className={getButtonClass()}
          onClick={onSubmit}
        >
          {getButtonContent()}
        </Button>
        
        {/* Progress bar overlay for sending state */}
        {submitStage === 'sending' && (
          <div className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-md overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      
      {/* Helper text */}
      <div className="text-center">
        {formProgress < 50 && submitStage === 'idle' && (
          <p className="text-sm text-gray-500 font-poppins">
            Complete at least 50% of the form to submit ({Math.round(formProgress)}% completed)
          </p>
        )}
        
        {submitStage === 'validating' && (
          <p className="text-sm text-blue-600 font-poppins">
            Checking form data...
          </p>
        )}
        
        {submitStage === 'sending' && (
          <p className="text-sm text-blue-600 font-poppins">
            Sending notification to coordinators...
          </p>
        )}
        
        {submitStage === 'success' && (
          <p className="text-sm text-green-600 font-poppins">
            ✅ Event notification sent successfully!
          </p>
        )}
        
        {submitStage === 'error' && (
          <p className="text-sm text-red-600 font-poppins">
            ❌ Failed to send. Please try again.
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedSubmitButton;