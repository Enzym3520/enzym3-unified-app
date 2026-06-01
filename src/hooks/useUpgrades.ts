import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { useKeyboardShortcutsContext } from "@/contexts/KeyboardShortcutsContext";
import { toast } from "sonner";

export function useUpgrades() {
  const { event: wedding, loading: eventLoading, user } = useClientEvent<any>(
    'id, couple_name, event_date, event_type, contact_email, primary_contact_name'
  );
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, isInCart, setCartOpen } = useCart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [upgradeOrders, setUpgradeOrders] = useState<any[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [emeraldDialogOpen, setEmeraldDialogOpen] = useState(false);
  const [emeraldChoice, setEmeraldChoice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [payingWithCard, setPayingWithCard] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [colorNotes, setColorNotes] = useState('');
  const [monogramNumber, setMonogramNumber] = useState('');
  const { registerShortcuts, unregisterShortcuts } = useKeyboardShortcutsContext();

  const loading = eventLoading || ordersLoading;
  const eventType = wedding?.event_type || 'wedding';

  const handleColorToggle = (colorName: string) => {
    setSelectedColors(prev => {
      if (prev.includes(colorName)) return prev.filter(c => c !== colorName);
      if (prev.length >= 2) { toast.info('You can select up to 2 colors'); return prev; }
      return [...prev, colorName];
    });
  };

  // Load orders when wedding is available
  const loadOrders = useCallback(async () => {
    if (!wedding) return;
    try {
      const { data: upgradesData } = await supabase
        .from('upgrade_orders').select('*')
        .eq('wedding_id', wedding.id)
        .order('created_at', { ascending: false });
      setUpgradeOrders(upgradesData || []);
    } catch (error) {
      console.error('Error loading upgrades:', error);
      toast.error('Failed to load upgrades');
    } finally {
      setOrdersLoading(false);
    }
  }, [wedding]);

  useEffect(() => {
    if (eventLoading) return;
    if (wedding) loadOrders();
    else setOrdersLoading(false);
  }, [wedding, eventLoading, loadOrders]);

  // Payment success/cancel URL params with DB verification
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast.info('Payment received! Verifying your upgrade...');
      searchParams.delete('payment');
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });

      let attempts = 0;
      const maxAttempts = 10;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (!wedding?.id) { if (attempts >= maxAttempts) clearInterval(pollInterval); return; }
        const { data: latestOrder } = await supabase
          .from('upgrade_orders')
          .select('payment_status')
          .eq('wedding_id', wedding.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const latestStatus = latestOrder?.payment_status;
        if (latestStatus === 'paid') {
          clearInterval(pollInterval);
          toast.success('Your upgrade has been processed! 🎉');
          loadOrders();
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          toast.success('Payment confirmed! Your upgrade will appear shortly.');
          loadOrders();
        }
      }, 2000);

      return () => clearInterval(pollInterval);
    } else if (payment === 'cancelled') {
      toast.info('Payment was cancelled');
      searchParams.delete('payment');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, wedding?.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const shortcuts = [{
      key: 'Enter', ctrlKey: true, metaKey: true,
      description: 'Proceed to checkout', category: 'page' as const,
      action: () => { if (cart.length > 0 && !submitting) setCheckoutOpen(true); },
      disabled: cart.length === 0 || submitting,
    }];
    registerShortcuts(shortcuts);
    return () => unregisterShortcuts(shortcuts);
  }, [cart.length, submitting, registerShortcuts, unregisterShortcuts]);

  // Real-time listener
  useEffect(() => {
    if (!wedding?.id) return;
    const channel = supabase
      .channel('upgrade-orders-changes')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'upgrade_orders',
        filter: `wedding_id=eq.${wedding.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const newStatus = (payload.new as any).payment_status;
          const oldStatus = (payload.old as any)?.payment_status;
          if (newStatus !== oldStatus) {
            const msgs: Record<string, string> = {
              'paid': 'Your upgrade has been paid! ✨',
              'pending': 'Payment is now pending',
              'draft': 'Upgrade status updated to draft',
              'cancelled': 'Upgrade request was cancelled'
            };
            toast.success(msgs[newStatus] || `Payment status updated to: ${newStatus}`);
          }
        } else if (payload.eventType === 'INSERT') {
          toast.info('New upgrade request added');
        }
        loadOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [wedding?.id, loadOrders]);

  const openEmeraldDialog = () => { setEmeraldChoice(''); setEmeraldDialogOpen(true); };

  const handleEmeraldSelection = () => {
    if (!emeraldChoice) { toast.error('Please select your Emerald package choice'); return; }
    addToCart({ id: 'emerald-package', type: 'package', name: 'Emerald', price: 500, emeraldChoice });
    setEmeraldDialogOpen(false);
    setEmeraldChoice('');
  };

  const handleSubmitOrder = async () => {
    if (!wedding || cart.length === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('upgrade_orders').insert([{
        wedding_id: wedding.id, couple_name: wedding.couple_name,
        wedding_date: wedding.event_date, items: cart as any,
        total_amount: cartTotal, payment_status: 'draft',
        selected_package: cart.find(i => i.type === 'package')?.name || 'Custom',
        emerald_choice: cart.find(i => i.emeraldChoice)?.emeraldChoice || null,
        notes: [notes, monogramNumber ? `Monogram Design #: ${monogramNumber}` : '',
          selectedColors.length > 0 ? `Uplight Colors: ${selectedColors.join(', ')}` : '',
          colorNotes ? `Color Notes: ${colorNotes}` : ''].filter(Boolean).join('\n'),
      }]);
      if (error) throw error;
      toast.success('Upgrade request submitted successfully! 🎉');
      clearCart(); setNotes(''); setCheckoutOpen(false);
      await loadOrders();
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('Failed to submit upgrade request');
    } finally { setSubmitting(false); }
  };

  const handlePayWithCard = async () => {
    if (!wedding || cart.length === 0) return;
    setPayingWithCard(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-upgrade-payment', {
        body: { items: cart, weddingId: wedding.id, coupleName: wedding.couple_name },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else { throw new Error('No checkout URL returned'); }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to create payment. Please try again.');
    } finally { setPayingWithCard(false); }
  };

  const handleDeleteRequest = async () => {
    if (!orderToDelete || !deleteReason.trim()) { toast.error('Please provide a reason for deletion'); return; }
    setDeleting(true);
    try {
      const { error } = await supabase.from('upgrade_orders').update({
        payment_status: 'cancelled',
        notes: `[DELETION REQUESTED] ${deleteReason}\n\n${orderToDelete.notes || ''}`
      }).eq('id', orderToDelete.id);
      if (error) throw error;
      toast.success('Deletion request submitted successfully');
      setDeleteDialogOpen(false); setDeleteReason(''); setOrderToDelete(null);
      await loadOrders();
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast.error('Failed to submit deletion request');
    } finally { setDeleting(false); }
  };

  const openDeleteDialog = (order: any) => { setOrderToDelete(order); setDeleteReason(''); setDeleteDialogOpen(true); };

  return {
    loading, wedding, eventType, upgradeOrders,
    checkoutOpen, setCheckoutOpen,
    emeraldDialogOpen, setEmeraldDialogOpen, emeraldChoice, setEmeraldChoice,
    notes, setNotes, submitting, payingWithCard,
    deleteDialogOpen, setDeleteDialogOpen, orderToDelete, deleteReason, setDeleteReason, deleting,
    selectedColors, colorNotes, setColorNotes, monogramNumber, setMonogramNumber,
    handleColorToggle, openEmeraldDialog, handleEmeraldSelection,
    handleSubmitOrder, handlePayWithCard, handleDeleteRequest, openDeleteDialog,
    // Cart pass-through
    cart, addToCart, removeFromCart, clearCart, cartTotal, isInCart, setCartOpen,
  };
}
