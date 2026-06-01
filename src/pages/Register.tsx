import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
const schema = z.object({
  inviteCode: z.string().min(1,'Invite code required'),
  email: z.string().email(),
  password: z.string().min(8,'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message:'Passwords do not match', path:['confirmPassword'] });
type F = z.infer<typeof schema>;
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { inviteCode: searchParams.get('code') || '' },
  });
  const onSubmit = async ({ inviteCode, email, password }: F) => {
    setLoading(true);
    const { data: valid, error: codeErr } = await supabase.functions.invoke('validate-invite-code', { body: { code: inviteCode } });
    if (codeErr || !valid?.valid) {
      toast.error(valid?.error || 'Invalid invite code');
      setLoading(false);
      return;
    }
    // Capture the source from validation so we know which table to update
    const validationSource: 'dj_codes' | 'couple_codes' = valid?.source ?? 'dj_codes';
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { invite_code: inviteCode } } });
    if (error) {
      console.error('Sign up error:', error);
      toast.error('Something went wrong. Please try again.');
    } else {
      // Mark invite as used so it cannot be reused
      const { data: { user } } = await supabase.auth.getUser();
      if (validationSource === 'couple_codes') {
        await supabase
          .from('couple_codes')
          .update({ used_at: new Date().toISOString(), used_by: user?.id ?? null })
          .eq('code', inviteCode)
          .is('used_at', null);
      } else {
        await supabase
          .from('dj_codes')
          .update({ used_at: new Date().toISOString(), used_by: user?.id ?? null })
          .eq('code', inviteCode)
          .is('used_at', null);
      }
      toast.success('Check your email to confirm');
      navigate('/login');
    }
    setLoading(false);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[['inviteCode','Invite code','text','WED-XXXXXXXX'],['email','Email','email',''],['password','Password','password',''],['confirmPassword','Confirm password','password','']].map(([name,label,type,ph]) => (
            <div key={name} className="space-y-1"><Label>{label}</Label><Input type={type} placeholder={ph} {...register(name as any)} />{errors[name as keyof F] && <p className="text-xs text-destructive">{(errors[name as keyof F] as any)?.message}</p>}</div>
          ))}
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
        </form>
        <div className="text-center text-sm"><Link to="/login" className="text-muted-foreground hover:underline">Already have an account?</Link></div>
      </div>
    </div>
  );
}
