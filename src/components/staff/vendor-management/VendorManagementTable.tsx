import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { MoreHorizontal, Eye, Copy, Send, Ban, Trash2, Edit, ShieldCheck, ShieldAlert, ShieldX, Star, Power, PowerOff, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { UnifiedVendor } from '@/hooks/useVendorManagement';
import { format } from 'date-fns';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { toast } from 'sonner';
import { getVendorRegistrationLink, getVendorRegistrationFallbackLink } from '@/config/urls';
import { useDeactivateInvite, useDeleteInvite, useResendInviteEmail } from '@/hooks/useVendorInvites';
import { useDeactivateVendor, useActivateVendor, useToggleDoNotUse } from '@/hooks/useVendorActions';
import { VendorDetailsModal } from './VendorDetailsModal';
import { InviteDetailsModal } from './InviteDetailsModal';
import { EditVendorModal } from './EditVendorModal';
import { DeleteVendorDialog } from './DeleteVendorDialog';
import { VendorBulkActions } from './VendorBulkActions';
import { useVendorDocuments, getComplianceStatus, getMissingDocuments, getExpiredDocuments, DOCUMENT_TYPES } from '@/hooks/useVendorDocuments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VendorManagementTableProps {
  vendors: UnifiedVendor[];
  isLoading: boolean;
  statusFilter?: string;
}

