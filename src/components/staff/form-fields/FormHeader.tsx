
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FormHeaderProps {
  formProgress: number;
}

const FormHeader = ({ formProgress }: FormHeaderProps) => {
  return (
    <CardHeader className="pb-6 text-center">
      <CardTitle className="text-2xl font-bold">
        Event Details
      </CardTitle>
      
      {/* Form Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Form Completion</span>
          <span>{Math.round(formProgress)}%</span>
        </div>
        <Progress value={formProgress} className="h-2" />
      </div>
    </CardHeader>
  );
};

export default FormHeader;
