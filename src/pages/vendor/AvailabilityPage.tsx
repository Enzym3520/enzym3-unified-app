import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, CalendarOff, ShieldAlert, Calendar } from "lucide-react";
import { format, parseISO, isBefore, startOfToday } from "date-fns";
import { useBlackoutDates, useAvailabilityBlocks, useAddBlackout, useRemoveBlackout, useAddBlock, useRemoveBlock } from "@/hooks/use-availability";

export default function AvailabilityPage() {
  const { data: blackouts = [], isLoading: loadingBlackouts } = useBlackoutDates();
  const { data: blocks = [], isLoading: loadingBlocks } = useAvailabilityBlocks();
  const addBlackout = useAddBlackout();
  const removeBlackout = useRemoveBlackout();
  const addBlock = useAddBlock();
  const removeBlock = useRemoveBlock();

  const [newBlackoutDate, setNewBlackoutDate] = useState("");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockForm, setBlockForm] = useState({ start_date: "", end_date: "", reason: "unavailable", notes: "", is_flexible: false });

  const loading = loadingBlackouts || loadingBlocks;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-72 mt-2" /></div>
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const today = startOfToday();
  const futureBlackouts = blackouts.filter((b) => !isBefore(parseISO(b.blackout_date), today));
  const pastBlackouts = blackouts.filter((b) => isBefore(parseISO(b.blackout_date), today));

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Availability</h1>
        <p className="text-muted-foreground mt-1">Manage your blackout dates and unavailable periods.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarOff className="h-5 w-5" /> Blackout Dates</CardTitle>
          <CardDescription>Single dates you're completely unavailable.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input type="date" value={newBlackoutDate} onChange={(e) => setNewBlackoutDate(e.target.value)} className="w-auto" />
            <Button onClick={() => { addBlackout.mutate(newBlackoutDate, { onSuccess: () => setNewBlackoutDate("") }); }} disabled={addBlackout.isPending || !newBlackoutDate} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {futureBlackouts.length === 0 && <p className="text-sm text-muted-foreground">No upcoming blackout dates.</p>}
          <div className="flex flex-wrap gap-2">
            {futureBlackouts.map((b) => (
              <Badge key={b.id} variant="secondary" className="gap-1.5 py-1.5 px-3">
                {format(parseISO(b.blackout_date), "MMM d, yyyy")}
                <button onClick={() => removeBlackout.mutate(b.id)} className="ml-1 hover:text-destructive" aria-label="Remove blackout">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          {pastBlackouts.length > 0 && (
            <details className="text-sm">
              <summary className="text-muted-foreground cursor-pointer">Past blackout dates ({pastBlackouts.length})</summary>
              <div className="flex flex-wrap gap-2 mt-2">
                {pastBlackouts.map((b) => (
                  <Badge key={b.id} variant="outline" className="opacity-50">{format(parseISO(b.blackout_date), "MMM d, yyyy")}</Badge>
                ))}
              </div>
            </details>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Unavailable Periods</CardTitle>
            <CardDescription>Extended periods of unavailability (vacations, etc).</CardDescription>
          </div>
          <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Period</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Unavailable Period</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({ ...blockForm, start_date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={blockForm.end_date} onChange={(e) => setBlockForm({ ...blockForm, end_date: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label>Reason</Label><Input value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} placeholder="e.g. Vacation, Personal" /></div>
                <div className="space-y-2"><Label>Notes (optional)</Label><Textarea value={blockForm.notes} onChange={(e) => setBlockForm({ ...blockForm, notes: e.target.value })} /></div>
                <div className="flex items-center gap-2"><Switch checked={blockForm.is_flexible} onCheckedChange={(v) => setBlockForm({ ...blockForm, is_flexible: v })} /><Label>Flexible (could be available if needed)</Label></div>
                <Button onClick={() => { addBlock.mutate(blockForm, { onSuccess: () => { setBlockDialogOpen(false); setBlockForm({ start_date: "", end_date: "", reason: "unavailable", notes: "", is_flexible: false }); } }); }} disabled={addBlock.isPending || !blockForm.start_date || !blockForm.end_date} className="w-full">
                  {addBlock.isPending ? "Saving..." : "Save Period"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 && <p className="text-sm text-muted-foreground">No unavailable periods set.</p>}
          <div className="space-y-3">
            {blocks.map((block) => (
              <div key={block.id} className="flex items-start justify-between rounded-lg border p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{format(parseISO(block.start_date), "MMM d")} — {format(parseISO(block.end_date), "MMM d, yyyy")}</span>
                    {block.is_flexible && <Badge variant="outline" className="text-xs">Flexible</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{block.reason}</p>
                  {block.notes && <p className="text-xs text-muted-foreground mt-0.5">{block.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeBlock.mutate(block.id)} aria-label="Remove block">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
