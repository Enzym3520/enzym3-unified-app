import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Bug, Lightbulb, MessageCircle, CheckCircle, Eye, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface FeedbackRow {
  id: string;
  user_id: string | null;
  type: string;
  message: string;
  page_url: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const typeIcons: Record<string, typeof Bug> = { bug: Bug, feature: Lightbulb, general: MessageCircle };
const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-200',
  reviewed: 'bg-amber-500/10 text-amber-600 border-amber-200',
  resolved: 'bg-green-500/10 text-green-600 border-green-200',
};

export function FeedbackDashboard() {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<FeedbackRow | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['app-feedback'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('app_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as FeedbackRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) update.admin_notes = notes;
      const { error } = await (supabase as any).from('app_feedback').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-feedback'] });
      toast({ title: 'Feedback updated' });
      setSelected(null);
    },
  });

  const filtered = feedback.filter(f => {
    if (filterType !== 'all' && f.type !== filterType) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const counts = { new: 0, reviewed: 0, resolved: 0 };
  feedback.forEach(f => { if (f.status in counts) counts[f.status as keyof typeof counts]++; });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>User Feedback</CardTitle>
            <CardDescription>Review feedback from vendors and coordinators</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge className={statusColors.new}>{counts.new} new</Badge>
            <Badge className={statusColors.reviewed}>{counts.reviewed} reviewed</Badge>
            <Badge className={statusColors.resolved}>{counts.resolved} resolved</Badge>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="feature">Feature</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No feedback yet</p>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            {filtered.map(item => {
              const Icon = typeIcons[item.type] || MessageCircle;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border cursor-pointer active:bg-muted/50"
                  onClick={() => { setSelected(item); setAdminNotes(item.admin_notes || ''); }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="capitalize text-sm font-medium">{item.type}</span>
                        <Badge className={`${statusColors[item.status] || ''} text-xs ml-auto`}>{item.status}</Badge>
                      </div>
                      <p className="text-sm line-clamp-2">{item.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(item.created_at), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => {
                  const Icon = typeIcons[item.type] || MessageCircle;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="capitalize text-sm">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">{item.message}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.page_url || '—'}</TableCell>
                      <TableCell><Badge className={statusColors[item.status] || ''}>{item.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(item.created_at), 'MMM d, h:mm a')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => { setSelected(item); setAdminNotes(item.admin_notes || ''); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Detail dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Feedback Detail</DialogTitle>
              <DialogDescription>Review and update status</DialogDescription>
            </DialogHeader>
            {selected && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[selected.status]}>{selected.status}</Badge>
                  <span className="capitalize text-sm font-medium">{selected.type}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{selected.page_url}</span>
                </div>
                <p className="text-sm border-l-2 border-primary/30 pl-3">{selected.message}</p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Notes</label>
                  <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Add internal notes..." />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: selected.id, status: 'reviewed', notes: adminNotes })} disabled={updateMutation.isPending}>
                    <Eye className="h-4 w-4 mr-1" /> Mark Reviewed
                  </Button>
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: selected.id, status: 'resolved', notes: adminNotes })} disabled={updateMutation.isPending}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
