import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type State = 'loading' | 'valid' | 'invalid';

interface ValidationResult {
  valid: boolean;
  source?: 'dj_codes' | 'couple_codes';
  wedding_id?: string;
  error?: string;
}

export default function JoinByCode() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<State>('loading');
  const [result, setResult] = useState<ValidationResult | null>(null);

  useEffect(() => {
    async function run() {
      // If already logged in, redirect to the correct portal based on role
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check role to redirect to the correct portal
        const [rolesResult, profileResult] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', session.user.id).in('role', ['admin', 'super_admin', 'moderator']).maybeSingle(),
          supabase.from('profiles').select('role, vendor_type').eq('id', session.user.id).maybeSingle(),
        ]);

        if (rolesResult.data) {
          navigate('/staff', { replace: true });
        } else if (profileResult.data?.role === 'vendor' || profileResult.data?.role === 'dj' || profileResult.data?.vendor_type) {
          navigate('/vendor', { replace: true });
        } else {
          navigate('/app/dashboard', { replace: true });
        }
        return;
      }

      // Validate the code
      const { data, error } = await supabase.functions.invoke('validate-invite-code', {
        body: { code },
      });

      if (error || !data?.valid) {
        setResult(data ?? { valid: false, error: 'Invalid invite code' });
        setState('invalid');
      } else {
        setResult(data as ValidationResult);
        setState('valid');
      }
    }

    run();
  }, [code, navigate]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#85D4FA] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-[#2D2921] text-sm tracking-wide">Enzym3 Entertainment</p>
        </div>
      </div>
    );
  }

  if (state === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md border border-[#DBD4C3] shadow-sm">
          <CardHeader className="text-center pb-2">
            <p className="text-xs uppercase tracking-widest text-[#85D4FA] font-medium mb-1">Enzym3 Entertainment</p>
            <CardTitle className="font-serif text-2xl text-[#2D2921]">Invite Link Issue</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4 pt-2">
            <p className="text-muted-foreground">
              {result?.error || 'This invite link is invalid or has expired.'}
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact Enzym3 Entertainment for a new invite link.
            </p>
            <div className="pt-2 border-t border-[#DBD4C3] space-y-1">
              <p className="text-sm text-[#2D2921]">
                <a href="mailto:booking@enzym3entertainment.vip" className="hover:underline">booking@enzym3entertainment.vip</a>
              </p>
              <p className="text-sm text-[#2D2921]">
                <a href="tel:+15204068600" className="hover:underline">(520) 406-8600</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid code — route by source
  if (result?.source === 'couple_codes') {
    // Client → full onboarding wizard
    const params = new URLSearchParams({ code: code! });
    if (result.wedding_id) params.set('wid', result.wedding_id);
    navigate(`/onboarding?${params.toString()}`, { replace: true });
    return null;
  }

  // Vendor / venue partner → simple register
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border border-[#DBD4C3] shadow-sm">
        <CardHeader className="text-center pb-2">
          <p className="text-xs uppercase tracking-widest text-[#85D4FA] font-medium mb-1">Enzym3 Entertainment</p>
          <CardTitle className="font-serif text-3xl text-[#2D2921]">You're Invited</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <p className="text-center text-muted-foreground">
            You've been invited to the Enzym3 portal.
          </p>
          <Button
            className="w-full bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold"
            onClick={() => navigate(`/register?code=${code}`)}
          >
            Set Up Your Account
          </Button>
          <p className="text-center text-sm">
            <a href="/login" className="text-muted-foreground hover:underline">
              Already have an account? Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
