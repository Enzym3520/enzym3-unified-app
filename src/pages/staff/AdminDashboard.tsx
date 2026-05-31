import { useState } from 'react';
import BulkClientImport from '@/components/staff/admin/BulkClientImport';
import { VendorPageApprovals } from '@/components/staff/admin/VendorPageApprovals';
import { UpdateRequestsPanel } from '@/components/staff/admin/UpdateRequestsPanel';
import { ReviewPipelinePanel } from '@/components/staff/admin/ReviewPipelinePanel';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, Calendar, UserCog, ClipboardList, 
  TrendingUp, Clock, AlertCircle, Plus, UserPlus, 
  CalendarDays, CheckCircle, XCircle, ArrowRight,
  Music, PartyPopper, Star,
  ChevronDown, MessageSquare, Upload, MessageSquarePlus
} from 'lucide-react';
import AdminAssignmentsDashboard from '@/components/staff/vendor-management/AdminAssignmentsDashboard';
import { FeedbackDashboard } from '@/components/staff/feedback/FeedbackDashboard';
import { safeFormatDate } from '@/utils/dateHelpers';
import { useClientReviews } from '@/hooks/useClientReviews';
import { formatEventType } from '@/utils/notificationHelpers';
import { capitalizeNames } from '@/utils/contactHelpers';
import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pendingReviews, approvedReviews, isLoading: reviewsLoading, approveReview, unapproveReview, rejectReview } = useClientReviews();
  const [approvedOpen, setApprovedOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Allow deep-linking to a specific management tab (e.g. notifications → reviews)
  const tabParam = searchParams.get('tab');
  const validTabs = ['assignments', 'team', 'feedback', 'reviews'];
  const activeTab = tabParam && validTabs.includes(tabParam) ? tabParam : 'assignments';
  const handleTabChange = (value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', value);
      return next;
    }, { replace: true });
  };

  const { stats, recentEvents, pendingItems, isLoading } = useAdminDashboardData();

  const getEventTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'wedding': return <PartyPopper className="h-4 w-4" />;
      case 'quinceanera': return <Music className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">Pending</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Submitted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Vendor Page Approvals */}
      <VendorPageApprovals />
      <UpdateRequestsPanel />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Admin Command Center</h1>
          <p className="text-muted-foreground">Full system overview and management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => navigate('/staff/event-notification/step-1')} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
          <Button onClick={() => navigate('/staff/vendor-management')} variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Vendor
          </Button>
          <Button onClick={() => navigate('/staff/calendar')} variant="outline" size="sm">
            <CalendarDays className="h-4 w-4 mr-2" />
            Calendar
          </Button>
          <Button onClick={() => setImportModalOpen(true)} variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Clients
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <UserCog className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVendors}</div>
            <p className="text-xs text-muted-foreground">{stats.pendingInvites} pending invites</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingAssignments}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events in the next 30 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/staff/calendar')}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/staff/notification-history')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        {getEventTypeIcon(event.event_type)}
                      </div>
                      <div>
                        <p className="font-medium">{capitalizeNames(event.couple_name || 'Unknown')}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.venue || formatEventType(event.event_type)} • {safeFormatDate(event.event_date, 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(event.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Needs Attention
              </CardTitle>
              <Badge variant="secondary">{pendingItems.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500 opacity-50" />
                <p>All caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.map(item => (
                  <div 
                    key={item.id}
                    className="p-3 rounded-lg border bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 transition-colors cursor-pointer"
                    onClick={() => item.action && navigate(item.action)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {item.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">

        <TabsList>
          <TabsTrigger value="assignments">
            <ClipboardList className="w-4 h-4 mr-2" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="w-4 h-4 mr-2" />
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="feedback">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="reviews" className="relative">
            <MessageSquare className="w-4 h-4 mr-2" />
            Reviews
            {pendingReviews.length > 0 && (
              <Badge className="ml-2 h-5 px-1.5 text-xs bg-destructive text-destructive-foreground">
                {pendingReviews.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <AdminAssignmentsDashboard />
        </TabsContent>

        <TabsContent value="feedback">
          <FeedbackDashboard />
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>Staff and role distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-500/10">
                      <UserCog className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalPlanners}</p>
                      <p className="text-sm text-muted-foreground">Event Planners</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalDJs}</p>
                      <p className="text-sm text-muted-foreground">Vendors (DJs)</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                <h3 className="font-semibold mb-2">Security Status</h3>
                <p className="text-sm text-muted-foreground">
                  Admin access is restricted to authorized emails only. All role changes are audited and protected by database-level triggers.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <div className="space-y-6">
            {/* Review Request Pipeline (auto-cadence) */}
            <ReviewPipelinePanel />

            {/* Pending Reviews */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500" />
                      Pending Reviews
                    </CardTitle>
                    <CardDescription>Approve or reject reviews before they go public</CardDescription>
                  </div>
                  {pendingReviews.length > 0 && (
                    <Badge variant="secondary">{pendingReviews.length} pending</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {reviewsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-28 bg-muted animate-pulse rounded-lg" />)}
                  </div>
                ) : pendingReviews.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-60" />
                    <p className="font-medium">No pending reviews — you're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map(review => (
                      <div key={review.id} className="border rounded-lg p-4 space-y-3 bg-card">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{review.reviewer_name}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                                />
                              ))}
                              <span className="text-sm text-muted-foreground ml-1">{review.rating}/5</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {review.would_recommend !== null && (
                              <Badge variant={review.would_recommend ? 'default' : 'secondary'} className="text-xs">
                                {review.would_recommend ? '👍 Would recommend' : '👎 Would not recommend'}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-foreground leading-relaxed border-l-2 border-muted pl-3 italic">
                          "{review.review_text}"
                        </p>

                        {(review.event_name || review.event_type || review.event_date) && (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {review.event_name && <span>📋 {review.event_name}</span>}
                            {review.event_type && <span>• {formatEventType(review.event_type)}</span>}
                            {review.event_date && (
                              <span>• {safeFormatDate(review.event_date, 'MMM d, yyyy')}</span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveReview(review.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectReview(review.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Approved Reviews (collapsible) */}
            <Collapsible open={approvedOpen} onOpenChange={setApprovedOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-accent/40 transition-colors rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Approved Reviews
                        <Badge variant="secondary" className="ml-1">{approvedReviews.length}</Badge>
                      </CardTitle>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${approvedOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    {approvedReviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No approved reviews yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {approvedReviews.map(review => (
                          <div key={review.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-500/5 border-green-500/20">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm truncate">{review.reviewer_name}</p>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatEventType(review.event_type || '') || 'Event'}{review.event_date ? ` • ${safeFormatDate(review.event_date, 'MMM d, yyyy')}` : ''}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                              onClick={() => unapproveReview(review.id)}
                            >
                              Un-approve
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </TabsContent>
      </Tabs>

      <BulkClientImport
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportComplete={() => {}}
      />
    </div>
  );
}
