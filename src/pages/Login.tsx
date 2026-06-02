import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logoBlue from '@/assets/logo-blue.png';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
type F = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAdmin, isModerator, isVendor, isLoading, roles } = useUserRole();

  useEffect(() => {
    if (isLoading) return;
    if (roles.length === 0) return;
    if (isAdmin || isModerator) navigate('/staff', { replace: true });
    else if (isVendor) navigate('/vendor', { replace: true });
    else navigate('/app', { replace: true });
  }, [isAdmin, isModerator, isVendor, isLoading, roles, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: F) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error('Incorrect email or password.');
      setLoading(false);
    }
    // On success, useEffect above handles redirect
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0806]">
        <Loader2 className="h-8 w-8 animate-spin text-[#85D4FA]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f6f2] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-4">
          <Link to="/">
            <img
              src={logoBlue}
              alt="Enzym3 Entertainment"
              className="h-10 w-auto mx-auto"
            />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2921]">Welcome back</h1>
            <p className="text-sm text-[#2D2921]/55 mt-1">Sign in to your event portal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-[#2D2921] font-medium">Email</Label>
            <Input
              type="email"
              placeholder="your@email.com"
              className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-[#2D2921] font-medium">Password</Label>
              <Link to="/forgot-password" className="text-xs text-[#85D4FA] hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold h-11 text-base rounded-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <div className="space-y-3 pt-1">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#DBD4C3]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#f9f6f2] px-3 text-[#2D2921]/40">New here?</span>
            </div>
          </div>
          <Link to="/register">
            <Button
              variant="outline"
              className="w-full border-[#DBD4C3] text-[#2D2921] hover:bg-[#DBD4C3]/30 font-medium rounded-full"
            >
              Use an Invite Code
            </Button>
          </Link>
        </div>

        <div className="text-center space-y-2 text-xs text-[#2D2921]/35">
          <Link to="/" className="hover:text-[#2D2921]/60 transition-colors block">
            ← Back to home
          </Link>
          <Link to="/staff" className="hover:text-[#2D2921]/60 transition-colors block">
            Staff / Vendor login →
          </Link>
        </div>
      </div>
    </div>
  );
}
