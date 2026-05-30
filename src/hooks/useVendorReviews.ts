import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorReview {
  id: string;
  vendor_id: string;
  assignment_id: string;
  reviewer_id: string;
  rating: number;
  professionalism_rating: number | null;
  punctuality_rating: number | null;
  communication_rating: number | null;
  quality_rating: number | null;
  would_hire_again: boolean;
  review_text: string | null;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPerformance {
  average_rating: number;
  total_reviews: number;
  events_completed: number;
  would_hire_again_percentage: number;
  category_ratings: {
    professionalism: number;
    punctuality: number;
    communication: number;
    quality: number;
  };
}

export interface CreateReviewData {
  vendor_id: string;
  assignment_id: string;
  rating: number;
  professionalism_rating?: number;
  punctuality_rating?: number;
  communication_rating?: number;
  quality_rating?: number;
  would_hire_again: boolean;
  review_text?: string;
}

// Fetch all reviews for a vendor with event context
export const useVendorReviews = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-reviews', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select(`
          *,
          assignment:event_dj_assignments(
            event:event_notification_history(
              couple_name,
              event_date,
              event_type,
              venue
            )
          ),
          reviewer:profiles!vendor_reviews_reviewer_id_fkey(
            first_name,
            last_name
          )
        `)
        .eq('vendor_id', vendorId)
        .order('reviewed_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data;
    },
  });
};

// Calculate vendor performance metrics
export const useVendorPerformance = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-performance', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      // Get vendor profile with computed metrics
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('average_rating, total_reviews, events_completed')
        .eq('id', vendorId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Get detailed review data for category ratings
      const { data: reviews, error: reviewsError } = await supabase
        .from('vendor_reviews')
        .select('*')
        .eq('vendor_id', vendorId)
        .limit(500);

      if (reviewsError) throw reviewsError;

      // Calculate category averages
      const categoryRatings = {
        professionalism: 0,
        punctuality: 0,
        communication: 0,
        quality: 0,
      };

      if (reviews && reviews.length > 0) {
        const counts = { professionalism: 0, punctuality: 0, communication: 0, quality: 0 };
        
        reviews.forEach(review => {
          if (review.professionalism_rating) {
            categoryRatings.professionalism += review.professionalism_rating;
            counts.professionalism++;
          }
          if (review.punctuality_rating) {
            categoryRatings.punctuality += review.punctuality_rating;
            counts.punctuality++;
          }
          if (review.communication_rating) {
            categoryRatings.communication += review.communication_rating;
            counts.communication++;
          }
          if (review.quality_rating) {
            categoryRatings.quality += review.quality_rating;
            counts.quality++;
          }
        });

        categoryRatings.professionalism = counts.professionalism > 0 
          ? categoryRatings.professionalism / counts.professionalism : 0;
        categoryRatings.punctuality = counts.punctuality > 0 
          ? categoryRatings.punctuality / counts.punctuality : 0;
        categoryRatings.communication = counts.communication > 0 
          ? categoryRatings.communication / counts.communication : 0;
        categoryRatings.quality = counts.quality > 0 
          ? categoryRatings.quality / counts.quality : 0;
      }

      // Calculate would_hire_again percentage
      const wouldHireAgainCount = reviews?.filter(r => r.would_hire_again).length || 0;
      const wouldHireAgainPercentage = reviews && reviews.length > 0
        ? (wouldHireAgainCount / reviews.length) * 100
        : 0;

      return {
        average_rating: profile?.average_rating || 0,
        total_reviews: profile?.total_reviews || 0,
        events_completed: profile?.events_completed || 0,
        would_hire_again_percentage: wouldHireAgainPercentage,
        category_ratings: categoryRatings,
      } as VendorPerformance;
    },
  });
};

// Submit a new review
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('vendor_reviews')
        .insert({
          ...reviewData,
          reviewer_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews', data.vendor_id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-performance', data.vendor_id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      toast.success('Review submitted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to submit review: ' + error.message);
    },
  });
};

// Update an existing review
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reviewId, updates }: { reviewId: string; updates: Partial<CreateReviewData> }) => {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .update(updates)
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews', data.vendor_id] });
      queryClient.invalidateQueries({ queryKey: ['vendor-performance', data.vendor_id] });
      toast.success('Review updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update review: ' + error.message);
    },
  });
};

// Get top performing vendors
export const useTopPerformers = (limit: number = 10) => {
  return useQuery({
    queryKey: ['top-performers', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, vendor_type, average_rating, total_reviews, events_completed')
        .not('average_rating', 'is', null)
        .gte('total_reviews', 3) // At least 3 reviews
        .eq('is_active', true)
        .order('average_rating', { ascending: false })
        .order('total_reviews', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
};

// Check if assignment has been reviewed
export const useAssignmentReview = (assignmentId: string | undefined) => {
  return useQuery({
    queryKey: ['assignment-review', assignmentId],
    enabled: !!assignmentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_reviews')
        .select('*')
        .eq('assignment_id', assignmentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};
