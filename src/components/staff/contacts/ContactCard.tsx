import React from 'react';
import { parseLocalDate, safeFormatDate } from '@/utils/dateHelpers';
import { Mail, Phone, Calendar, MapPin, Tag, User, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Contact } from '@/types/contact';
import { getEventTypeIcon, formatEventType } from '@/utils/notificationHelpers';
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';
import { getTagDisplayName } from '@/utils/tagHelpers';

interface ContactCardProps {
  contact: Contact;
  onClick: () => void;
  isSelected?: boolean;
  onSelectionChange?: (contactId: string, selected: boolean) => void;
}

// Helper function to render contact information based on event type
const renderContactInfo = (contact: Contact) => {
  if (contact.brideInfo && contact.groomInfo) {
    // Wedding contact - show both bride and groom
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 gap-1">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <div className="flex flex-col min-w-0">
              {contact.brideInfo.email && (
                <span className="truncate">{contact.brideInfo.email} (Bride)</span>
              )}
              {contact.groomInfo.email && (
                <span className="truncate">{contact.groomInfo.email} (Groom)</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-3 h-3 text-muted-foreground" />
          <div className="flex flex-col min-w-0">
            {contact.brideInfo.phone && (
              <span className="truncate">{contact.brideInfo.phone} (Bride)</span>
            )}
            {contact.groomInfo.phone && (
              <span className="truncate">{contact.groomInfo.phone} (Groom)</span>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    // Non-wedding contact - show primary email
    return (
      <div className="flex items-center gap-2 text-sm">
        <Mail className="w-3 h-3 text-muted-foreground" />
        <span className="truncate">{contact.email}</span>
      </div>
    );
  }
};

const ContactCard = ({ contact, onClick, isSelected = false, onSelectionChange }: ContactCardProps) => {
  const statusColors = {
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    past_client: 'bg-green-100 text-green-800 border-green-200',
    potential: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const statusLabels = {
    active: 'Active',
    past_client: 'Past Client',
    potential: 'Potential'
  };

  const handleEmailContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    const emails = [];
    if (contact.brideInfo?.email) emails.push(contact.brideInfo.email);
    if (contact.groomInfo?.email) emails.push(contact.groomInfo.email);
    if (!contact.brideInfo && !contact.groomInfo && contact.email) emails.push(contact.email);
    
    if (emails.length > 0) {
      const subject = encodeURIComponent(`Event Update - ${contact.name}`);
      window.open(`mailto:${emails.join(',')}?subject=${subject}`, '_blank');
    }
  };

  const handleSelectionChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange?.(contact.id, !isSelected);
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[280px] ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-4 pt-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleSelectionChange}
              onClick={handleSelectionChange}
              className="mt-1"
            />
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{contact.name}</h3>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-muted-foreground">{contact.totalEvents} event{contact.totalEvents !== 1 ? 's' : ''}</p>
                {/* Form completion indicator */}
                {contact.formSubmissions && contact.formSubmissions.length > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{contact.completedForms}/{contact.totalForms} forms</span>
                    {contact.formCompletionRate === 100 && (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEmailContact}
              className="flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Badge 
              variant="outline" 
              className={`text-xs ${statusColors[contact.status]}`}
            >
              {statusLabels[contact.status]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="space-y-3">
          {renderContactInfo(contact)}
          
          {contact.phone && !contact.brideInfo && !contact.groomInfo && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-base">{contact.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-base">
              {parseLocalDate(contact.primaryEventDate) > new Date() ? 'Upcoming ' : ''}
              {contact.primaryEventType.charAt(0).toUpperCase() + contact.primaryEventType.slice(1)}: {safeFormatDate(contact.primaryEventDate, 'MMM dd, yyyy')}
            </span>
          </div>
          
          {contact.preferredVenues.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="truncate text-base">{contact.preferredVenues[0]}</span>
              {contact.preferredVenues.length > 1 && (
                <span className="text-muted-foreground text-sm">+{contact.preferredVenues.length - 1}</span>
              )}
            </div>
          )}
        </div>

        {/* Event Types */}
        <div className="flex items-center gap-2 flex-wrap mt-4">
          {contact.eventTypes.slice(0, 3).map(eventType => (
            <div key={eventType} className="flex items-center gap-1 text-xs">
              <span>{getEventTypeIcon(eventType)}</span>
              <span>{formatEventType(eventType)}</span>
            </div>
          ))}
          {contact.eventTypes.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{contact.eventTypes.length - 3} more
            </span>
          )}
        </div>

        {/* Form Completion Progress */}
        {contact.formSubmissions && contact.formSubmissions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <FileText className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Form Progress</span>
              </div>
              <span className="text-xs font-medium">{Math.round(contact.formCompletionRate)}%</span>
            </div>
            <Progress value={contact.formCompletionRate} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{contact.completedForms} of {contact.totalForms} completed</span>
              {contact.formCompletionRate === 100 && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Complete</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {contact.tags.length > 0 && (
          <div className="flex items-start gap-1 flex-wrap">
            <Tag className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1 min-w-0">
              {contact.tags.slice(0, 2).map(tag => {
                const { variant, icon } = getSmartTagConfig(tag);
                return (
                  <EnhancedTag 
                    key={tag} 
                    variant={variant}
                    size="xs"
                    icon={icon}
                    className="animate-fade-in"
                  >
                    {getTagDisplayName(tag)}
                  </EnhancedTag>
                );
              })}
              {contact.tags.length > 2 && (
                <EnhancedTag variant="default" size="xs" className="opacity-70">
                  +{contact.tags.length - 2}
                </EnhancedTag>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContactCard;