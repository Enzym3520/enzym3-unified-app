import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Mail, Phone, User, Package, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { safeFormatDate } from '@/utils/dateHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';
import { formatEventType } from '@/utils/notificationHelpers';
import { getPackageTypeLabel } from '@/config/packageTypes';

import { ReadinessChecklist } from '@/components/staff/event-detail/ReadinessChecklist';
import { EventVendorsSection } from '@/components/staff/event-detail/EventVendorsSection';
import { EventPaymentSection } from '@/components/staff/event-detail/EventPaymentSection';
import { EventMusicSummary } from '@/components/staff/event-detail/EventMusicSummary';
import { EventMeetingsSection } from '@/components/staff/event-detail/EventMeetingsSection';
import { EventActivityTimeline } from '@/components/staff/event-detail/EventActivityTimeline';
import { VenuePartnerInvoiceCard } from '@/components/staff/event-detail/VenuePartnerInvoiceCard';
import { WeddingMessagesPanel } from '@/components/staff/messaging/WeddingMessagesPanel';
import { VibeSheetReview } from '@/components/staff/event-detail/VibeSheetReview';
import { useEventReadiness } from '@/hooks/useEventReadiness';
import { getEventStartTime, formatEventTime } from '@/utils/eventTimeHelpers';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch the event notification record
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_notification_history')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: readiness, isLoading: readinessLoading } = useEventReadiness(id);

  if (eventLoading || readinessLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Event not found</p>
        <Link to="/staff/notification-history">
          <Button variant="link" className="mt-2">Back to History</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/staff/notification-history">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">{capitalizeNames(event.couple_name || 'Unknown')}</h1>
            <p className="text-muted-foreground">{formatEventType(event.event_type || '')}</p>
          </div>
        </div>
        <Badge variant={
          event.status === 'completed' ? 'default' :
          event.status === 'in_progress' ? 'secondary' : 'outline'
        } className="capitalize text-sm">
          {event.status}
        </Badge>
      </div>

      {/* Tabbed Sections */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="music">Music Sheet</TabsTrigger>
          <TabsTrigger value="vibe-sheet">Vibe Sheet</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Key Info Bar */}
          <Card>
            <CardContent className="py-4">
              {(() => {
                const meta = event.additional_metadata as Record<string, any> | undefined;
                const fd = meta?.form_data ?? {};
                const startTime = getEventStartTime(event);
                const formattedStartTime = formatEventTime(startTime) || startTime;
                const venueAddress = fd.address;
                const contractUrl = fd.contract;
                const contractSigned = !!event.contract_signed;
                const contractSignedAt = event.contract_signed_at as string | null | undefined;
                const signerName = (event as any).client_signature_name as string | null | undefined;
                return (
                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{safeFormatDate(event.event_date, 'PPP', 'No date')}</span>
                    </div>
                    {formattedStartTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formattedStartTime}</span>
                      </div>
                    )}
                    {(event.venue || venueAddress) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          {event.venue && <div>{event.venue}</div>}
                          {venueAddress && (
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              {venueAddress}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                    {(contractSigned || contractUrl) && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        {contractUrl ? (
                          <a
                            href={contractUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            View contract
                          </a>
                        ) : (
                          <span>
                            Contract signed
                            {signerName ? ` by ${signerName}` : ''}
                            {contractSignedAt ? ` · ${safeFormatDate(contractSignedAt, 'PP', '')}` : ''}
                          </span>
                        )}
                      </div>
                    )}
                {event.guest_count && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{event.guest_count} guests</span>
                  </div>
                )}
                {(() => {
                  const meta = event.additional_metadata as Record<string, any> | undefined;
                  const fd = meta?.form_data;
                  const contactName = event.primary_contact_name || fd?.contactName || fd?.parentName || fd?.brideName;
                  if (!contactName || contactName === event.couple_name) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{capitalizeNames(contactName)}</span>
                    </div>
                  );
                })()}
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{event.contact_email}</span>
                </div>
                {event.contact_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{event.contact_phone}</span>
                  </div>
                )}
                {event.coordinator_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{capitalizeNames(event.coordinator_name)}</span>
                  </div>
                )}
                {(() => {
                  const meta = event.additional_metadata as Record<string, any> | undefined;
                  const fd = meta?.form_data;
                  const source = meta?.bookingSource ?? fd?.bookingSource;
                  if (source === 'independent' || !event.package_type) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span>{getPackageTypeLabel(event.package_type)}</span>
                    </div>
                  );
                })()}
                {(() => {
                  const meta = event.additional_metadata as Record<string, any> | undefined;
                  const fd = meta?.form_data;
                  const hours = meta?.hoursBooked ?? fd?.hoursBooked;
                  const rate = meta?.hourlyRate ?? fd?.hourlyRate;
                  const source = meta?.bookingSource ?? fd?.bookingSource;
                  if (source !== 'independent' || !hours) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{hours} hrs{rate ? ` @ $${rate}/hr` : ''}</span>
                    </div>
                  );
                })()}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Readiness Checklist */}
          {readiness && <ReadinessChecklist readiness={readiness} />}

          {/* Notes */}
          {event.notes && (
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{event.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vendors">
          <EventVendorsSection eventId={event.id} eventDate={event.event_date} />
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardContent className="p-0">
              <WeddingMessagesPanel weddingId={event.id} coupleName={event.couple_name} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="music">
          <EventMusicSummary weddingId={event.id} />
        </TabsContent>

        <TabsContent value="vibe-sheet">
          <VibeSheetReview eventId={id!} eventType={event.event_type || ''} clientEmail={event.contact_email} />
        </TabsContent>

        <TabsContent value="meetings">
          <EventMeetingsSection weddingId={event.id} />
        </TabsContent>

        <TabsContent value="payments">
          <div className="space-y-4">
            {event.booking_source === 'venue_partner' && (
              <VenuePartnerInvoiceCard eventId={event.id} venueName={event.venue} />
            )}
            {readiness ? (
              <EventPaymentSection readiness={readiness} />
            ) : (
              <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No payment data available</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <EventActivityTimeline weddingId={event.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDetailPage;
