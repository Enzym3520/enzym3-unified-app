import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnifiedVendor } from '@/hooks/useVendorManagement';
import { useResendInviteEmail } from '@/hooks/useVendorInvites';
import { format } from 'date-fns';
import { Copy, Send, Calendar, Mail, Briefcase, Code } from 'lucide-react';
import { toast } from 'sonner';
import { formatVendorType } from '@/utils/vendorTypeFormatter';
import { getVendorRegistrationLink, getVendorRegistrationFallbackLink } from '@/config/urls';

interface InviteDetailsModalProps {
  vendor: UnifiedVendor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDetailsModal({ vendor, open, onOpenChange }: InviteDetailsModalProps) {
  const registrationLink = getVendorRegistrationLink(vendor.inviteCode || '');
  const fallbackLink = getVendorRegistrationFallbackLink(vendor.inviteCode || '');
  const resendEmail = useResendInviteEmail();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registrationLink);
    toast.success('Registration link copied to clipboard!');
  };

  const handleCopyCode = () => {
    if (vendor.inviteCode) {
      navigator.clipboard.writeText(vendor.inviteCode);
      toast.success('Invite code copied to clipboard!');
    }
  };

  const handleResendEmail = () => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Details</DialogTitle>
          <DialogDescription>
            Information about this vendor invitation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{vendor.name}</h3>
              <p className="text-muted-foreground">{formatVendorType(vendor.vendorType)}</p>
            </div>
            <Badge className={vendor.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'}>
              {vendor.status}
            </Badge>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{vendor.email}</p>
              </div>
            </div>

            {vendor.company && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Company</p>
                  <p className="font-medium">{vendor.company}</p>
                </div>
              </div>
            )}

            {vendor.inviteCode && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Code className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Invite Code</p>
                  <p className="font-mono font-medium">{vendor.inviteCode}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}

            {vendor.invitedAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Invited On</p>
                  <p className="font-medium">
                    {format(new Date(vendor.invitedAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}

            {vendor.expiresAt && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Expires On</p>
                  <p className="font-medium">
                    {format(new Date(vendor.expiresAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {vendor.status === 'pending' && (
            <>
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleResendEmail} 
                  disabled={resendEmail.isPending}
                  className="flex-1"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Resend Invitation Email
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Primary Registration Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={registrationLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50"
                    />
                    <Button variant="outline" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Fallback Link <span className="text-xs">(if primary doesn't work)</span></p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fallbackLink}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted/50"
                    />
                    <Button variant="outline" onClick={() => {
                      navigator.clipboard.writeText(fallbackLink);
                      toast.success('Fallback link copied!');
                    }}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
