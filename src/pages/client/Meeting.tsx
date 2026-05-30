import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMeetingType, formatMeetingFormat, formatPackageType } from "@/lib/formatters";
import { capitalizeWords } from "@/lib/utils";
import {
  Video, Calendar, Clock, CheckCircle2, Circle, CalendarPlus, FileText,
  ChevronDown, ChevronUp, Send, History, Download,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useMeeting } from "@/hooks/useMeeting";

const Meeting = () => {
  const {
    loading, upcomingBooking, pastBooking, weddingData, upcomingState, countdown,
    vibeSheetDone, jaasLoading,
    pastSummary, showTranscript, setShowTranscript, resending,
    vendorName, coordinatorUploads, isVendorPortal, basePath,
    navigate, handleJoinMeeting, handleResendSummary, handleDownloadFile,
  } = useMeeting();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading meeting info...</p>
        </div>
      </div>
    );
  }

  const formattedDate = upcomingBooking
    ? new Date(upcomingBooking.booking_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";

  const formattedTime = upcomingBooking
    ? (() => { const [h, m] = upcomingBooking.booking_time.split(":"); const d = new Date(); d.setHours(Number(h), Number(m)); return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); })()
    : "";

  const checklistItems = [
    ...(!isVendorPortal ? [{ label: "Vibe sheet completed", done: vibeSheetDone, path: `${basePath}/vibe-sheet` }] : []),
    { label: "Contract signed", done: !!weddingData?.contract_signed, path: `${basePath}/contract` },
    { label: "Deposit paid", done: !!weddingData?.deposit_paid, path: null },
    { label: "Files uploaded", done: !!weddingData?.file_uploaded, path: `${basePath}/uploads` },
  ];

  const eventDetails = [
    { label: "Event Type", value: weddingData?.event_type ? capitalizeWords(weddingData.event_type.replace(/_/g, ' ')) : null },
    { label: "Event Date", value: weddingData?.event_date ? new Date(weddingData.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null },
    { label: "Venue", value: weddingData?.venue },
    { label: "Guest Count", value: weddingData?.guest_count?.toString() },
    { label: "Hours Booked", value: weddingData?.hours_booked?.toString() },
    { label: "Package", value: weddingData?.package_type ? formatPackageType(weddingData.package_type) : null },
    { label: "Coordinator", value: weddingData?.coordinator_name },
    { label: "Your DJ", value: vendorName },
  ].filter(item => item.value);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Meeting Room</h1>

      {/* Upcoming/Today OR Schedule CTA */}
      {upcomingState !== "none" && upcomingBooking ? (
        <>
          <Card className={upcomingState === "today" ? "border-2 border-primary shadow-lg" : ""}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2"><Video className="h-10 w-10 text-primary" /></div>
              <CardTitle className="text-xl">
                {vendorName ? `${formatMeetingType(upcomingBooking.meeting_type)} with ${vendorName}` : formatMeetingType(upcomingBooking.meeting_type)}
              </CardTitle>
              <CardDescription>{formatMeetingFormat(upcomingBooking.meeting_format)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-center">
                <div className="flex items-center justify-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{formattedDate}</span></div>
                <div className="flex items-center justify-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{formattedTime}</span></div>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">{upcomingState === "today" ? "Meeting starts in" : "Time until meeting"}</p>
                <p className="text-2xl font-bold text-primary">{countdown}</p>
              </div>
              <div className="flex justify-center">
                <Badge variant={upcomingBooking.status === "confirmed" ? "default" : "secondary"}>{upcomingBooking.status === "confirmed" ? "Confirmed" : "Pending"}</Badge>
              </div>
              {upcomingState === "today" && (
                <div className="space-y-4 text-center">
                  {jaasLoading ? (
                    <div className="flex flex-col items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary mb-3" /><p className="text-sm text-muted-foreground">Preparing meeting link...</p></div>
                  ) : (
                    <>
                      <Button size="lg" className="text-lg px-8 py-6" onClick={handleJoinMeeting}><Video className="mr-2 h-5 w-5" />Join Meeting</Button>
                      <p className="text-sm text-muted-foreground">Your meeting will open in a new tab • Recording is automatic</p>
                    </>
                  )}
                </div>
              )}
              {upcomingState === "upcoming" && <p className="text-sm text-muted-foreground text-center">Your video meeting will appear here on the day of your appointment.</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eventDetails.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Event Details</CardTitle><CardDescription>Your event at a glance</CardDescription></CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    {eventDetails.map((item, i) => (
                      <div key={i} className="flex justify-between items-center"><dt className="text-sm text-muted-foreground">{item.label}</dt><dd className="text-sm font-medium text-right">{item.value}</dd></div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader><CardTitle className="text-lg">Meeting Prep</CardTitle><CardDescription>Make the most of your meeting</CardDescription></CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {checklistItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      {item.done ? <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" /> : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
                      <span className={item.done ? "text-muted-foreground line-through" : ""}>{item.label}</span>
                      {item.path && !item.done && <Button variant="link" size="sm" className="ml-auto p-0 h-auto" onClick={() => navigate(item.path!)}>Go</Button>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Upcoming Meetings</h2>
            <p className="text-muted-foreground mb-6">{vendorName ? `Schedule a meeting with ${vendorName} to go over all the details for your event.` : 'Schedule a meeting with your DJ to go over all the details for your event.'}</p>
            <Button onClick={() => navigate(`${basePath}/schedule`)}><Calendar className="mr-2 h-4 w-4" />Schedule a Meeting</Button>
          </CardContent>
        </Card>
      )}

      {/* Coordinator Detail Forms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Detail Forms from Your Coordinator</CardTitle>
              <CardDescription className="mt-1">Important documents uploaded by your coordinator</CardDescription>
            </div>
            {coordinatorUploads.length > 0 && <Badge variant="secondary">{coordinatorUploads.length} File{coordinatorUploads.length > 1 ? 's' : ''}</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {coordinatorUploads.length > 0 ? (
            <div className="space-y-3">
              {coordinatorUploads.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{file.file_name}</p>
                      {file.notes && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{file.notes}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(file.uploaded_at || file.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDownloadFile(file)}><Download className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No files uploaded yet</p>
              <p className="text-xs mt-1">Your coordinator will upload important detail forms here when ready</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Meeting */}
      {pastBooking && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 pt-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Previous Meeting</h2>
            <span className="text-sm text-muted-foreground">
              — {formatMeetingType(pastBooking.meeting_type)} on{" "}
              {new Date(pastBooking.booking_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          {pastSummary && pastSummary.status === 'processing' && (
            <Card><CardContent className="py-8 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" /><h3 className="text-lg font-semibold mb-1">Generating Summary</h3><p className="text-sm text-muted-foreground">Your meeting recording is being transcribed and summarized. This usually takes a few minutes.</p></CardContent></Card>
          )}

          {pastSummary && pastSummary.status === 'completed' && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Meeting Summary</CardTitle>
                      <CardDescription>Auto-generated from your meeting recording</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleResendSummary} disabled={resending}>
                      {resending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}Resend Email
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {pastSummary.ai_summary?.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line.replace(/\*\*(.*?)\*\*/g, '').trim() || null}</p>)}
                  </div>
                </CardContent>
              </Card>

              {pastSummary.action_items.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Action Items</CardTitle><CardDescription>Tasks from your meeting</CardDescription></CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {pastSummary.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Circle className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.task}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{item.responsible}</Badge>
                              <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">{item.priority}</Badge>
                              {item.deadline && <span className="text-xs text-muted-foreground">{item.deadline}</span>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {pastSummary.raw_transcript && (
                <Collapsible open={showTranscript} onOpenChange={setShowTranscript}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">Full Transcript</CardTitle>
                          {showTranscript ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="bg-muted/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">{pastSummary.raw_transcript}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </>
          )}

          {pastSummary && pastSummary.status === 'failed' && (
            <Card className="border-destructive/30"><CardContent className="py-6 text-center"><p className="text-sm text-muted-foreground">Summary generation encountered an issue. The recording was saved and can be reviewed manually.</p></CardContent></Card>
          )}

          {!pastSummary && (
            <Card><CardContent className="py-6 text-center"><CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" /><p className="text-sm text-muted-foreground">Meeting completed. No summary available for this meeting.</p></CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Meeting;
