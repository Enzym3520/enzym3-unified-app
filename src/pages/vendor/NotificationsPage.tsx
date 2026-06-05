import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell, CheckCheck, Trash2, Calendar, MessageSquare, FileText, Handshake,
  CalendarClock, Music, AlertCircle, Inbox, MoreVertical, MailOpen, Mail
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  useNotifications, useMarkRead, useMarkAllRead,
  useDeleteNotification, useClearAllRead, type Notification,
} from "@/hooks/use-notifications";
import { EmptyState } from "@/components/vendor/EmptyState";
import { getNotificationRoute, toVendorNotificationRoute } from "@/utils/notificationRoutes";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function getTypeIcon(type: string) {
  switch (type) {
    case "message": return MessageSquare;
    case "vendor_assignment":
    case "new_assignment":
    case "vendor_confirmed":
    case "vendor_declined":
    case "vendor_completed":
    case "assignment_cancelled":
    case "event_updated": return Calendar;
    case "meeting_scheduled":
    case "meeting_updated":
    case "meeting_cancelled": return CalendarClock;
    case "contract_signed":
    case "contract_sent":
    case "contract_viewed": return Handshake;
    case "vendor_files_uploaded":
    case "file_uploaded": return FileText;
    case "music_sheet_created":
    case "music_sheet_updated": return Music;
    case "reminder": return AlertCircle;
    default: return Bell;
  }
}

const TYPE_TONE: Record<string, string> = {
  message: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  vendor_assignment: "bg-primary/10 text-primary",
  new_assignment: "bg-primary/10 text-primary",
  event_updated: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  meeting_scheduled: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  contract_signed: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  vendor_files_uploaded: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  music_sheet_created: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  music_sheet_updated: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  reminder: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

function groupByDate(notifications: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const buckets: Record<string, Notification[]> = {};
  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    let label: string;
    if (isToday(d)) label = "Today";
    else if (isYesterday(d)) label = "Yesterday";
    else if (isThisWeek(d)) label = "This Week";
    else label = "Older";
    if (!buckets[label]) buckets[label] = [];
    buckets[label].push(n);
  });
  for (const label of ["Today", "Yesterday", "This Week", "Older"]) {
    if (buckets[label]?.length) groups.push({ label, items: buckets[label] });
  }
  return groups;
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const deleteNotif = useDeleteNotification();
  const clearAllRead = useClearAllRead();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id);
    const rawRoute = getNotificationRoute(n.type, n.metadata, n.wedding_id);
    const route = toVendorNotificationRoute(rawRoute);
    if (route) navigate(route);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.length - unreadCount;
  const visible = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;
  const grouped = groupByDate(visible);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="p-4 md:p-6 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display text-2xl font-bold">Notifications</h1>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
              </Button>
            )}
            {readCount > 0 && (
              <Button
                variant="ghost" size="sm"
                onClick={() => clearAllRead.mutate()}
                title="Delete all read notifications"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="space-y-4 mt-4">
            {visible.length === 0 ? (
              filter === "unread" ? (
                <EmptyState icon={Inbox} title="All caught up!" description="You have no unread notifications." />
              ) : (
                <EmptyState icon={Bell} title="No notifications yet" description="You'll be notified about assignments, meetings, and messages." />
              )
            ) : (
              grouped.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{group.label}</h3>
                  {group.items.map((n) => {
                    const Icon = getTypeIcon(n.type);
                    const tone = TYPE_TONE[n.type] ?? "bg-muted text-muted-foreground";
                    return (
                      <Card
                        key={n.id}
                        className={cn(
                          "transition-all cursor-pointer hover:shadow-sm active:scale-[0.99]",
                          !n.is_read && "border-primary/40 bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("flex h-9 w-9 items-center justify-center rounded-full shrink-0", tone)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn("text-sm leading-tight", !n.is_read ? "font-semibold" : "font-medium")}>
                                  {n.title}
                                </p>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 whitespace-nowrap">
                                      {formatDistanceToNowStrict(new Date(n.created_at), { addSuffix: true })}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {format(new Date(n.created_at), "PPpp")}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{n.content}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mr-1 -mt-1">
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                {!n.is_read ? (
                                  <DropdownMenuItem onClick={() => markRead.mutate(n.id)}>
                                    <MailOpen className="h-4 w-4 mr-2" /> Mark as read
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled>
                                    <Mail className="h-4 w-4 mr-2" /> Already read
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => deleteNotif.mutate(n.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