export function VendorManagementTable({ vendors, isLoading, statusFilter: propStatusFilter }: VendorManagementTableProps) {
  const [search, setSearch] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState<UnifiedVendor | null>(null);
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [showInviteDetails, setShowInviteDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInviteTarget, setDeleteInviteTarget] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<'name' | 'vendorType' | 'status' | 'registeredAt'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const deactivateInvite = useDeactivateInvite();
  const deleteInvite = useDeleteInvite();
  const resendEmail = useResendInviteEmail();
  const deactivateVendor = useDeactivateVendor();
  const activateVendor = useActivateVendor();
  const toggleDoNotUse = useToggleDoNotUse();

  const statusFilter = propStatusFilter || localStatusFilter;

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        search === '' ||
        vendor.name.toLowerCase().includes(search.toLowerCase()) ||
        vendor.email.toLowerCase().includes(search.toLowerCase()) ||
        vendor.company?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
      const matchesType = typeFilter === 'all' || vendor.vendorType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [vendors, search, statusFilter, typeFilter]);

  const vendorTypes = useMemo(() => {
    const types = new Set(vendors.map((v) => v.vendorType));
    return Array.from(types).sort();
  }, [vendors]);

  const sortedVendors = useMemo(() => {
    return [...filteredVendors].sort((a, b) => {
      let aVal: any = (a as any)[sortField] ?? '';
      let bVal: any = (b as any)[sortField] ?? '';
      if (sortField === 'registeredAt') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (sortDir === 'asc') return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    });
  }, [filteredVendors, sortField, sortDir]);

  const handleVendorSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const VendorSortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const selectedVendors = useMemo(() => {
    return filteredVendors.filter(v => selectedIds.has(v.id));
  }, [filteredVendors, selectedIds]);

  const getStatusBadge = (status: string) => {
    const badges = {
      active: <Badge className="bg-green-500">Active</Badge>,
      pending: <Badge className="bg-yellow-500">Pending</Badge>,
      expired: <Badge className="bg-red-500">Expired</Badge>,
      inactive: <Badge variant="secondary">Inactive</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  const ComplianceIndicator = ({ vendorId }: { vendorId?: string }) => {
    const { data: documents } = useVendorDocuments(vendorId);
    
    if (!vendorId || !documents) return null;

    const status = getComplianceStatus(documents);
    const missing = getMissingDocuments(documents);
    const expiredDocs = getExpiredDocuments(documents);

    const buildTooltipLines = (): string[] => {
      const lines: string[] = [];
      if (missing.length > 0) {
        lines.push(`Missing: ${missing.map(d => d.label).join(', ')}`);
      }
      expiredDocs.forEach(({ doc, status: s }) => {
        const label = DOCUMENT_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type;
        if (s === 'expired') {
          lines.push(`Expired: ${label}${doc.expires_at ? ` (${format(new Date(doc.expires_at), 'MMM d, yyyy')})` : ''}`);
        } else {
          lines.push(`Expiring soon: ${label}${doc.expires_at ? ` (${format(new Date(doc.expires_at), 'MMM d, yyyy')})` : ''}`);
        }
      });
      return lines;
    };

    if (status === 'compliant') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ShieldCheck className="h-4 w-4 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>All required documents valid</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    const lines = buildTooltipLines();
    const icon = status === 'attention' 
      ? <ShieldAlert className="h-4 w-4 text-yellow-500" />
      : <ShieldX className="h-4 w-4 text-red-500" />;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{icon}</TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              {lines.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleCopyLink = (inviteCode: string) => {
    const link = getVendorRegistrationLink(inviteCode);
    navigator.clipboard.writeText(link);
    toast.success('Registration link copied!');
  };

  const handleCopyFallbackLink = (inviteCode: string) => {
    const link = getVendorRegistrationFallbackLink(inviteCode);
    navigator.clipboard.writeText(link);
    toast.success('Fallback link copied!');
  };

  const handleViewDetails = (vendor: UnifiedVendor) => {
    setSelectedVendor(vendor);
    if (vendor.status === 'active' || vendor.status === 'inactive') {
      setShowVendorDetails(true);
    } else {
      setShowInviteDetails(true);
    }
  };

  const handleEditProfile = (vendor: UnifiedVendor) => {
    setSelectedVendor(vendor);
    setShowEditModal(true);
  };

  const handleDeleteVendor = (vendor: UnifiedVendor) => {
    setSelectedVendor(vendor);
    setShowDeleteDialog(true);
  };

  const handleDeactivate = (inviteId: string) => {
    deactivateInvite.mutate(inviteId);
  };

  const handleDeleteInvite = (inviteId: string) => {
    deleteInvite.mutate(inviteId);
  };

  const handleResendEmail = (vendor: UnifiedVendor) => {
    if (!vendor.inviteCode) return;
    resendEmail.mutate({
      email: vendor.email,
      name: vendor.name,
      company: vendor.company,
      vendorType: vendor.vendorType,
      inviteCode: vendor.inviteCode,
      expiresAt: vendor.expiresAt,
    });
  };

  const handleToggleActive = (vendor: UnifiedVendor) => {
    if (!vendor.userId) return;
    if (vendor.status === 'active') {
      deactivateVendor.mutate(vendor.userId);
    } else {
      activateVendor.mutate(vendor.userId);
    }
  };

  const handleToggleDoNotUse = (vendor: UnifiedVendor) => {
    if (!vendor.userId) return;
    // Check current vendor_status from the fullProfile or infer from status
    const isCurrentlyDoNotUse = vendor.status === 'inactive'; // Simplified check
    toggleDoNotUse.mutate({ 
      vendorId: vendor.userId, 
      markAsDoNotUse: !isCurrentlyDoNotUse 
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredVendors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredVendors.map(v => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const isMobile = useIsMobile();

  if (isLoading) {
    return <div className="text-center py-8">Loading vendors...</div>;
  }

  return (
    <div className="space-y-4">
      <VendorBulkActions 
        selectedVendors={selectedVendors}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:w-96"
        />
        {!propStatusFilter && (
          <Select value={localStatusFilter} onValueChange={setLocalStatusFilter}>
            <SelectTrigger className="md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="md:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {vendorTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatVendorType(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {sortedVendors.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No vendors found</p>
          ) : (
            sortedVendors.map((vendor) => (
              <Card key={vendor.id} className="p-4 cursor-pointer hover:bg-muted/50 active:bg-muted/50 transition-colors" onClick={() => handleViewDetails(vendor)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Checkbox
                      checked={selectedIds.has(vendor.id)}
                      onCheckedChange={() => toggleSelect(vendor.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>{vendor.avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate">{vendor.name}</p>
                        <ComplianceIndicator vendorId={vendor.userId} />
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{vendor.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">{formatVendorType(vendor.vendorType)}</Badge>
                        {getStatusBadge(vendor.status)}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewDetails(vendor)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {vendor.status === 'pending' && vendor.inviteCode && (
                        <>
                          <DropdownMenuItem onClick={() => handleResendEmail(vendor)}>
                            <Send className="mr-2 h-4 w-4" />
                            Resend Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyLink(vendor.inviteCode!)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyFallbackLink(vendor.inviteCode!)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Fallback Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeactivate(vendor.inviteId!)}>
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Invite
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteInviteTarget(vendor.inviteId!)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </>
                      )}
                      {vendor.status === 'expired' && vendor.inviteId && (
                        <DropdownMenuItem onClick={() => handleDeleteInvite(vendor.inviteId!)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                      {(vendor.status === 'active' || vendor.status === 'inactive') && vendor.userId && (
                        <>
                          <DropdownMenuItem onClick={() => handleEditProfile(vendor)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActive(vendor)}>
                            {vendor.status === 'active' ? <><PowerOff className="mr-2 h-4 w-4" />Deactivate</> : <><Power className="mr-2 h-4 w-4" />Activate</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleDoNotUse(vendor)}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Mark as Do Not Use
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDeleteVendor(vendor)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Vendor
                          </DropdownMenuItem>
                        </>
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
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.size === filteredVendors.length && filteredVendors.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>
                <button onClick={() => handleVendorSort('name')} className="flex items-center hover:text-foreground transition-colors">
                  Vendor<VendorSortIcon field="name" />
                </button>
              </TableHead>
              <TableHead>
                <button onClick={() => handleVendorSort('vendorType')} className="flex items-center hover:text-foreground transition-colors">
                  Type<VendorSortIcon field="vendorType" />
                </button>
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>
                <button onClick={() => handleVendorSort('status')} className="flex items-center hover:text-foreground transition-colors">
                  Status<VendorSortIcon field="status" />
                </button>
              </TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>
                <button onClick={() => handleVendorSort('registeredAt')} className="flex items-center hover:text-foreground transition-colors">
                  Date<VendorSortIcon field="registeredAt" />
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
          {sortedVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No vendors found
                </TableCell>
              </TableRow>
            ) : (
              sortedVendors.map((vendor) => (
                <TableRow key={vendor.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewDetails(vendor)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.has(vendor.id)}
                      onCheckedChange={() => toggleSelect(vendor.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{vendor.avatarInitials}</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vendor.name}</span>
                        <ComplianceIndicator vendorId={vendor.userId} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatVendorType(vendor.vendorType)}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.company || '-'}</TableCell>
                  <TableCell>{getStatusBadge(vendor.status)}</TableCell>
                  <TableCell>
                    {(vendor.status === 'active' || vendor.status === 'inactive') && vendor.averageRating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{vendor.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({vendor.totalReviews || 0})</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No reviews</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {vendor.registeredAt
                      ? format(new Date(vendor.registeredAt), 'MMM d, yyyy')
                      : vendor.invitedAt
                      ? `Invited ${format(new Date(vendor.invitedAt), 'MMM d')}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(vendor)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>

                        {vendor.status === 'pending' && vendor.inviteCode && (
                          <>
                            <DropdownMenuItem onClick={() => handleResendEmail(vendor)}>
                              <Send className="mr-2 h-4 w-4" />
                              Resend Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyLink(vendor.inviteCode!)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyFallbackLink(vendor.inviteCode!)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Fallback Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeactivate(vendor.inviteId!)}>
                              <Ban className="mr-2 h-4 w-4" />
                              Cancel Invite
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteInviteTarget(vendor.inviteId!)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Permanently
                            </DropdownMenuItem>
                          </>
                        )}

                        {vendor.status === 'expired' && vendor.inviteId && (
                          <DropdownMenuItem onClick={() => handleDeleteInvite(vendor.inviteId!)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}

                        {(vendor.status === 'active' || vendor.status === 'inactive') && vendor.userId && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditProfile(vendor)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleActive(vendor)}>
                              {vendor.status === 'active' ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleDoNotUse(vendor)}>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Mark as Do Not Use
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteVendor(vendor)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Vendor
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      )}

      {selectedVendor && (
        <>
          <VendorDetailsModal
            vendor={selectedVendor}
            open={showVendorDetails}
            onOpenChange={setShowVendorDetails}
          />
          <InviteDetailsModal
            vendor={selectedVendor}
            open={showInviteDetails}
            onOpenChange={setShowInviteDetails}
          />
          <EditVendorModal
            vendor={selectedVendor}
            open={showEditModal}
            onOpenChange={setShowEditModal}
          />
          <DeleteVendorDialog
            vendor={selectedVendor}
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
          />
        </>
      )}

      <AlertDialog open={!!deleteInviteTarget} onOpenChange={(open) => !open && setDeleteInviteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor Invite?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this invite from the system. 
              The invite code will no longer work and this action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteInviteTarget) {
                  handleDeleteInvite(deleteInviteTarget);
                  setDeleteInviteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
