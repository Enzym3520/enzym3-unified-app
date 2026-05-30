import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorPage {
  id: string;
  vendor_id: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  highlight_services: boolean;
  highlight_reviews: boolean;
  show_pricing: boolean;
  theme_color: string;
  custom_sections: any[];
  gallery_photos: string[];
  status: string;
  admin_notes: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useVendorPage(vendorId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: page, isLoading } = useQuery({
    queryKey: ['vendor-page', vendorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_pages' as any)
        .select('*')
        .eq('vendor_id', vendorId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as VendorPage | null;
    },
    enabled: !!vendorId,
  });

  const upsertPage = useMutation({
    mutationFn: async (updates: Partial<VendorPage>) => {
      if (page?.id) {
        const { error } = await supabase
          .from('vendor_pages' as any)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', page.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vendor_pages' as any)
          .insert({ vendor_id: vendorId!, ...updates });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-page', vendorId] });
      toast.success('Page saved');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to save'),
  });

  const submitForApproval = useMutation({
    mutationFn: async () => {
      if (!page?.id) throw new Error('Save your page first');
      const { error } = await supabase
        .from('vendor_pages' as any)
        .update({ status: 'pending_approval', submitted_at: new Date().toISOString() })
        .eq('id', page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-page', vendorId] });
      toast.success('Submitted for approval!');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to submit'),
  });

  return { page, isLoading, upsertPage, submitForApproval };
}

export function usePublicVendorPage(slug: string | undefined) {
  return useQuery({
    queryKey: ['vendor-public-page', slug],
    queryFn: async () => {
      const { data: pageData, error: pageError } = await supabase
        .from('vendor_pages_public' as any)
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (pageError) throw pageError;
      const page = pageData as unknown as VendorPage & {
        vendor_first_name: string | null;
        vendor_last_name: string | null;
        vendor_company_name: string | null;
        vendor_vendor_type: string | null;
        vendor_instagram: string | null;
        vendor_website: string | null;
      };

      // Construct vendor object from view columns (no separate profiles query needed)
      const vendor = {
        first_name: page.vendor_first_name,
        last_name: page.vendor_last_name,
        company_name: page.vendor_company_name,
        vendor_type: page.vendor_vendor_type,
        instagram_handle: page.vendor_instagram,
        website: page.vendor_website,
      };

      return { ...page, vendor };
    },
    enabled: !!slug,
  });
}

export function useVendorPageApprovals() {
  const queryClient = useQueryClient();

  const { data: pendingPages, isLoading } = useQuery({
    queryKey: ['vendor-page-approvals'],
    queryFn: async () => {
      const { data: pages, error } = await supabase
        .from('vendor_pages' as any)
        .select('*')
        .eq('status', 'pending_approval')
        .order('submitted_at', { ascending: true })
        .limit(200);
      if (error) throw error;

      // Fetch vendor profiles for each page
      const vendorIds = (pages as unknown as VendorPage[]).map(p => p.vendor_id);
      const { data: vendors } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, vendor_type')
        .in('id', vendorIds)
        .limit(200);

      const vendorMap = new Map((vendors || []).map(v => [v.id, v]));
      return (pages as unknown as VendorPage[]).map(p => ({ ...p, vendor: vendorMap.get(p.vendor_id) || null }));
    },
  });

  const approve = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from('vendor_pages' as any)
        .update({ status: 'approved', approved_at: new Date().toISOString(), admin_notes: null })
        .eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-page-approvals'] });
      toast.success('Page approved');
    },
    onError: () => {
      toast.error('Failed to approve page');
    },
  });

  const reject = useMutation({
    mutationFn: async ({ pageId, notes }: { pageId: string; notes: string }) => {
      const { error } = await supabase
        .from('vendor_pages' as any)
        .update({ status: 'rejected', admin_notes: notes })
        .eq('id', pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-page-approvals'] });
      toast.success('Page rejected');
    },
    onError: () => {
      toast.error('Failed to reject page');
    },
  });

  return { pendingPages, isLoading, approve, reject };
}
