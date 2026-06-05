// src/hooks/useAdminResetPassword.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ResetPasswordArgs {
  userId: string;
  newPassword: string;
}

export function useAdminResetPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, newPassword }: ResetPasswordArgs) => {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId, newPassword },
      });
      if (error) throw new Error(error.message || 'Failed to reset password');
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Password reset — user will be prompted to change it on next login.');
      queryClient.invalidateQueries({ queryKey: ['vendor-management'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to reset password.'),
  });
}
