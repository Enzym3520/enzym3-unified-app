import { useState } from 'react';
import { Package, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UpgradeOrder, PaymentStatus } from '@/types/upgradeOrder';
import { UPGRADE_PACKAGES, PAYMENT_STATUS_LABELS } from '@/config/upgradePackages';
import { format } from 'date-fns';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpgradesTabProps {
  upgrades: UpgradeOrder[];
  loading: boolean;
}

export const UpgradesTab = ({ upgrades, loading }: UpgradesTabProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [upgradeToDelete, setUpgradeToDelete] = useState<string | null>(null);

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PaymentStatus }) => {
      const { data, error } = await supabase
        .from('upgrade_orders')
        .update({ payment_status: status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Upgrade order not found or was deleted.');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-upgrades'] });
      toast({
        title: 'Payment status updated',
        description: 'The upgrade order payment status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error updating payment status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteUpgradeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('upgrade_orders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-upgrades'] });
      toast({
        title: 'Upgrade deleted',
        description: 'The upgrade order has been removed successfully.',
      });
      setDeleteDialogOpen(false);
      setUpgradeToDelete(null);
    },
    onError: (error) => {
      toast({
        title: 'Error deleting upgrade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDeleteClick = (upgradeId: string) => {
    setUpgradeToDelete(upgradeId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (upgradeToDelete) {
      deleteUpgradeMutation.mutate(upgradeToDelete);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!upgrades || upgrades.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Upgrades Ordered</h3>
          <p className="text-muted-foreground text-center">
            This couple hasn't ordered any upgrade packages yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      {upgrades.map((upgrade) => {
        const packageInfo = UPGRADE_PACKAGES[upgrade.selected_package as keyof typeof UPGRADE_PACKAGES];
        
        return (
          <Card key={upgrade.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{upgrade.selected_package} Package</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upgrade Package Request
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getPaymentStatusColor(upgrade.payment_status)}>
                    {PAYMENT_STATUS_LABELS[upgrade.payment_status as keyof typeof PAYMENT_STATUS_LABELS]}
                  </Badge>
                  <Select
                    value={upgrade.payment_status}
                    onValueChange={(value) => 
                      updatePaymentStatusMutation.mutate({ 
                        id: upgrade.id, 
                        status: value as PaymentStatus 
                      })
                    }
                    disabled={updatePaymentStatusMutation.isPending}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteClick(upgrade.id)}
                    disabled={deleteUpgradeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Package Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-2xl font-bold">${packageInfo.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Package Price</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{format(new Date(upgrade.created_at), 'PPP')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Requested Date</p>
                </div>
              </div>

              {/* Features */}
              <div>
                <p className="text-sm font-medium mb-2">Included Features:</p>
                <ul className="space-y-1">
                  {packageInfo.features.map((feature, idx) => (
                    <li key={idx} className="text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Emerald Choice */}
              {upgrade.selected_package === 'Emerald' && upgrade.emerald_choice && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Selected Option:</p>
                  <p className="text-sm text-muted-foreground">{upgrade.emerald_choice}</p>
                </div>
              )}

              {/* Notes */}
              {upgrade.notes && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm font-medium mb-1">Customer Notes:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{upgrade.notes}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                <span>Requested {format(new Date(upgrade.created_at), 'PPp')}</span>
                {upgrade.updated_at !== upgrade.created_at && (
                  <span>Updated {format(new Date(upgrade.updated_at), 'PPp')}</span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Upgrade Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this upgrade order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
