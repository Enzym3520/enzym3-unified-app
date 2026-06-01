import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
const schema = z.object({ email: z.string().email() });
type F = z.infer<typeof schema>;
export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });
  const onSubmit = async ({ email }: F) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) { console.error('Password reset error:', error); toast.error('Something went wrong. Please try again.'); } else setSent(true);
    setLoading(false);
  };
  if (sent) return <div className="min-h-screen flex items-center justify-center bg-background px-4"><div className="text-center space-y-4"><h1 className="text-2xl font-semibold">Check your email</h1><Link to="/login" className="text-sm text-primary hover:underline">Back to sign in</Link></div></div>;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Reset password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1"><Label>Email</Label><Input type="email" {...register('email')} />{errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}</div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</Button>
        </form>
        <div className="text-center"><Link to="/login" className="text-sm text-muted-foreground hover:underline">Back to sign in</Link></div>
      </div>
    </div>
  );
}
