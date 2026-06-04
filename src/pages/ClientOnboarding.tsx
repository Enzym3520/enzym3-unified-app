import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logoBlue from '@/assets/logo-blue.png';
import { Loader2, CheckCircle2, Calendar, MapPin, Music2, ArrowRight } from 'lucide-react';

interface WeddingData {
  couple_name: string;
  event_date: string | null;
  venue: string | null;
  event_type: string | null;
}

const accountSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
});

type AccountFields = z.infer<typeof accountSchema>;
type ProfileFields = z.infer<typeof profileSchema>;

function formatDate(d: string) {
  try {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch { return d; }
}

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i < step ? 'w-6 h-2 bg-[#85D4FA]' :
            i === step ? 'w-6 h-2 bg-[#85D4FA]' :
            'w-2 h-2 bg-[#DBD4C3]'
          }`}
        />
      ))}
    </div>
  );
}

export default function ClientOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get('code') || '';
  const wid = searchParams.get('wid') || '';
  const isVenuePartner = searchParams.get('type') === 'venue';

  const [step, setStep] = useState(0);
  const [wedding, setWedding] = useState<WeddingData | null>(null);
  const [loadingWedding, setLoadingWedding] = useState(!!wid);
  const [submitting, setSubmitting] = useState(false);
  const [accountData, setAccountData] = useState<AccountFields | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const accountForm = useForm<AccountFields>({ resolver: zodResolver(accountSchema) });
  const profileForm = useForm<ProfileFields>({ resolver: zodResolver(profileSchema) });

  useEffect(() => {
    if (!wid) { setLoadingWedding(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('event_notification_history')
          .select('couple_name, event_date, venue, event_type')
          .eq('id', wid)
          .maybeSingle();
        if (data) setWedding(data as WeddingData);
      } finally {
        setLoadingWedding(false);
      }
    })();
  }, [wid]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/app/dashboard', { replace: true });
    });
  }, [navigate]);

  const handleAccountNext = (data: AccountFields) => {
    setAccountData(data);
    setStep(2);
  };

  const handleProfileSubmit = async (profile: ProfileFields) => {
    if (!accountData) return;
    setSubmitting(true);

    const { data: valid, error: codeErr } = await supabase.functions.invoke('validate-invite-code', {
      body: { code },
    });
    if (codeErr || !valid?.valid) {
      toast.error(valid?.error || 'Invite code is invalid or expired');
      setSubmitting(false);
      return;
    }

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: accountData.email,
      password: accountData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          first_name: profile.firstName,
          last_name: profile.lastName,
          phone: profile.phone,
          invite_code: code,
        },
      },
    });

    if (signUpErr) {
      toast.error(signUpErr.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    const userId = signUpData.user?.id;

    if (userId) {
      await supabase.from('profiles').upsert({
        id: userId,
        first_name: profile.firstName,
        last_name: profile.lastName,
        phone: profile.phone,
        email: accountData.email,
        role: 'client',
      }, { onConflict: 'id' });

      const source = valid.source as 'couple_codes' | 'dj_codes';
      if (source === 'couple_codes') {
        await supabase
          .from('couple_codes')
          .update({ used_at: new Date().toISOString(), used_by: userId })
          .eq('code', code)
          .is('used_at', null);
      } else {
        await supabase
          .from('dj_codes')
          .update({ used_at: new Date().toISOString(), used_by: userId })
          .eq('code', code)
          .is('used_at', null);
      }
    }

    setSubmittedEmail(accountData.email);
    setSubmitting(false);
    setStep(3);
  };

  const totalSteps = 3;

  if (loadingWedding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f6f2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#85D4FA]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f6f2] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">

        <div className="text-center">
          <Link to="/">
            <img src={logoBlue} alt="Enzym3 Entertainment" className="h-10 w-auto mx-auto" />
          </Link>
        </div>

        {step < 3 && (
          <div className="space-y-1 text-center">
            <p className="text-xs text-[#2D2921]/40 uppercase tracking-widest">
              Step {step + 1} of {totalSteps}
            </p>
            <ProgressDots step={step} total={totalSteps} />
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-[#2D2921]">
                {isVenuePartner ? "Welcome to your portal" : "You're officially booked."}
              </h1>
              <p className="text-[#2D2921]/55">
                {isVenuePartner
                  ? "Let's get you set up with portal access."
                  : "Let's get your event portal set up so we can start planning your perfect night."}
              </p>
            </div>

            {wedding && (
              <div className="bg-white border border-[#DBD4C3] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-[#2D2921]">
                  <Music2 className="h-4 w-4 text-[#85D4FA] shrink-0" />
                  <span className="font-semibold">{wedding.couple_name}</span>
                </div>
                {wedding.event_date && (
                  <div className="flex items-center gap-2 text-sm text-[#2D2921]/70">
                    <Calendar className="h-4 w-4 text-[#85D4FA] shrink-0" />
                    <span>{formatDate(wedding.event_date)}</span>
                  </div>
                )}
                {wedding.venue && (
                  <div className="flex items-center gap-2 text-sm text-[#2D2921]/70">
                    <MapPin className="h-4 w-4 text-[#85D4FA] shrink-0" />
                    <span>{wedding.venue}</span>
                  </div>
                )}
              </div>
            )}

            {!isVenuePartner && (
              <div className="bg-[#85D4FA]/10 border border-[#85D4FA]/30 rounded-2xl p-4 space-y-2">
                <p className="text-sm font-semibold text-[#2D2921]">Your portal includes:</p>
                <ul className="text-sm text-[#2D2921]/70 space-y-1">
                  <li>• View and sign your contract</li>
                  <li>• Build your vibe sheet & music preferences</li>
                  <li>• Schedule meetings with your coordinator</li>
                  <li>• Add upgrades to your event</li>
                </ul>
              </div>
            )}

            <Button
              onClick={() => setStep(1)}
              className="w-full bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold h-12 text-base rounded-full"
            >
              Let's get started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 1: Create account */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-[#2D2921]">Create your login</h2>
              <p className="text-sm text-[#2D2921]/55">You'll use this to access your portal</p>
            </div>

            <form onSubmit={accountForm.handleSubmit(handleAccountNext)} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-[#2D2921] font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white h-11"
                  {...accountForm.register('email')}
                />
                {accountForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{accountForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#2D2921] font-medium">Password</Label>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white h-11"
                  {...accountForm.register('password')}
                />
                {accountForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{accountForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#2D2921] font-medium">Confirm password</Label>
                <Input
                  type="password"
                  placeholder="Re-enter password"
                  className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white h-11"
                  {...accountForm.register('confirmPassword')}
                />
                {accountForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">{accountForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(0)}
                  className="flex-1 border-[#DBD4C3] text-[#2D2921] rounded-full"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold rounded-full"
                >
                  Continue
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: About you */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-[#2D2921]">About you</h2>
              <p className="text-sm text-[#2D2921]/55">So your coordinator knows who they're working with</p>
            </div>

            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[#2D2921] font-medium">First name</Label>
                  <Input
                    placeholder="Jane"
                    className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white h-11"
                    {...profileForm.register('firstName')}
                  />
                  {profileForm.formState.errors.firstName && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#2D2921] font-medium">Last name</Label>
                  <Input
                    placeholder="Smith"
                    className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white h-11"
                    {...profileForm.register('lastName')}
                  />
                  {profileForm.formState.errors.lastName && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[#2D2921] font-medium">Phone number</Label>
                <Input
                  type="tel"
                  placeholder="(520) 000-0000"
                  className="border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white h-11"
                  {...profileForm.register('phone')}
                />
                {profileForm.formState.errors.phone && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-[#DBD4C3] text-[#2D2921] rounded-full"
                  disabled={submitting}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold rounded-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                  ) : (
                    'Create account'
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-[#85D4FA]/20 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-[#85D4FA]" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-[#2D2921]">You're all set!</h2>
              <p className="text-[#2D2921]/60">
                We sent a confirmation email to
              </p>
              <p className="font-semibold text-[#2D2921]">{submittedEmail}</p>
              <p className="text-sm text-[#2D2921]/55 pt-1">
                Click the link in that email to confirm your account, then sign in to access your portal.
              </p>
            </div>
            <Button
              onClick={() => navigate('/login')}
              className="w-full bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold h-12 text-base rounded-full"
            >
              Go to Sign In
            </Button>
            <p className="text-xs text-[#2D2921]/35">
              Didn't get the email? Check your spam folder or{' '}
              <a href="mailto:booking@enzym3entertainment.vip" className="hover:underline">contact us</a>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
