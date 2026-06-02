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
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
type F = z.infer<typeof schema>;

type InquiryForm = {
  name: string;
  email: string;
  phone?: string;
  eventDate?: string;
  eventType?: string;
  message: string;
};

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAdmin, isVendor, isLoading, roles } = useUserRole();

  // Inquiry form state
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState(false);
  const [inquiry, setInquiry] = useState<InquiryForm>({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventType: '',
    message: '',
  });

  const handleInquiryChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setInquiry((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setInquiryError(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.name.trim() || !inquiry.email.trim() || !inquiry.message.trim()) return;
    setInquiryLoading(true);
    setInquiryError(false);
    try {
      const { error } = await supabase.functions.invoke('send-inquiry-email', {
        body: {
          name: inquiry.name.trim(),
          email: inquiry.email.trim(),
          phone: inquiry.phone?.trim() || undefined,
          eventDate: inquiry.eventDate || undefined,
          eventType: inquiry.eventType || undefined,
          message: inquiry.message.trim(),
        },
      });
      if (error) throw error;
      setInquirySuccess(true);
    } catch {
      setInquiryError(true);
    } finally {
      setInquiryLoading(false);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isLoading) return;
    const isAuthenticated = roles.length > 0;
    if (!isAuthenticated) return;
    if (isAdmin) navigate('/staff', { replace: true });
    else if (isVendor) navigate('/vendor', { replace: true });
    else navigate('/app', { replace: true });
  }, [isAdmin, isVendor, isLoading, roles, navigate]);

  const onSubmit = async ({ email, password }: F) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Sign in error:', error);
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
    // on success, useEffect above handles redirect
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f6f2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#85D4FA]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f6f2] flex flex-col">
      {/* Mobile header */}
      <div className="md:hidden flex justify-center pt-10 pb-6 px-6">
        <img src={logoBlue} alt="Enzym3 Entertainment" className="h-16 w-auto" />
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left panel — branding */}
        <div className="hidden md:flex md:w-1/2 lg:w-3/5 flex-col justify-between bg-[#2D2921] px-12 lg:px-20 py-16">
          <img src={logoBlue} alt="Enzym3 Entertainment" className="h-16 w-auto" />

          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
              Your event,<br />perfectly planned.
            </h1>
            <p className="text-[#DBD4C3] text-lg leading-relaxed">
              Sign contracts, manage payments, plan your music, and stay connected with your DJ team — all in one place.
            </p>
            <div className="pt-4 space-y-2 text-sm text-[#DBD4C3]/70">
              <p>(520) 406-8600</p>
              <p>booking@enzym3entertainment.vip</p>
            </div>
          </div>

          <div className="text-xs text-[#DBD4C3]/40">
            &copy; {new Date().getFullYear()} Enzym3 Entertainment
          </div>
        </div>

        {/* Right panel — login */}
        <div className="flex-1 md:w-1/2 lg:w-2/5 flex items-center justify-center px-6 md:px-12 lg:px-16 py-10 md:py-16">
          <div className="w-full max-w-sm space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-[#2D2921]">Welcome back</h2>
              <p className="text-sm text-[#2D2921]/60 mt-1">Sign in to your event portal</p>
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
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[#85D4FA] hover:underline"
                  >
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
                className="w-full bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold h-11 text-base"
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

            <div className="space-y-3 pt-2">
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
                  className="w-full border-[#DBD4C3] text-[#2D2921] hover:bg-[#DBD4C3]/30 font-medium"
                >
                  Use an Invite Code
                </Button>
              </Link>
            </div>

            {/* Inquiry / Contact section */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setInquiryOpen((o) => !o)}
                className="w-full flex items-center justify-between text-sm font-medium text-[#2D2921]/70 hover:text-[#2D2921] transition-colors py-2 border-t border-[#DBD4C3]"
              >
                <span>Planning an event?</span>
                {inquiryOpen ? (
                  <ChevronUp className="h-4 w-4 text-[#85D4FA]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#85D4FA]" />
                )}
              </button>

              {inquiryOpen && (
                <div className="mt-3">
                  {inquirySuccess ? (
                    <p className="text-sm text-center text-[#2D2921]/70 py-4 bg-[#85D4FA]/10 rounded-lg">
                      Thanks! We'll be in touch soon.
                    </p>
                  ) : (
                    <form onSubmit={handleInquirySubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs text-[#2D2921]/70 font-medium">
                            Name <span className="text-[#85D4FA]">*</span>
                          </Label>
                          <Input
                            name="name"
                            value={inquiry.name}
                            onChange={handleInquiryChange}
                            placeholder="Your name"
                            required
                            className="h-9 text-sm border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white"
                          />
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs text-[#2D2921]/70 font-medium">
                            Email <span className="text-[#85D4FA]">*</span>
                          </Label>
                          <Input
                            name="email"
                            type="email"
                            value={inquiry.email}
                            onChange={handleInquiryChange}
                            placeholder="you@email.com"
                            required
                            className="h-9 text-sm border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white"
                          />
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs text-[#2D2921]/70 font-medium">Phone</Label>
                          <Input
                            name="phone"
                            type="tel"
                            value={inquiry.phone}
                            onChange={handleInquiryChange}
                            placeholder="(optional)"
                            className="h-9 text-sm border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white"
                          />
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <Label className="text-xs text-[#2D2921]/70 font-medium">Event Date</Label>
                          <Input
                            name="eventDate"
                            type="date"
                            value={inquiry.eventDate}
                            onChange={handleInquiryChange}
                            className="h-9 text-sm border-[#DBD4C3] focus:border-[#85D4FA] focus:ring-[#85D4FA]/20 bg-white"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs text-[#2D2921]/70 font-medium">Event Type</Label>
                          <select
                            name="eventType"
                            value={inquiry.eventType}
                            onChange={handleInquiryChange}
                            className="w-full h-9 text-sm rounded-md border border-[#DBD4C3] bg-white px-3 text-[#2D2921] focus:outline-none focus:border-[#85D4FA] focus:ring-2 focus:ring-[#85D4FA]/20"
                          >
                            <option value="">Select type (optional)</option>
                            <option value="Wedding">Wedding</option>
                            <option value="Quinceañera">Quinceañera</option>
                            <option value="Birthday">Birthday</option>
                            <option value="Sweet 16">Sweet 16</option>
                            <option value="Corporate">Corporate</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-xs text-[#2D2921]/70 font-medium">
                            Message <span className="text-[#85D4FA]">*</span>
                          </Label>
                          <textarea
                            name="message"
                            value={inquiry.message}
                            onChange={handleInquiryChange}
                            placeholder="Tell us about your event…"
                            required
                            rows={3}
                            className="w-full text-sm rounded-md border border-[#DBD4C3] bg-white px-3 py-2 text-[#2D2921] placeholder:text-[#2D2921]/40 focus:outline-none focus:border-[#85D4FA] focus:ring-2 focus:ring-[#85D4FA]/20 resize-none"
                          />
                        </div>
                      </div>

                      {inquiryError && (
                        <p className="text-xs text-destructive">
                          Something went wrong. Call us at (520) 406-8600.
                        </p>
                      )}

                      <Button
                        type="submit"
                        disabled={inquiryLoading}
                        className="w-full h-9 text-sm bg-[#85D4FA] hover:bg-[#6ec4ef] text-[#2D2921] font-semibold"
                      >
                        {inquiryLoading ? (
                          <>
                            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                            Sending…
                          </>
                        ) : (
                          'Send Inquiry'
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Mobile contact */}
            <div className="md:hidden text-center text-xs text-[#2D2921]/40 pt-4 space-y-1">
              <p>(520) 406-8600 &bull; booking@enzym3entertainment.vip</p>
              <p>&copy; {new Date().getFullYear()} Enzym3 Entertainment</p>
            </div>

            <div className="text-center pt-2">
              <Link to="/staff" className="text-xs text-[#2D2921]/30 hover:text-[#2D2921]/60 transition-colors">
                Staff / Vendor login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
