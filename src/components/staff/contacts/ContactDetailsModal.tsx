import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { parseLocalDate, safeFormatDate } from '@/utils/dateHelpers';
import { 
  X, Mail, Phone, Calendar, MapPin, Tag, User, 
  Clock, Music, Package, FileText, Edit, Printer, RotateCcw, Download, MessageSquare, Upload, Loader2, CalendarPlus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contact } from '@/types/contact';
import { getEventTypeIcon, formatEventType } from '@/utils/notificationHelpers';
// NotificationStatusBadge — inline stub (component not yet extracted to shared lib)
const NotificationStatusBadge = ({ status }: { status: string }) => (
  <Badge variant={status === 'completed' ? 'default' : status === 'in_progress' ? 'secondary' : 'outline'}>
    {status}
  </Badge>
);
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';
import { getTagDisplayName } from '@/utils/tagHelpers';
import EditTagsModal from './EditTagsModal';
import { useContactTags } from '@/hooks/useContactTags';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPackageTypeLabel } from '@/config/packageTypes';
import { useContactMusicSheet } from '@/hooks/useContactMusicSheet';
import { useContactUpgrades } from '@/hooks/useContactUpgrades';
import { MusicSheetTab } from './MusicSheetTab';
import { UpgradesTab } from './UpgradesTab';
import { capitalizeNames } from '@/utils/contactHelpers';
import EventAssignmentsView from '@/components/staff/vendor-management/EventAssignmentsView';
import { WeddingMessagesPanel } from '@/components/staff/messaging/WeddingMessagesPanel';
import { useWeddingMessages } from '@/hooks/useWeddingMessages';
import { useClientFiles, downloadClientFile } from '@/hooks/useClientFiles';
import { ScheduleMeetingModal } from '@/components/staff/calendar/ScheduleMeetingModal';
import { getEventStartTime, formatEventTime } from '@/utils/eventTimeHelpers';
interface ContactDetailsModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onContactUpdate?: () => void;
  defaultTab?: string;
}

