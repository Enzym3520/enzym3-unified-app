import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Clock } from "lucide-react";
import { useState, useMemo } from "react";

interface TimelineItem {
  id: string;
  label: string;
  start_time: string;
  end_time: string | null;
  category: string;
  notes: string | null;
  sort_order: number;
}

const categoryColors: Record<string, string> = {
  ceremony: "bg-primary/10 text-primary border-primary/20",
  reception: "bg-accent/80 text-accent-foreground",
  music: "bg-destructive/10 text-destructive border-destructive/20",
  general: "bg-muted text-muted-foreground",
  other: "bg-secondary text-secondary-foreground",
};

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

interface EventDayTimelineProps {
  eventId: string;
  eventDate: string;
}

export function EventDayTimeline({ eventId, eventDate }: EventDayTimelineProps) {
  const [open, setOpen] = useState(true);

  const { data: items } = useQuery({
    queryKey: ["event-timeline", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_timeline_items")
        .select("*")
        .eq("event_id", eventId)
        .order("sort_order", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data as unknown as TimelineItem[];
    },
  });

  const isToday = useMemo(() => new Date().toISOString().split("T")[0] === eventDate, [eventDate]);
  const nowMinutes = useMemo(() => {
    if (!isToday) return -1;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, [isToday]);

  if (!items || items.length === 0) return null;

  let currentIdx = -1;
  let nextIdx = -1;
  if (isToday) {
    for (let i = 0; i < items.length; i++) {
      const start = timeToMinutes(items[i].start_time);
      const end = items[i].end_time ? timeToMinutes(items[i].end_time!) : (items[i + 1] ? timeToMinutes(items[i + 1].start_time) : start + 60);
      if (nowMinutes >= start && nowMinutes < end) currentIdx = i;
      if (nowMinutes < start && nextIdx === -1) nextIdx = i;
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Event Timeline
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="relative space-y-0">
              {items.map((item, idx) => {
                const isCurrent = idx === currentIdx;
                const isNext = idx === nextIdx;
                return (
                  <div key={item.id} className="flex gap-3 relative">
                    <div className="flex flex-col items-center w-12 flex-shrink-0">
                      <span className="text-[10px] text-muted-foreground font-mono leading-tight">{formatTime(item.start_time)}</span>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1 ${isCurrent ? "bg-destructive ring-2 ring-destructive/30" : "bg-border"}`} />
                      {idx < items.length - 1 && <div className="w-px flex-1 bg-border min-h-[24px]" />}
                    </div>
                    <div className={`flex-1 pb-4 ${isCurrent ? "opacity-100" : "opacity-70"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${isCurrent ? "text-foreground" : "text-foreground/80"}`}>{item.label}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${categoryColors[item.category] || categoryColors.general}`}>{item.category}</Badge>
                        {isCurrent && <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 animate-pulse">NOW</Badge>}
                        {isNext && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary text-primary">NEXT</Badge>}
                      </div>
                      {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
