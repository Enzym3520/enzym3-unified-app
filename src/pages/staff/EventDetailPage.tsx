import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Users, Mail, Phone, User, Package, Clock, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ContractViewer from '@/components/ContractViewer';
import { isVenuePartner, VENUE_PARTNER_OVERTIME_RATE, INDEPENDENT_OVERTIME_RATE } from '@/lib/venueUtils';
import type { PricingType } from '@/lib/venueUtils';
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
import { EventMeetingsSection } from '@/components/staff/event-detail/EventMeetingsSection';
import { EventActivityTimeline } from '@/components/staff/event-detail/EventActivityTimeline';
import { VenuePartnerInvoiceCard } from '@/components/staff/event-detail/VenuePartnerInvoiceCard';
import { WeddingMessagesPanel } from '@/components/staff/messaging/WeddingMessagesPanel';
import { VibeSheetReview } from '@/components/staff/event-detail/VibeSheetReview';
import { useEventReadiness, EventReadiness } from '@/hooks/useEventReadiness';
import { getEventStartTime, formatEventTime } from '@/utils/eventTimeHelpers';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contractDialogOpen, setContractDialogOpen] = useState(false);

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
                          <button
                            onClick={() => setContractDialogOpen(true)}
                            className="text-primary hover:underline text-left"
                          >
                            Contract signed
                            {signerName ? ` by ${signerName}` : ''}
                            {contractSignedAt ? ` · ${safeFormatDate(contractSignedAt, 'PP', '')}` : ''}
                          </button>
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
            {(() => {
              const ev = event as any;
              const paymentReadiness: EventReadiness | null = readiness ?? (
                (ev.deposit_amount || ev.balance_due)
                  ? {
                      event_id: event.id,
                      couple_name: event.couple_name ?? '',
                      event_date: event.event_date ?? '',
                      event_type: event.event_type ?? '',
                      venue: event.venue ?? null,
                      package_type: event.package_type ?? null,
                      coordinator_name: event.coordinator_name ?? null,
                      contact_email: event.contact_email ?? '',
                      contact_phone: event.contact_phone ?? null,
                      guest_count: event.guest_count ?? null,
                      notes: event.notes ?? null,
                      contract_signed: event.contract_signed ?? null,
                      contract_signed_at: ev.contract_signed_at ?? null,
                      deposit_paid: ev.deposit_paid ?? null,
                      deposit_amount: ev.deposit_amount ?? null,
                      deposit_paid_at: ev.deposit_paid_at ?? null,
                      balance_paid: ev.balance_paid ?? null,
                      balance_due: ev.balance_due ?? null,
                      balance_paid_at: ev.balance_paid_at ?? null,
                      stripe_payment_intent_id: ev.stripe_payment_intent_id ?? null,
                      assignment_id: null, vendor_user_id: null, vendor_status: null,
                      vendor_confirmed: null, vendor_confirmed_at: null, vendor_files_uploaded: null,
                      vendor_first_name: null, vendor_last_name: null, vendor_company: null,
                      vendor_type: null, music_sheet_id: null, music_sheet_submitted: null,
                      first_dance: null, last_dance: null, fully_ready: null, days_until_event: null,
                    } as EventReadiness
                  : null
              );
              return paymentReadiness ? (
                <EventPaymentSection readiness={paymentReadiness} balancePaymentMethod={ev.balance_payment_method ?? null} />
              ) : (
                <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No payment data available</CardContent></Card>
              );
            })()}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <EventActivityTimeline weddingId={event.id} />
        </TabsContent>
      </Tabs>

      {/* Signed contract viewer */}
      <Dialog open={contractDialogOpen} onOpenChange={setContractDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Signed Contract — {event.couple_name}</DialogTitle>
          </DialogHeader>
          {(() => {
            const overtimeRate = (event as any).overtime_rate
              ?? (event.booking_source === 'venue_partner' || event.payment_required === false
                ? VENUE_PARTNER_OVERTIME_RATE
                : isVenuePartner(event.venue)
                  ? VENUE_PARTNER_OVERTIME_RATE
                  : INDEPENDENT_OVERTIME_RATE);
            const pricingType = ((event as any).pricing_type as PricingType) || 'hourly';
            return (
              <>
                <ContractViewer
                  coupleName={event.couple_name}
                  eventDate={event.event_date}
                  venue={event.venue || ''}
                  hours={(event as any).hours_booked ?? 0}
                  hourlyRate={(event as any).hourly_rate ?? 0}
                  guestCount={(event as any).guest_count || undefined}
                  djMealIncluded={(event as any).dj_meal_included || false}
                  overtimeRate={overtimeRate}
                  pricingType={pricingType}
                  totalPrice={(event as any).total_price}
                />
                {(event as any).contract_signature_data && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Signature</h3>
                    <div className="flex items-end gap-8">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Client Signature</p>
                        <div className="border-b-2 border-foreground pb-1 min-w-[200px]">
                          <img src={(event as any).contract_signature_data} alt="Client Signature" className="max-h-12" />
                        </div>
                        <p className="text-sm font-medium mt-1">{(event as any).client_signature_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Signed: {event.contract_signed_at && new Date(event.contract_signed_at as string).toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailPage;
