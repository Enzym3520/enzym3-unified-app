import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClientReview {
  id: string;
  reviewer_name: string;
  reviewer_email: string;
  rating: number;
  review_text: string;
  event_name: string | null;
  event_type: string | null;
  event_date: string | null;
  would_recommend: boolean | null;
  approved: boolean | null;
  created_at: string | null;
  wedding_id: string | null;
}

export function useClientReviews() {
  const [pendingReviews, setPendingReviews] = useState<ClientReview[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<ClientReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setPendingReviews((data || []).filter(r => !r.approved));
      setApprovedReviews((data || []).filter(r => r.approved));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching reviews:', err);
      toast({ title: 'Failed to load reviews', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const approveReview = async (id: string) => {
    const { error } = await supabase
      .from('client_reviews')
      .update({ approved: true })
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to approve review', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Review approved — it is now public ✓' });
    await fetchReviews();
    return true;
  };

  const unapproveReview = async (id: string) => {
    const { error } = await supabase
      .from('client_reviews')
      .update({ approved: false })
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to un-approve review', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Review moved back to pending' });
    await fetchReviews();
    return true;
  };

  const rejectReview = async (id: string) => {
    const { error } = await supabase
      .from('client_reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Failed to reject review', variant: 'destructive' });
      return false;
    }
    toast({ title: 'Review rejected and removed' });
    await fetchReviews();
    return true;
  };

  return {
    pendingReviews,
    approvedReviews,
    isLoading,
    approveReview,
    unapproveReview,
    rejectReview,
    refetch: fetchReviews,
  };
}
