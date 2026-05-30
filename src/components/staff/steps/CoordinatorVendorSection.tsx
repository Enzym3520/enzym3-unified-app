import React from 'react';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { FormData } from '@/types/eventForm';
import { getPackageTypeLabel } from '@/config/packageTypes';
import { formatVendorType } from '@/utils/vendorTypeFormatter';

interface CoordinatorVendorSectionProps {
  formData: FormData;
}

const CoordinatorVendorSection = ({ formData }: CoordinatorVendorSectionProps) => {
  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-4 h-4 text-primary" />
        </div>
        Coordinator & Vendor Information
      </h3>
      <div className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-2xl p-6 border border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="font-medium text-gray-600">Coordinator:</span>
            <p className="text-gray-800 font-medium mt-1">{formData.from}</p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Vendors:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {formData.assignedVendors && formData.assignedVendors.filter(v => v.vendorName).length > 0
                ? formData.assignedVendors.filter(v => v.vendorName).map((v, i) => (
                    <Badge key={i} variant="secondary" className="rounded-full">
                      {v.vendorName} ({formatVendorType(v.vendorType)})
                    </Badge>
                  ))
                : formData.vendors
                  ? <p className="text-gray-800 font-medium">{formData.vendors}</p>
                  : <p className="text-muted-foreground text-sm">No vendors assigned</p>
              }
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Venue:</span>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-800 font-medium">{formData.venue}</p>
              {formData.venueCode && (
                <Badge variant="outline" className="text-xs">
                  {formData.venueCode}
                </Badge>
              )}
            </div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Vendor Type:</span>
            <Badge variant="secondary" className="mt-1 rounded-full">
              {formatVendorType(formData.vendorType)}
            </Badge>
          </div>
          <div>
            <span className="font-medium text-gray-600">Event Type:</span>
            <Badge variant="secondary" className="mt-1 rounded-full">
              {formData.eventType === 'other' && formData.customEventType 
                ? formData.customEventType 
                : formData.eventType === 'birthday' 
                  ? 'Birthday Party'
                  : formData.eventType.charAt(0).toUpperCase() + formData.eventType.slice(1)}
            </Badge>
          </div>
          {formData.packageType && (
            <div>
              <span className="font-medium text-gray-600">Package Type:</span>
              <Badge variant="secondary" className="mt-1 rounded-full">
                {getPackageTypeLabel(formData.packageType)}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorVendorSection;