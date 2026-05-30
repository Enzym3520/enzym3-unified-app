import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface SuccessScreenProps {
  onStartAnother: () => void;
}

const SuccessScreen = ({ onStartAnother }: SuccessScreenProps) => {
  return (
    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-white/95 backdrop-blur-md rounded-3xl overflow-hidden animate-scale-in">
      <CardContent className="p-12 text-center">
        <div className="space-y-6">
          <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-green-50 rounded-full flex items-center justify-center mx-auto shadow-lg animate-scale-in">
            <span className="text-3xl">✅</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-playfair font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              Event Notification Sent!
            </h2>
            <p className="text-muted-foreground text-lg">
              Your event notification has been successfully submitted and will be processed shortly.
            </p>
            <Button 
              onClick={onStartAnother}
              className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-full font-medium transition-all duration-200 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Another Notification
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuccessScreen;