import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, DollarSign, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { FormData } from '@/types/eventForm';
import { getPackageTypeLabel } from '@/config/packageTypes';

interface EventDetailsSectionProps {
  formData: FormData;
}

const EventDetailsSection = ({ formData }: EventDetailsSectionProps) => {
  const formatDate = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'PPP');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const isIndependent = formData.bookingSource === 'independent';

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-4 h-4 text-primary" />
        </div>
        Event Details
      </h3>
      <div className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-2xl p-6 border border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="font-medium text-gray-600">Event Date:</span>
            <p className="text-gray-800 font-medium mt-1">
              {formatDate(formData.weddingDate)}
            </p>
          </div>
          <div>
            <span className="font-medium text-gray-600">Number of Guests:</span>
            <p className="text-gray-800 font-medium mt-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {formData.numberOfGuests}
          </p>
          </div>
          {formData.eventStartTime && (
            <div>
              <span className="font-medium text-gray-600">Event Start Time:</span>
              <p className="text-gray-800 font-medium mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {formData.eventStartTime}
              </p>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-600">Booking Type:</span>
            <Badge variant="outline" className="mt-1 rounded-full">
              {formData.bookingSource === 'venue_partner' ? 'Venue Partner' : 'Independent Gig'}
            </Badge>
          </div>
          
          {isIndependent && formData.pricingType === 'flat_rate' && formData.totalPrice && (
            <>
              <div>
                <span className="font-medium text-gray-600">Pricing:</span>
                <p className="text-gray-800 font-medium mt-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Flat Rate — ${formData.totalPrice?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Deposit Required:</span>
                <p className="text-gray-800 font-medium mt-1">
                  ${formData.depositAmount?.toLocaleString()}
                </p>
              </div>
            </>
          )}

          {isIndependent && formData.pricingType !== 'flat_rate' && formData.hoursBooked && (
            <>
              <div>
                <span className="font-medium text-gray-600">Hours Booked:</span>
                <p className="text-gray-800 font-medium mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {formData.hoursBooked} hours @ ${formData.hourlyRate}/hr
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Total Price:</span>
                <p className="text-gray-800 font-medium mt-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" />
                  ${formData.totalPrice?.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Deposit Required:</span>
                <p className="text-gray-800 font-medium mt-1">
                  ${formData.depositAmount?.toLocaleString()}
                </p>
              </div>
            </>
          )}
          
          {formData.contract && (
            <div className="md:col-span-2">
              <span className="font-medium text-gray-600">Contract Notes:</span>
              <p className="text-gray-800 font-medium mt-1">{formData.contract}</p>
            </div>
          )}
          
          {!isIndependent && formData.packageType && (
            <div>
              <span className="font-medium text-gray-600">Package Type:</span>
              <Badge variant="outline" className="mt-1 rounded-full">
                {getPackageTypeLabel(formData.packageType)}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsSection;