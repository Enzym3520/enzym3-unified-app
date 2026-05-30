import { useState } from 'react';
import { VendorInvite } from '@/types/vendorInvite';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Ban, Trash2, Search, ExternalLink, Send, Pencil, MoreHorizontal } from 'lucide-react';
import { useDeactivateInvite, useDeleteInvite, useResendInviteEmail } from '@/hooks/useVendorInvites';
import { EditInviteModal } from './EditInviteModal';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getVendorRegistrationLink, getVendorRegistrationFallbackLink } from '@/config/urls';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface InviteCodeTableProps {
  invites: VendorInvite[];
  isLoading: boolean;
}

export function InviteCodeTable({ invites, isLoading }: InviteCodeTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorTypeFilter, setVendorTypeFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editInvite, setEditInvite] = useState<VendorInvite | null>(null);
  const isMobile = useIsMobile();

  const deactivateMutation = useDeactivateInvite();
  const deleteMutation = useDeleteInvite();
  const resendMutation = useResendInviteEmail();

  const copyLink = (code: string) => {
    const link = getVendorRegistrationLink(code);
    navigator.clipboard.writeText(link);
    toast.success('Registration link copied!');
  };

  const copyFallbackLink = (code: string) => {
    const link = getVendorRegistrationFallbackLink(code);
    navigator.clipboard.writeText(link);
    toast.success('Fallback registration link copied!');
  };

  const openLink = (code: string) => {
    const link = getVendorRegistrationLink(code);
    window.open(link, '_blank');
  };

  const handleResend = (invite: VendorInvite) => {
    resendMutation.mutate({
      email: invite.invited_email || invite.email,
      name: invite.name || `${invite.invited_first_name || ''} ${invite.invited_last_name || ''}`.trim(),
      company: invite.invited_company,
      vendorType: invite.vendor_type || '',
      inviteCode: invite.code,
      expiresAt: invite.expires_at,
    });
  };

  const isResendable = (invite: VendorInvite) =>
    invite.active && !invite.used_at && new Date(invite.expires_at) >= new Date();

  const getStatusBadge = (invite: VendorInvite) => {
    if (invite.used_at) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Used</Badge>;
    }
    if (new Date(invite.expires_at) < new Date()) {
      return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Expired</Badge>;
    }
    if (invite.active) {
      return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-500/20">Inactive</Badge>;
  };

  const filteredInvites = invites.filter((invite) => {
    const matchesSearch =
      (invite.invited_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invite.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invite.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && invite.active && !invite.used_at && new Date(invite.expires_at) >= new Date()) ||
      (statusFilter === 'used' && invite.used_at) ||
      (statusFilter === 'expired' && new Date(invite.expires_at) < new Date()) ||
      (statusFilter === 'inactive' && !invite.active);

    const matchesVendorType =
      vendorTypeFilter === 'all' || invite.vendor_type === vendorTypeFilter;

    return matchesSearch && matchesStatus && matchesVendorType;
  });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading invites...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="used">Used</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vendorTypeFilter} onValueChange={setVendorTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Vendor Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="dj">DJ</SelectItem>
            <SelectItem value="floral">Floral</SelectItem>
            <SelectItem value="catering">Catering</SelectItem>
            <SelectItem value="photography">Photography</SelectItem>
            <SelectItem value="videography">Videography</SelectItem>
            <SelectItem value="venue">Venue</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="bartending">Bartending</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {filteredInvites.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No invites found</p>
          ) : (
            filteredInvites.map((invite) => (
              <Card key={invite.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{invite.invited_email}</p>
                    <p className="text-sm text-muted-foreground truncate">{invite.name || invite.invited_company || '—'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="secondary" className="text-xs">{invite.vendor_type?.toUpperCase() || 'N/A'}</Badge>
                      {getStatusBadge(invite)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isResendable(invite) && (
                        <>
                          <DropdownMenuItem onClick={() => handleResend(invite)}>
                            <Send className="mr-2 h-4 w-4" />Resend Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditInvite(invite)}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => copyLink(invite.code)}>
                        <Copy className="mr-2 h-4 w-4" />Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyFallbackLink(invite.code)}>
                        <Copy className="mr-2 h-4 w-4" />Copy Fallback Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openLink(invite.code)}>
                        <ExternalLink className="mr-2 h-4 w-4" />Open Link
                      </DropdownMenuItem>
                      {invite.active && !invite.used_at && (
                        <DropdownMenuItem onClick={() => deactivateMutation.mutate(invite.id)}>
                          <Ban className="mr-2 h-4 w-4" />Deactivate
                        </DropdownMenuItem>
                      )}
                      {!invite.used_at && (
                        <DropdownMenuItem onClick={() => setDeleteTarget(invite.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No invites found
                </TableCell>
              </TableRow>
            ) : (
              filteredInvites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-mono text-xs">{invite.code}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {invite.vendor_type?.toUpperCase() || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>{invite.invited_email}</TableCell>
                  <TableCell>{invite.name || '-'}</TableCell>
                  <TableCell>{invite.invited_company || '-'}</TableCell>
                  <TableCell>{getStatusBadge(invite)}</TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(invite.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(invite.expires_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {isResendable(invite) && (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => handleResend(invite)} title="Resend invitation email" disabled={resendMutation.isPending}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditInvite(invite)} title="Edit invite details">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => copyLink(invite.code)} title="Copy registration link">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyFallbackLink(invite.code)} title="Copy fallback link">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openLink(invite.code)} title="Open registration page">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      {invite.active && !invite.used_at && (
                        <Button size="sm" variant="ghost" onClick={() => deactivateMutation.mutate(invite.id)} title="Deactivate" disabled={deactivateMutation.isPending}>
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}
                      {!invite.used_at && (
                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(invite.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invite Code?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget);
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditInviteModal
        invite={editInvite}
        open={!!editInvite}
        onOpenChange={(open) => { if (!open) setEditInvite(null); }}
      />
    </div>
  );
}
