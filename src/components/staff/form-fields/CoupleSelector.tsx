import React, { useState, useEffect } from 'react';
import { Search, Calendar, Mail, MapPin, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';
import { getTagDisplayName } from '@/utils/tagHelpers';
import { useCoupleData, CoupleData } from '@/hooks/useCoupleData';
import { CoupleSelectorProps } from '@/types/coupleSelector';

const CoupleSelector = ({ onCoupleSelect }: CoupleSelectorProps) => {
  const { couples, loading, parseCoupleName } = useCoupleData();
  const [filteredCouples, setFilteredCouples] = useState<CoupleData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (searchTerm) {
      const filtered = couples.filter(couple =>
        couple.couple_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (couple.contact_email && couple.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (couple.venue && couple.venue.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCouples(filtered);
    } else {
      setFilteredCouples(couples);
    }
  }, [searchTerm, couples]);

  const handleSelectCouple = (couple: CoupleData) => {
    onCoupleSelect(couple);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  const getEventTypeBadgeColor = (source: string) => {
    switch (source) {
      case 'wedding': return 'default';
      case 'event_notification': return 'secondary';
      case 'form_submission': return 'outline';
      default: return 'secondary';
    }
  };

  const getEventTypeFromCouple = (couple: CoupleData): string => {
    if (couple.source === 'wedding') return 'Wedding';
    if (couple.additional_data?.event_type) return couple.additional_data.event_type;
    
    // Try to guess from couple name patterns
    const parsedNames = parseCoupleName(couple.couple_name);
    if (parsedNames.bride_name && parsedNames.groom_name) return 'Wedding';
    
    return 'Event';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading couples...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Select Existing Couple</h2>
        <p className="text-muted-foreground">Choose from previous events or create a new form</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by couple name, email, or venue..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-3">
          {filteredCouples.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No couples match your search' : 'No couples found'}
            </div>
          ) : (
            filteredCouples.map((couple) => (
              <Card 
                key={couple.id} 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleSelectCouple(couple)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <h4 className="font-medium">{couple.couple_name}</h4>
                      </div>
                      {couple.contact_email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {couple.contact_email}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {(() => {
                        const eventType = getEventTypeFromCouple(couple);
                        const eventTypeConfig = getSmartTagConfig(eventType);
                        return (
                          <EnhancedTag 
                            variant={eventTypeConfig.variant} 
                            icon={eventTypeConfig.icon}
                            size="xs"
                          >
                            {getTagDisplayName(eventType)}
                          </EnhancedTag>
                        );
                      })()}
                      {(() => {
                        const sourceConfig = getSmartTagConfig(couple.source);
                        return (
                          <EnhancedTag 
                            variant={sourceConfig.variant} 
                            icon={sourceConfig.icon}
                            size="xs"
                          >
                            {getTagDisplayName(couple.source)}
                          </EnhancedTag>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {couple.event_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(couple.event_date)}
                      </div>
                    )}
                    {couple.venue && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {couple.venue}
                      </div>
                    )}
                    {couple.guest_count && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">👥 {couple.guest_count} guests</span>
                      </div>
                    )}
                  </div>
                  
                  {couple.package_type && (
                    <div className="mt-2">
                      {(() => {
                        const packageConfig = getSmartTagConfig(couple.package_type);
                        return (
                          <EnhancedTag 
                            variant={packageConfig.variant} 
                            icon={packageConfig.icon}
                            size="xs"
                          >
                            {getTagDisplayName(couple.package_type)}
                          </EnhancedTag>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CoupleSelector;