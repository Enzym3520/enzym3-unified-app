import React from 'react';
import { Mail, Phone } from 'lucide-react';
import { FormData } from '@/types/eventForm';

interface ContactDetailsSectionProps {
  formData: FormData;
}

const ContactDetailsSection = ({ formData }: ContactDetailsSectionProps) => {
  const renderContactFields = () => {
    switch (formData.eventType) {
      case 'wedding':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                Bride
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.brideName}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {formData.bridePhone}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {formData.brideEmail}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Groom
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.groomName}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {formData.groomPhone}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {formData.groomEmail}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'quince':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                Quinceañera
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.quinceaneraName}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Parent/Guardian
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.parentName}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {formData.parentPhone}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {formData.parentEmail}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'birthday':
      case 'sweet16':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                Honoree
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.honoreeName}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Parent/Guardian
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.parentName}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {formData.parentPhone}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {formData.parentEmail}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'graduation':
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Graduate
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.graduateName}</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                Contact Person
              </h4>
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-800">{formData.contactName}</p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Phone className="w-3 h-3" />
                  {formData.contactPhone}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-3 h-3" />
                  {formData.contactEmail}
                </p>
              </div>
            </div>
          </div>
        );

      case 'banquet':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              Contact Person
            </h4>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-800">{formData.contactName}</p>
              <p className="text-gray-600 flex items-center gap-2">
                <Phone className="w-3 h-3" />
                {formData.contactPhone}
              </p>
              <p className="text-gray-600 flex items-center gap-2">
                <Mail className="w-3 h-3" />
                {formData.contactEmail}
              </p>
            </div>
          </div>
        );
      
      default:
        return <p className="text-gray-500">No contact information available</p>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <h3 className="text-lg font-semibold flex items-center gap-2 text-gray-700">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Mail className="w-4 h-4 text-primary" />
        </div>
        Contact Information
      </h3>
      <div className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 rounded-2xl p-6 border border-border/20">
        {renderContactFields()}
        {formData.email && (
          <div className="mt-6 pt-4 border-t border-border/20">
            <span className="font-medium text-gray-600">Additional Email:</span>
            <p className="text-gray-800 font-medium mt-1">{formData.email}</p>
          </div>
        )}
        {formData.notes && (
          <div className="mt-4">
            <span className="font-medium text-gray-600">Notes:</span>
            <p className="text-gray-800 mt-1 leading-relaxed">{formData.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactDetailsSection;