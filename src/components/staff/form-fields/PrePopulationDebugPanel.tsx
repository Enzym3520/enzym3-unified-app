import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Bug, Info } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PrePopulationDebugPanelProps {
  prePopData?: any;
  selectedCoupleData?: any;
  mergedData?: any;
  formValues?: any;
}

const PrePopulationDebugPanel = ({
  prePopData,
  selectedCoupleData,
  formValues
}: PrePopulationDebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string' && value === '') return '(empty string)';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const getFieldStatus = (field: string) => {
    const hasPrePop = prePopData?.fieldMappings?.[field] !== undefined;
    const hasCouple = selectedCoupleData && (
      selectedCoupleData[field] !== undefined || 
      selectedCoupleData.additional_data?.[field] !== undefined
    );
    const hasForm = formValues?.[field] !== undefined && formValues[field] !== '';

    if (hasForm) return { status: 'populated', color: 'bg-green-500' };
    if (hasPrePop || hasCouple) return { status: 'available', color: 'bg-yellow-500' };
    return { status: 'missing', color: 'bg-gray-400' };
  };

  const importantFields = [
    'brideName', 'groomName', 'brideEmail', 'groomEmail', 
    'bridePhone', 'groomPhone', 'weddingDate', 'venue', 
    'eventType', 'packageType', 'numberOfGuests', 'from', 
    'vendors', 'vendorType', 'contract', 'notes'
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-lg">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="mb-2 bg-white shadow-lg border-2 border-blue-200"
          >
            <Bug className="w-4 h-4 mr-2" />
            Pre-population Debug
            {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <Card className="shadow-lg border-2 border-blue-200 max-h-96 overflow-y-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Source Status */}
              <div className="grid grid-cols-3 gap-2">
                <Badge variant={prePopData ? 'default' : 'secondary'}>
                  Pre-pop: {prePopData ? '✓' : '✗'}
                </Badge>
                <Badge variant={selectedCoupleData ? 'default' : 'secondary'}>
                  Couple: {selectedCoupleData ? '✓' : '✗'}
                </Badge>
                <Badge variant={formValues ? 'default' : 'secondary'}>
                  Form: {formValues ? '✓' : '✗'}
                </Badge>
              </div>

              {/* Field Status Overview */}
              <div>
                <h4 className="font-medium mb-2">Field Status</h4>
                <div className="grid grid-cols-4 gap-1">
                  {importantFields.map(field => {
                    const status = getFieldStatus(field);
                    return (
                      <div 
                        key={field} 
                        className={`h-3 w-full rounded-sm ${status.color}`}
                        title={`${field}: ${status.status}`}
                      />
                    );
                  })}
                </div>
                <div className="flex gap-2 mt-1 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-sm" />
                    Populated
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-sm" />
                    Available
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-sm" />
                    Missing
                  </span>
                </div>
              </div>

              {/* Data Details */}
              {prePopData && (
                <div>
                  <h4 className="font-medium">Pre-population Context</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <div>Source: {prePopData.context?.source}</div>
                    <div>ID: {prePopData.context?.id}</div>
                    <div>Fields: {Object.keys(prePopData.fieldMappings || {}).length}</div>
                  </div>
                </div>
              )}

              {selectedCoupleData && (
                <div>
                  <h4 className="font-medium">Selected Couple</h4>
                  <div className="bg-gray-50 p-2 rounded text-xs">
                    <div>Name: {selectedCoupleData.couple_name}</div>
                    <div>Source: {selectedCoupleData.source}</div>
                    <div>Event: {selectedCoupleData.event_date}</div>
                  </div>
                </div>
              )}

              {/* Problem Fields */}
              <div>
                <h4 className="font-medium">Field Mapping</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importantFields.map(field => {
                    const prePopValue = prePopData?.fieldMappings?.[field];
                    const coupleValue = selectedCoupleData?.[field] || selectedCoupleData?.additional_data?.[field];
                    const formValue = formValues?.[field];
                    
                    if (!prePopValue && !coupleValue && !formValue) return null;
                    
                    return (
                      <div key={field} className="bg-gray-50 p-2 rounded">
                        <div className="font-medium">{field}</div>
                        {prePopValue && <div className="text-blue-600">Pre: {formatValue(prePopValue)}</div>}
                        {coupleValue && <div className="text-green-600">Couple: {formatValue(coupleValue)}</div>}
                        {formValue && <div className="text-purple-600">Form: {formatValue(formValue)}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PrePopulationDebugPanel;