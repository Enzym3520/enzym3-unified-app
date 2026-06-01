import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Calendar, MapPin, Users, Mail, Phone, Package, Clock, FileText, UsersRound, Shirt, Navigation, StickyNote, FolderOpen, MessageSquarePlus, User } from 'lucide-react';
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

interface VendorEventDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
}

export function VendorEventDetails({ open, onOpenChange, assignment }: VendorEventDetailsProps) {
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const event = assignment?.event;
  const eventId = event?.id;
  const { data: myRequests } = useMyUpdateRequests(eventId);

  // Fetch other vendors assigned to this event
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

  // Fetch timeline items
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

  if (!event) return null;

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
          </TabsList>

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

                {/* Client Contact Section */}
                {(event.client_name || event.honoree_name || event.primary_contact_name || event.primary_contact_email || event.primary_contact_phone || event.bride_email || event.groom_email) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Client Contact</h4>
                    <div className="space-y-2">
                      {(event.client_name || event.honoree_name) && (
                        <div className="flex items-center text-sm">
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{event.client_name || event.honoree_name}</span>
                        </div>
                      )}
                      {event.primary_contact_name && event.primary_contact_name !== event.client_name && (
                        <p className="text-sm text-muted-foreground ml-6">Primary Contact: {event.primary_contact_name}</p>
                      )}
                      {event.primary_contact_email && (
                        <a href={`mailto:${event.primary_contact_email}`} className="flex items-center text-sm text-primary hover:underline">
                          <Mail className="mr-2 h-4 w-4" />
                          {event.primary_contact_email}
                        </a>
                      )}
                      {event.primary_contact_phone && (
                        <a href={`tel:${event.primary_contact_phone}`} className="flex items-center text-sm text-primary hover:underline">
                          <Phone className="mr-2 h-4 w-4" />
                          {event.primary_contact_phone}
                        </a>
                      )}
                      {event.bride_email && event.bride_email !== event.primary_contact_email && (
                        <a href={`mailto:${event.bride_email}`} className="flex items-center text-sm text-primary hover:underline">
                          <Mail className="mr-2 h-4 w-4" />
                          {event.bride_email}
                        </a>
                      )}
                      {event.groom_email && event.groom_email !== event.primary_contact_email && (
                        <a href={`mailto:${event.groom_email}`} className="flex items-center text-sm text-primary hover:underline">
                          <Mail className="mr-2 h-4 w-4" />
                          {event.groom_email}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {event.coordinator_name && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Coordinator Contact</h4>
                    <div className="space-y-2">
                      <p className="font-medium">{event.coordinator_name}</p>
                      {event.contact_email && (
                        <a
                          href={`mailto:${event.contact_email}`}
                          className="flex items-center text-sm text-primary hover:underline"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          {event.contact_email}
                        </a>
                      )}
                      {event.contact_phone && (
                        <a
                          href={`tel:${event.contact_phone}`}
                          className="flex items-center text-sm text-primary hover:underline"
                        >
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
              </CardContent>
            </Card>

            {/* Pending update requests */}
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

          <TabsContent value="files" className="space-y-4">
            <EventFilesViewer eventId={event.id} />
          </TabsContent>

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
      </DialogContent>
    </Dialog>
  );
}
