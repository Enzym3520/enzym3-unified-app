import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VendorService {
  id: string;
  vendor_id: string;
  service_type: string;
  base_rate: number;
  rate_type: 'hourly' | 'flat_fee' | 'per_event';
  min_hours?: number;
  overtime_rate?: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorEventRate {
  id: string;
  vendor_id: string;
  event_type: string;
  rate_modifier: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useVendorServices = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-services', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as VendorService[];
    },
    enabled: !!vendorId,
  });
};

export const useVendorEventRates = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ['vendor-event-rates', vendorId],
    queryFn: async () => {
      if (!vendorId) throw new Error('No vendor ID');

      const { data, error } = await supabase
        .from('vendor_event_rates')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('event_type', { ascending: true })
        .limit(200);

      if (error) throw error;
      return data as VendorEventRate[];
    },
    enabled: !!vendorId,
  });
};

export const useAllVendorServices = () => {
  return useQuery({
    queryKey: ['all-vendor-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_services')
        .select(`
          *,
          profiles:vendor_id (
            first_name,
            last_name,
            company_name,
            vendor_type
          )
        `)
        .eq('is_active', true)
        .order('service_type', { ascending: true })
        .limit(500);

      if (error) throw error;
      return data;
    },
  });
};

export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: Omit<VendorService, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('vendor_services')
        .insert(service)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services', variables.vendor_id] });
      queryClient.invalidateQueries({ queryKey: ['all-vendor-services'] });
      toast.success('Service added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add service');
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorService> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendor_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services', data.vendor_id] });
      queryClient.invalidateQueries({ queryKey: ['all-vendor-services'] });
      toast.success('Service updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update service');
    },
  });
};

export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const { error } = await supabase
        .from('vendor_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return vendorId;
    },
    onSuccess: (vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services', vendorId] });
      queryClient.invalidateQueries({ queryKey: ['all-vendor-services'] });
      toast.success('Service deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete service');
    },
  });
};

export const useCreateEventRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rate: Omit<VendorEventRate, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('vendor_event_rates')
        .insert(rate)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-event-rates', variables.vendor_id] });
      toast.success('Event rate added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add event rate');
    },
  });
};

export const useUpdateEventRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorEventRate> & { id: string }) => {
      const { data, error } = await supabase
        .from('vendor_event_rates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-event-rates', data.vendor_id] });
      toast.success('Event rate updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update event rate');
    },
  });
};

export const useDeleteEventRate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const { error } = await supabase
        .from('vendor_event_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return vendorId;
    },
    onSuccess: (vendorId) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-event-rates', vendorId] });
      toast.success('Event rate deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete event rate');
    },
  });
};
