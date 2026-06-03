import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VendorInvite } from '@/types/vendorInvite';
import { toast } from 'sonner';
import { getVendorRegistrationLink } from '@/config/urls';

export const useVendorInvites = () => {
  return useQuery({
    queryKey: ['vendor-invites'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dj_codes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as VendorInvite[];
    },
  });
};

export const useValidateInviteCode = (code: string | null) => {
  return useQuery({
    queryKey: ['validate-invite', code],
    queryFn: async () => {
      if (!code) throw new Error('No code provided');

      const { data, error } = await supabase
        .from('dj_codes')
        .select('*')
        .eq('code', code)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Invalid or expired invite code');
      return data as VendorInvite;
    },
    enabled: !!code,
    retry: false,
  });
};

export const useCreateVendorInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invite: {
      email: string;
      vendorType: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      expiresInDays?: number;
      notes?: string;
      inviteRole?: 'vendor' | 'coordinator';
    }) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique code
      const code = generateInviteCode();

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + (invite.expiresInDays || 30));

      const { data, error } = await supabase
        .from('dj_codes')
        .insert([{
          code,
          user_id: 0, // Legacy field, set to 0
          invited_by: user.id,
          invited_email: invite.email,
          invited_first_name: invite.firstName,
          invited_last_name: invite.lastName,
          invited_company: invite.companyName,
          invited_role: invite.inviteRole || 'vendor',
          vendor_type: invite.inviteRole === 'coordinator' ? null : invite.vendorType,
          expires_at: expiresAt.toISOString(),
          active: true,
          email: invite.email,
          name: `${invite.firstName || ''} ${invite.lastName || ''}`.trim() || invite.email,
          notes: invite.notes,
        }] as any)
        .select()
        .single();

      if (error) throw error;
      
      // Send invitation email with auto-fill code in URL
      const registrationLink = getVendorRegistrationLink(code);
      let emailSent = true;
      try {
        const { error: emailError } = await supabase.functions.invoke('send-vendor-invite-email', {
          body: {
            email: invite.email,
            firstName: invite.firstName,
            lastName: invite.lastName,
            companyName: invite.companyName,
            vendorType: invite.vendorType,
            code,
            registrationLink,
            expiresAt: expiresAt.toISOString(),
          },
        });
        if (emailError) emailSent = false;
      } catch {
        emailSent = false;
      }

      return { invite: data as VendorInvite, emailSent };
    },
    onSuccess: ({ emailSent }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success(
        emailSent
          ? 'Invite created and email sent!'
          : 'Invite created — email failed to send. Resend from the vendor list.'
      );
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create invite');
    },
  });
};

export const useUpdateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      inviteId: string;
      email: string;
      firstName: string;
      lastName: string;
      company: string;
      vendorType: string;
      resendEmail: boolean;
      code: string;
      expiresAt: string;
    }) => {
      // Update the invite record
      const { error } = await supabase
        .from('dj_codes')
        .update({
          invited_email: params.email,
          email: params.email,
          invited_first_name: params.firstName,
          invited_last_name: params.lastName,
          invited_company: params.company,
          vendor_type: params.vendorType,
          name: `${params.firstName} ${params.lastName}`.trim() || params.email,
        })
        .eq('id', params.inviteId);

      if (error) throw error;

      // If vendor has registered, sync changes to their profile
      const { data: invite } = await supabase
        .from('dj_codes')
        .select('used_by')
        .eq('id', params.inviteId)
        .maybeSingle();

      if (invite?.used_by) {
        const profileUpdate: Record<string, any> = {
          first_name: params.firstName || null,
          last_name: params.lastName || null,
          company_name: params.company || null,
          email: params.email || null,
        };
        if (params.vendorType) {
          profileUpdate.vendor_type = params.vendorType;
          profileUpdate.vendor_types = [params.vendorType];
        }
        await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', invite.used_by);
      }

      if (params.resendEmail) {
        const registrationLink = getVendorRegistrationLink(params.code);
        await supabase.functions.invoke('send-vendor-invite-email', {
          body: {
            email: params.email,
            firstName: params.firstName,
            lastName: params.lastName,
            companyName: params.company,
            vendorType: params.vendorType,
            code: params.code,
            registrationLink,
            expiresAt: params.expiresAt,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success('Invite updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update invite');
    },
  });
};

export const useDeactivateInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from('dj_codes')
        .update({ active: false })
        .eq('id', inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success('Invite deactivated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate invite');
    },
  });
};

export const useDeleteInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      // Use admin edge function to bypass RLS and ensure proper permission checking
      const { data, error } = await supabase.functions.invoke('admin-delete-invite', {
        body: { inviteId },
      });

      if (error) {
        if (import.meta.env.DEV) console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to delete invite');
      }

      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-data'] });
      toast.success('Invite deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete invite');
    },
  });
};

export const useResendInviteEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendor: {
      email: string;
      name: string;
      company?: string;
      vendorType: string;
      inviteCode: string;
      expiresAt?: string;
    }) => {
      const [firstName, ...lastNameParts] = vendor.name.split(' ');
      const lastName = lastNameParts.join(' ');
      const registrationLink = getVendorRegistrationLink(vendor.inviteCode);

      const { error } = await supabase.functions.invoke('send-vendor-invite-email', {
        body: {
          email: vendor.email,
          firstName,
          lastName,
          companyName: vendor.company,
          vendorType: vendor.vendorType,
          code: vendor.inviteCode,
          registrationLink,
          expiresAt: vendor.expiresAt,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-invites'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
      toast.success('Invitation email resent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to resend email');
    },
  });
};

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