const ContactDetailsModal = ({ contact, isOpen, onClose, onContactUpdate, defaultTab }: ContactDetailsModalProps) => {
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [scheduleMeetingOpen, setScheduleMeetingOpen] = useState(false);
  const { toast } = useToast();
  const { updateContactTags } = useContactTags();

  // Get wedding_id from event history (use the most recent one)
  const weddingId = contact?.eventHistory?.[0]?.id;

  // Fetch music sheet, upgrades, and client files for this contact
  const { data: musicSheet, isLoading: musicSheetLoading } = useContactMusicSheet(weddingId);
  const { data: upgrades, isLoading: upgradesLoading } = useContactUpgrades(weddingId);
  const { data: clientFiles, isLoading: clientFilesLoading } = useClientFiles(weddingId);
  const { unreadCount: unreadMessages } = useWeddingMessages({ weddingId, enabled: !!weddingId });

  // Show loading state when modal is open but contact is still loading
  if (!contact) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="h-8 w-full bg-muted animate-pulse rounded" />
            <div className="h-32 w-full bg-muted animate-pulse rounded" />
            <div className="h-32 w-full bg-muted animate-pulse rounded" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleTagsUpdate = async (contactId: string, tags: string[]) => {
    await updateContactTags(contactId, tags);
    if (onContactUpdate) {
      onContactUpdate();
    }
  };

  const handleDownloadDetailsForm = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('wedding-uploads')
        .download(filePath);

      if (error) throw error;

      // Create download URL and trigger download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download started",
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error downloading file:', error);
      toast({
        title: "Download failed",
        description: "Could not download the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const statusColors = {
    active: 'bg-blue-100 text-blue-800 border-blue-200',
    past_client: 'bg-green-100 text-green-800 border-green-200',
    potential: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  const statusLabels = {
    active: 'Active Client',
    past_client: 'Past Client',
    potential: 'Potential Client'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{contact.name}</DialogTitle>
                <p className="text-muted-foreground">{contact.email}</p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`${statusColors[contact.status]}`}
            >
              {statusLabels[contact.status]}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue={defaultTab || "overview"} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages" className="relative">
              <MessageSquare className="w-3 h-3 mr-1" />
              Messages
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadMessages}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="assignments">Vendors</TabsTrigger>
            <TabsTrigger value="events">Event History</TabsTrigger>
            <TabsTrigger value="forms">Forms & Documents</TabsTrigger>
            <TabsTrigger value="music">
              <Music className="w-3 h-3 mr-1" />
              Music Sheet
            </TabsTrigger>
            <TabsTrigger value="upgrades">
              <Package className="w-3 h-3 mr-1" />
              Upgrades
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contact.brideInfo && contact.groomInfo ? (
                  // Wedding Contact - Show Bride & Groom Details
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                        Bride
                      </h4>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">{contact.brideInfo.name}</p>
                        {contact.brideInfo.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{contact.brideInfo.email}</span>
                          </div>
                        )}
                        {contact.brideInfo.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{contact.brideInfo.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        Groom
                      </h4>
                      <div className="space-y-2">
                        <p className="font-medium text-gray-800">{contact.groomInfo.name}</p>
                        {contact.groomInfo.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span>{contact.groomInfo.email}</span>
                          </div>
                        )}
                        {contact.groomInfo.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            <span>{contact.groomInfo.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Regular Contact Info
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{contact.email}</span>
                    </div>
                    
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {parseLocalDate(contact.primaryEventDate) > new Date() ? 'Upcoming ' : ''}
                      {contact.primaryEventType.charAt(0).toUpperCase() + contact.primaryEventType.slice(1)}: {safeFormatDate(contact.primaryEventDate, 'PPP')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>Client Since: {format(new Date(contact.createdAt), 'PPP')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Meeting Button */}
            {weddingId && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => setScheduleMeetingOpen(true)}
              >
                <CalendarPlus className="h-4 w-4" />
                Schedule Meeting with {contact.name}
              </Button>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{contact.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">Total Events</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{contact.eventTypes.length}</div>
                  <p className="text-xs text-muted-foreground">Event Types</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{contact.preferredVenues.length}</div>
                  <p className="text-xs text-muted-foreground">Venues Used</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{Math.round(contact.formCompletionRate || 0)}%</div>
                  <p className="text-xs text-muted-foreground">Form Completion</p>
                </CardContent>
              </Card>
            </div>

            {/* Event Types & Venues */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {contact.eventTypes.map(eventType => (
                      <div key={eventType} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                        <span className="text-lg">{getEventTypeIcon(eventType)}</span>
                        <span className="text-sm">{formatEventType(eventType)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Preferred Venues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {contact.preferredVenues.slice(0, 5).map(venue => (
                      <div key={venue} className="flex items-center gap-2 text-sm">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span>{venue}</span>
                      </div>
                    ))}
                    {contact.preferredVenues.length > 5 && (
                      <p className="text-xs text-muted-foreground">
                        +{contact.preferredVenues.length - 5} more venues
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Messages with {contact.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WeddingMessagesPanel 
                  weddingId={weddingId} 
                  coupleName={contact.name}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            {weddingId && contact.primaryEventDate ? (
              <EventAssignmentsView 
                eventId={weddingId} 
                eventDate={contact.primaryEventDate}
                vendorType={contact.primaryEventType === 'wedding' ? 'dj' : undefined}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No event information available for vendor assignments.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <div className="space-y-4">
              {contact.eventHistory
                .sort((a, b) => parseLocalDate(b.event_date).getTime() - parseLocalDate(a.event_date).getTime())
                .map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                        <div>
                          <h4 className="font-semibold">{capitalizeNames(event.couple_name || 'Unknown')}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatEventType(event.event_type)} Event
                          </p>
                        </div>
                      </div>
                      <NotificationStatusBadge status={event.status} />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{safeFormatDate(event.event_date, 'PPP')}</span>
                      </div>
                      
                      {(() => {
                        const startTime = getEventStartTime(event);
                        const formatted = formatEventTime(startTime) || startTime;
                        if (!formatted) return null;
                        return (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span>Start: {formatted}</span>
                          </div>
                        );
                      })()}
                      
                      {((event as any).contract_signed || (event as any).additional_metadata?.form_data?.contract) && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          {(event as any).additional_metadata?.form_data?.contract ? (
                            <a
                              href={(event as any).additional_metadata.form_data.contract}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View contract
                            </a>
                          ) : (
                            <span>
                              Contract signed
                              {(event as any).client_signature_name
                                ? ` by ${(event as any).client_signature_name}`
                                : ''}
                              {(event as any).contract_signed_at
                                ? ` · ${safeFormatDate((event as any).contract_signed_at, 'PP', '')}`
                                : ''}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {event.venue && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}
                      
                      {event.dj_name && (
                        <div className="flex items-center gap-2 text-sm">
                          <Music className="w-4 h-4 text-muted-foreground" />
                          <span>{event.dj_name}</span>
                        </div>
                      )}
                      
                      {event.package_type && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{getPackageTypeLabel(event.package_type)}</span>
                        </div>
                      )}
                    </div>

                    {event.notes && (
                      <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <p className="font-medium mb-1">Notes:</p>
                        <p className="text-muted-foreground">{event.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>Submitted {format(new Date(event.created_at), 'PPp')}</span>
                      <span>by {event.submitted_by}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <div className="space-y-4">
              {contact.formSubmissions && contact.formSubmissions.length > 0 ? (
                <div className="space-y-4">
                  {/* Form Completion Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Form Completion Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{contact.completedForms}</div>
                          <p className="text-xs text-muted-foreground">Completed Forms</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{contact.totalForms}</div>
                          <p className="text-xs text-muted-foreground">Total Forms</p>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{Math.round(contact.formCompletionRate)}%</div>
                          <p className="text-xs text-muted-foreground">Completion Rate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Form Submissions List */}
                  {contact.formSubmissions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((submission) => (
                    <Card key={submission.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div>
                              <h4 className="font-semibold">Form Submission</h4>
                              <p className="text-sm text-muted-foreground">
                                Wedding ID: {submission.wedding_id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                submission.status === 'emailed' || submission.status === 'processed' 
                                  ? 'default' 
                                  : submission.status === 'submitted' 
                                  ? 'secondary' 
                                  : 'outline'
                              }
                            >
                              {submission.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>Submitted: {format(new Date(submission.created_at), 'PPp')}</span>
                          </div>
                          
                          {submission.pdf_generated_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span>PDF Generated: {format(new Date(submission.pdf_generated_at), 'PPp')}</span>
                            </div>
                          )}
                          
                          {submission.email_sent_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span>Email Sent: {format(new Date(submission.email_sent_at), 'PPp')}</span>
                            </div>
                          )}
                          
                          {submission.webhook_sent_at && (
                            <div className="flex items-center gap-2 text-sm">
                              <RotateCcw className="w-4 h-4 text-muted-foreground" />
                              <span>Webhook Sent: {format(new Date(submission.webhook_sent_at), 'PPp')}</span>
                            </div>
                          )}
                        </div>

                        {/* Form Data Preview */}
                        {submission.form_data && (
                          <div className="bg-muted/50 rounded-lg p-3 text-sm">
                            <p className="font-medium mb-1">Form Data Summary:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {submission.form_data.eventType && (
                                <span>Event Type: {submission.form_data.eventType}</span>
                              )}
                              {submission.form_data.eventDate && (
                                <span>Event Date: {submission.form_data.eventDate}</span>
                              )}
                              {submission.form_data.venue && (
                                <span>Venue: {submission.form_data.venue}</span>
                              )}
                              {submission.form_data.numberOfGuests && (
                                <span>Guests: {submission.form_data.numberOfGuests}</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>ID: {submission.id.slice(0, 8)}...</span>
                          <div className="flex gap-2">
                            {submission.pdf_generated_at && (
                              <Button variant="outline" size="sm" className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                View PDF
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Printer className="w-3 h-3" />
                              Print
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Form Submissions</h3>
                    <p className="text-muted-foreground text-sm">
                      This contact hasn't submitted any forms yet.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Uploaded Details Forms Section (Coordinator Uploads) */}
              {contact.uploadedDetailsForms && contact.uploadedDetailsForms.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Uploaded Details Forms ({contact.uploadedDetailsForms.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {contact.uploadedDetailsForms
                        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
                        .map((upload) => (
                          <div key={upload.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="w-5 h-5 text-primary" />
                              <div className="flex-1">
                                <p className="font-medium">{upload.file_name}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  <span>Uploaded: {format(new Date(upload.uploaded_at), 'PPp')}</span>
                                  <span>by {upload.uploaded_by}</span>
                                </div>
                                {upload.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">{upload.notes}</p>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDownloadDetailsForm(upload.file_path, upload.file_name)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Client Uploads Section (from Vibe Planner) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Client Uploads
                    {clientFiles && clientFiles.length > 0 && (
                      <Badge variant="secondary">{clientFiles.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {clientFilesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading client files...</span>
                    </div>
                  ) : clientFiles && clientFiles.length > 0 ? (
                    <div className="space-y-3">
                      {clientFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{file.file_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                                <Badge variant="outline" className="capitalize text-xs">
                                  {file.label}
                                </Badge>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
                                {file.file_size && (
                                  <>
                                    <span>•</span>
                                    <span>{(file.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                  </>
                                )}
                                {file.sent_to_coordinator && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="secondary" className="text-xs">Sent to Coordinator</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                await downloadClientFile(file.file_path, file.file_name);
                                toast({
                                  title: "Download started",
                                  description: `Downloading ${file.file_name}`,
                                });
                              } catch (error) {
                                if (import.meta.env.DEV) console.error('Download error:', error);
                                toast({
                                  title: "Download failed",
                                  description: "Could not download the file. Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No files uploaded by the couple yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="music" className="space-y-4">
            <MusicSheetTab musicSheet={musicSheet || null} loading={musicSheetLoading} />
          </TabsContent>

          <TabsContent value="upgrades" className="space-y-4">
            <UpgradesTab upgrades={upgrades || []} loading={upgradesLoading} />
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Tags</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditTagsOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Tags
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.length === 0 ? (
                    <span className="text-muted-foreground text-sm">No tags assigned</span>
                  ) : (
                    contact.tags.map(tag => {
                      const { variant, icon } = getSmartTagConfig(tag);
                      return (
                        <EnhancedTag 
                          key={tag} 
                          variant={variant}
                          size="sm"
                          icon={icon}
                          className="animate-fade-in"
                        >
                          {getTagDisplayName(tag)}
                        </EnhancedTag>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {contact.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{contact.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Tags Modal */}
        <EditTagsModal
          contact={contact}
          isOpen={editTagsOpen}
          onClose={() => setEditTagsOpen(false)}
          onSave={handleTagsUpdate}
        />

        {/* Schedule Meeting Modal */}
        <ScheduleMeetingModal
          isOpen={scheduleMeetingOpen}
          onClose={() => setScheduleMeetingOpen(false)}
          weddingId={weddingId}
          coupleName={contact.name}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ContactDetailsModal;