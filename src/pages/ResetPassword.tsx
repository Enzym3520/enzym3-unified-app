import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
const schema = z.object({ password: z.string().min(8), confirmPassword: z.string() }).refine(d => d.password === d.confirmPassword, { message:'Passwords do not match', path:['confirmPassword'] });
type F = z.infer<typeof schema>;
export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });
  useEffect(() => { supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setReady(true); }); }, []);
  const onSubmit = async ({ password }: F) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { console.error('Password update error:', error); toast.error('Something went wrong. Please try again.'); } else { toast.success('Password updated'); navigate('/login'); }
    setLoading(false);
  };
  if (!ready) return <div className="min-h-screen flex items-center justify-center bg-background"><p className="text-muted-foreground text-sm">Loading…</p></div>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Set new password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>New password</Label><Input type="password" {...register('password')} />{errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}</div>
          <div className="space-y-1"><Label>Confirm</Label><Input type="password" {...register('confirmPassword')} />{errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating…' : 'Update password'}</Button>
        </form>
      </div>
    </div>
  );
}
