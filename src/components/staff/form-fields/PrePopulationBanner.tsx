import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrePopulationData } from '@/hooks/useFormPrePopulation';
import { getContextDescription } from '@/utils/prePopulationHelpers';

interface PrePopulationBannerProps {
  data: PrePopulationData;
  onDismiss?: () => void;
}

const PrePopulationBanner = ({ data, onDismiss }: PrePopulationBannerProps) => {
  const description = getContextDescription(data.context);
  const fieldCount = Object.keys(data.fieldMappings).filter(key => 
    data.fieldMappings[key] !== null && data.fieldMappings[key] !== ''
  ).length;

  return (
    <Alert className="border-enzym3-blue/20 bg-enzym3-blue/5 animate-fade-in mb-6">
      <Info className="h-4 w-4 text-enzym3-blue" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-poppins">
            {description}
          </span>
          <Badge variant="secondary" className="text-xs">
            {fieldCount} fields pre-filled
          </Badge>
          {data.context.contactName && (
            <Badge variant="outline" className="text-xs">
              {data.context.contactName}
            </Badge>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-auto p-1 hover:bg-white/50"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default PrePopulationBanner;