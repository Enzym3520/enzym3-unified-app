import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Mail, Phone, Package, Clock, UsersRound, Shirt, Navigation, MessageSquarePlus, User, Music, FileSignature, CalendarDays, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVendorType, parseEventDate } from '@/utils/vendorHelpers';
import { EventFilesViewer } from '@/components/vendor/EventFilesViewer';
import { RequestInfoUpdateModal } from '@/components/vendor/RequestInfoUpdateModal';
import { useMyUpdateRequests } from '@/hooks/use-update-requests';
import { getMapsUrl } from '@/utils/mapsLink';
import { VibeSheetReview } from '@/components/staff/event-detail/VibeSheetReview';
import { ContractPreview } from '@/components/vendor/contracts/ContractPreview';
import { EventPrepChecklist } from '@/components/vendor/EventPrepChecklist';

interface VendorEventDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
}

export function VendorEventDetails({ open, onOpenChange, assignment }: VendorEventDetailsProps) {
  const navigate = useNavigate();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [previewContract, setPreviewContract] = useState<any>(null);
  const event = assignment?.event;
  const eventId = event?.id;
  const { data: myRequests } = useMyUpdateRequests(eventId);

  const { data: otherVendors } = useQuery({
    queryKey: ['event-vendors', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_dj_assignments')
        .select(`
          id,
          status,
          dj_user:vendor_profiles_safe!event_dj_assignments_dj_user_id_fkey(
            id,
            first_name,
            last_name,
            company_name,
            vendor_type,
            phone,
            email
          )
        `)
        .eq('event_id', eventId)
        .neq('dj_user_id', assignment.dj_user_id);
      if (error) throw error;
      return data;
    },
    enabled: open && !!eventId,
  });

  const { data: timelineItems } = useQuery({
    queryKey: ['event-timeline', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('event_timeline_items')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open && !!eventId,
  });

  const { data: contracts } = useQuery({
    queryKey: ['event-contracts', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('vendor_contracts')
        .select('id, title, status, sent_at, signed_at, content_html, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!eventId,
  });

  const { data: eventMeetings } = useQuery({
    queryKey: ['event-meetings', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_date, booking_time, meeting_type, meeting_format, meeting_link, status, vendor_rsvp')
        .eq('wedding_id', eventId)
        .order('booking_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: open && !!eventId,
  });

  const { data: vibeSheetStatus } = useQuery({
    queryKey: ['vibe-sheet-status', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data } = await supabase
        .from('vibe_sheets')
        .select('id, submitted_at')
        .eq('wedding_id', eventId)
        .maybeSingle();
      return data;
    },
    enabled: open && !!eventId,
  });

  if (!event) return null;

  const today = new Date().toISOString().split('T')[0];
  const upcomingMeetings = (eventMeetings || []).filter((m: any) => m.booking_date >= today && m.status !== 'cancelled');
  const vibeSheetSubmitted = !!(vibeSheetStatus?.submitted_at);
  const hasMeeting = upcomingMeetings.length > 0;

  const contractStatusColor = (status: string) => {
    if (status === 'signed') return 'default';
    if (status === 'sent') return 'secondary';
    return 'outline';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{event.couple_name}</DialogTitle>
            {assignment.wedding_id || assignment.event_dj_assignment_id ? (
              <Badge variant="outline" className="text-xs">Enzym3 Gig</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">My Gig</Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vibe-sheet" className="gap-1.5">
              <Music className="h-3.5 w-3.5" />
              Vibe Sheet
            </TabsTrigger>
            <TabsTrigger value="contract" className="gap-1.5">
              <FileSignature className="h-3.5 w-3.5" />
              Contract
            </TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Event Details</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setRequestModalOpen(true)}>
                  <MessageSquarePlus className="mr-2 h-4 w-4" />
                  Request Info Update
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prep checklist */}
                <div className="rounded-lg border p-4">
                  <EventPrepChecklist
                    assignment={assignment}
                    vibeSheetSubmitted={vibeSheetSubmitted}
                    hasMeeting={hasMeeting}
                  />
                </div>

                {/* Client Contact — always shown */}
                <div className="rounded-lg bg-muted/40 p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Client</h4>
                  <p className="font-medium">{event.couple_name}</p>
                  {(event.primary_contact_name || event.client_name || event.honoree_name) && (
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <User className="h-3.5 w-3.5" />
                      {event.primary_contact_name || event.client_name || event.honoree_name}
                    </div>
                  )}
                  {(event.primary_contact_email) && (
                    <a href={`mailto:${event.primary_contact_email}`} className="flex items-center text-sm text-primary hover:underline gap-2">
                      <Mail className="h-3.5 w-3.5" />
                      {event.primary_contact_email}
                    </a>
                  )}
                  {(event.primary_contact_phone) && (
                    <a href={`tel:${event.primary_contact_phone}`} className="flex items-center text-sm text-primary hover:underline gap-2">
                      <Phone className="h-3.5 w-3.5" />
                      {event.primary_contact_phone}
                    </a>
                  )}
                  {!event.primary_contact_email && !event.primary_contact_phone && (
                    <p className="text-xs text-muted-foreground">Contact details not on file — reach out to your coordinator.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      Event Date
                    </div>
                    <p className="font-medium">{format(parseEventDate(event.event_date), 'EEEE, MMMM d, yyyy')}</p>
                  </div>

                  {event.venue && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="mr-2 h-4 w-4" />
                        Venue
                      </div>
                      <a
                        href={getMapsUrl(event.venue_address || event.venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        {event.venue}
                        <Navigation className="h-3 w-3" />
                      </a>
                      {event.venue_address && (
                        <p className="text-xs text-muted-foreground">{event.venue_address}</p>
                      )}
                    </div>
                  )}

                  {event.guest_count && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="mr-2 h-4 w-4" />
                        Guest Count
                      </div>
                      <p className="font-medium">{event.guest_count} guests</p>
                    </div>
                  )}

                  {(event.event_start_time || event.start_time) && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        Start Time
                      </div>
                      <p className="font-medium">{event.event_start_time || event.start_time}</p>
                    </div>
                  )}

                  {event.hours_booked && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="mr-2 h-4 w-4" />
                        Hours Booked
                      </div>
                      <p className="font-medium">{event.hours_booked} hours</p>
                    </div>
                  )}

                  {event.package_type && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="mr-2 h-4 w-4" />
                        Package Type
                      </div>
                      <p className="font-medium">{event.package_type}</p>
                    </div>
                  )}

                  {event.dress_code && (
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Shirt className="mr-2 h-4 w-4" />
                        Dress Code
                      </div>
                      <p className="font-medium">{event.dress_code}</p>
                    </div>
                  )}
                </div>

                {event.coordinator_name && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Coordinator</h4>
                    <div className="space-y-2">
                      <p className="font-medium">{event.coordinator_name}</p>
                      {event.contact_email && (
                        <a href={`mailto:${event.contact_email}`} className="flex items-center text-sm text-primary hover:underline">
                          <Mail className="mr-2 h-4 w-4" />
                          {event.contact_email}
                        </a>
                      )}
                      {event.contact_phone && (
                        <a href={`tel:${event.contact_phone}`} className="flex items-center text-sm text-primary hover:underline">
                          <Phone className="mr-2 h-4 w-4" />
                          {event.contact_phone}
                        </a>
                      )}
                    </div>
                    {event.contact_instruction && (
                      <p className="text-sm text-muted-foreground mt-2">{event.contact_instruction}</p>
                    )}
                  </div>
                )}

                {(event.notes || assignment.assignment_notes) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-2">Notes</h4>
                    {assignment.assignment_notes && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Assignment Notes:</p>
                        <p className="text-sm">{assignment.assignment_notes}</p>
                      </div>
                    )}
                    {event.notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Event Notes:</p>
                        <p className="text-sm">{event.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Meetings for this event */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">Meetings</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { onOpenChange(false); navigate('/vendor/meetings'); }}
                    >
                      <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                      All Meetings
                    </Button>
                  </div>
                  {upcomingMeetings.length > 0 ? (
                    <div className="space-y-2">
                      {upcomingMeetings.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
                          <div>
                            <p className="font-medium capitalize">{(m.meeting_type || '').replace(/_/g, ' ')}</p>
                            <p className="text-muted-foreground">
                              {format(new Date(m.booking_date), 'MMM d, yyyy')} at {m.booking_time}
                              {m.meeting_format ? ` · ${m.meeting_format}` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.vendor_rsvp && (
                              <Badge variant={m.vendor_rsvp === 'accepted' ? 'default' : 'secondary'} className="capitalize text-xs">
                                {m.vendor_rsvp}
                              </Badge>
                            )}
                            {m.meeting_link && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={m.meeting_link} target="_blank" rel="noopener noreferrer">Join</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No upcoming meetings scheduled for this event.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {myRequests && myRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Your Update Requests</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {myRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-2 rounded border bg-muted/30 text-sm">
                      <div>
                        <span className="font-medium">{req.field_name}</span>
                        {req.suggested_value && (
                          <span className="text-muted-foreground"> → {req.suggested_value}</span>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize ml-2 shrink-0">
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <RequestInfoUpdateModal
              open={requestModalOpen}
              onOpenChange={setRequestModalOpen}
              eventId={event.id}
            />
          </TabsContent>

          {/* VIBE SHEET */}
          <TabsContent value="vibe-sheet">
            <VibeSheetReview eventId={eventId} eventType={event.event_type} />
          </TabsContent>

          {/* CONTRACT */}
          <TabsContent value="contract" className="space-y-4">
            {contracts && contracts.length > 0 ? (
              contracts.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{c.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant={contractStatusColor(c.status)} className="capitalize text-xs">{c.status}</Badge>
                          {c.sent_at && <span>Sent {format(new Date(c.sent_at), 'MMM d, yyyy')}</span>}
                          {c.signed_at && <span>· Signed {format(new Date(c.signed_at), 'MMM d, yyyy')}</span>}
                        </div>
                      </div>
                      {c.content_html && (
                        <Button variant="outline" size="sm" onClick={() => setPreviewContract(c)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Preview
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <FileSignature className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No contract on file</p>
                  <p className="text-sm mt-1">Contracts you create for this event will appear here.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => { onOpenChange(false); navigate('/vendor/contracts'); }}
                  >
                    Go to Contracts
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-4">
            {timelineItems && timelineItems.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Event Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {timelineItems.map((item: any) => (
                      <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                        <div className="font-semibold text-sm min-w-[80px]">{item.start_time}</div>
                        <div className="flex-1">
                          <p className="font-medium">{item.label}</p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground">{item.notes}</p>
                          )}
                        </div>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No timeline information available yet
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FILES */}
          <TabsContent value="files" className="space-y-4">
            <EventFilesViewer eventId={event.id} />
          </TabsContent>

          {/* VENDORS */}
          <TabsContent value="vendors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5" />
                  Other Vendors on This Event
                </CardTitle>
              </CardHeader>
              <CardContent>
                {otherVendors && otherVendors.length > 0 ? (
                  <div className="space-y-3">
                    {otherVendors.map((v: any) => {
                      const vendor = v.dj_user;
                      if (!vendor) return null;
                      const name = vendor.company_name || `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim();
                      return (
                        <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div>
                            <p className="font-medium">{name}</p>
                            {vendor.vendor_type && (
                              <p className="text-xs text-muted-foreground">{formatVendorType(vendor.vendor_type)}</p>
                            )}
                          </div>
                          <Badge variant={v.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">{v.status}</Badge>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No other vendors assigned to this event</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {previewContract && (
          <ContractPreview
            open={!!previewContract}
            onOpenChange={(v) => { if (!v) setPreviewContract(null); }}
            title={previewContract.title}
            html={previewContract.content_html}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
