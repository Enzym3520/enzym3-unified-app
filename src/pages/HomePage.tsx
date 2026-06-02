import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logoBlue from '@/assets/logo-blue.png';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, Star, Phone, Mail, ChevronDown, FileText, Music, Calendar, Heart } from 'lucide-react';

type InquiryForm = {
  name: string;
  email: string;
  phone: string;
  eventDate: string;
  eventType: string;
  message: string;
};

const steps = [
  {
    number: '01',
    Icon: FileText,
    title: 'Get Your Invite',
    desc: 'After booking, you receive a personal invite code to unlock your private client portal.',
  },
  {
    number: '02',
    Icon: Music,
    title: 'Plan Your Music',
    desc: 'Submit your vibe sheet, must-plays, do-not-plays, and every special song request.',
  },
  {
    number: '03',
    Icon: Calendar,
    title: 'Stay Connected',
    desc: 'Review contracts, track payments, schedule meetings, and message your DJ team directly.',
  },
  {
    number: '04',
    Icon: Heart,
    title: 'Enjoy Your Event',
    desc: "Show up and dance. We've had every detail locked in from day one.",
  },
];

const reviews = [
  {
    name: 'Mariana & Carlos V.',
    event: 'Wedding · Tucson, AZ',
    stars: 5,
    quote:
      'Enzym3 made our wedding night absolutely unforgettable. The portal made everything so easy — playlist, contract, timeline, all in one place. Our guests are still talking about it.',
  },
  {
    name: 'Destiny R.',
    event: 'Quinceañera · Phoenix, AZ',
    stars: 5,
    quote:
      'I was stressed about planning everything but the team walked me through every step. The client portal let me plan my songs and track every detail. 10/10 would recommend to any family.',
  },
  {
    name: 'James & Priya M.',
    event: 'Wedding · Scottsdale, AZ',
    stars: 5,
    quote:
      'Professional, responsive, and the music was perfect. We used the vibe sheet to plan exactly what we wanted and they delivered. The night-of coordination was completely seamless.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAdmin, isVendor, isLoading, roles } = useUserRole();

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

  // If already logged in, redirect to the right portal immediately
  useEffect(() => {
    if (isLoading) return;
    if (roles.length === 0) return;
    if (isAdmin) navigate('/staff', { replace: true });
    else if (isVendor) navigate('/vendor', { replace: true });
    else navigate('/app', { replace: true });
  }, [isAdmin, isVendor, isLoading, roles, navigate]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0806]">
        <Loader2 className="h-8 w-8 animate-spin text-[#85D4FA]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#2D2921]">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-5">
        <img src={logoBlue} alt="Enzym3 Entertainment" className="h-9 w-auto" />
        <div className="flex items-center gap-3">
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden sm:block px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Book an Event
          </button>
          <Link to="/login">
            <button className="px-5 py-2 text-sm font-semibold text-white border border-white/25 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm">
              Client Login
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Background gradient fallback (shows while video loads / if blocked) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0806] via-[#161210] to-[#2D2921]" />

        {/* Vimeo background video */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <iframe
            src="https://player.vimeo.com/video/1166132336?background=1&autoplay=1&loop=1&muted=1&controls=0"
            allow="autoplay; fullscreen"
            title="Enzym3 Entertainment"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 min-w-[177.77vh] min-h-[56.25vw] w-[100vw] h-[100vh] border-0"
          />
        </div>

        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto space-y-6">
          <p className="text-[#85D4FA] text-xs font-semibold tracking-[5px] uppercase">
            Tucson, Arizona
          </p>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight">
            Your Event.<br />Our Expertise.
          </h1>
          <p className="text-[#DBD4C3] text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
            Premium DJ services and event coordination for weddings, quinceañeras, and every celebration in between.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#85D4FA] text-[#2D2921] font-bold rounded-full text-base hover:bg-white transition-colors"
            >
              Book Your Event
            </button>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full px-8 py-3.5 border border-white/30 text-white font-semibold rounded-full text-base hover:bg-white/10 transition-colors">
                Client Portal →
              </button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/30" />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 md:px-12 bg-[#f9f6f2]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[#85D4FA] text-xs font-semibold tracking-[4px] uppercase">The Client Experience</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D2921]">How the Portal Works</h2>
            <p className="text-[#2D2921]/55 max-w-md mx-auto text-base">
              Once you book, you get your own private planning portal — everything in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map(({ number, Icon, title, desc }) => (
              <div key={number} className="flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[#85D4FA] font-bold text-sm font-mono">{number}</span>
                  <div className="h-px flex-1 bg-[#DBD4C3]" />
                </div>
                <Icon className="h-6 w-6 text-[#2D2921]/40" />
                <h3 className="font-bold text-[#2D2921] text-lg leading-snug">{title}</h3>
                <p className="text-[#2D2921]/55 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="py-24 px-6 md:px-12 bg-[#2D2921]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <p className="text-[#85D4FA] text-xs font-semibold tracking-[4px] uppercase">Client Stories</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">What Our Clients Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((r, i) => (
              <div
                key={i}
                className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-5"
              >
                <div className="flex gap-1">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#85D4FA] text-[#85D4FA]" />
                  ))}
                </div>
                <p className="text-[#DBD4C3] text-sm leading-relaxed flex-1">
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div>
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <p className="text-[#DBD4C3]/40 text-xs mt-0.5">{r.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT / INQUIRY ── */}
      <section id="contact" className="py-24 px-6 md:px-12 bg-[#f9f6f2]">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <p className="text-[#85D4FA] text-xs font-semibold tracking-[4px] uppercase">Get In Touch</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#2D2921]">Ready to Book?</h2>
            <p className="text-[#2D2921]/55">
              Tell us about your event and we'll be in touch within 24 hours.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
            <a
              href="tel:5204068600"
              className="flex items-center gap-2 text-[#2D2921]/60 hover:text-[#2D2921] transition-colors"
            >
              <Phone className="h-4 w-4 text-[#85D4FA]" />
              (520) 406-8600
            </a>
            <a
              href="mailto:booking@enzym3entertainment.vip"
              className="flex items-center gap-2 text-[#2D2921]/60 hover:text-[#2D2921] transition-colors"
            >
              <Mail className="h-4 w-4 text-[#85D4FA]" />
              booking@enzym3entertainment.vip
            </a>
          </div>

          {inquirySuccess ? (
            <div className="text-center py-16 bg-[#85D4FA]/10 rounded-2xl border border-[#85D4FA]/20">
              <p className="text-xl font-semibold text-[#2D2921]">We got it! Talk soon.</p>
              <p className="text-sm text-[#2D2921]/50 mt-2">Or call us at (520) 406-8600</p>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#2D2921]/70">
                    Name <span className="text-[#85D4FA]">*</span>
                  </Label>
                  <Input
                    name="name"
                    value={inquiry.name}
                    onChange={handleInquiryChange}
                    placeholder="Your name"
                    required
                    className="border-[#DBD4C3] focus:border-[#85D4FA] bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#2D2921]/70">
                    Email <span className="text-[#85D4FA]">*</span>
                  </Label>
                  <Input
                    name="email"
                    type="email"
                    value={inquiry.email}
                    onChange={handleInquiryChange}
                    placeholder="you@email.com"
                    required
                    className="border-[#DBD4C3] focus:border-[#85D4FA] bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#2D2921]/70">Phone</Label>
                  <Input
                    name="phone"
                    type="tel"
                    value={inquiry.phone}
                    onChange={handleInquiryChange}
                    placeholder="(optional)"
                    className="border-[#DBD4C3] focus:border-[#85D4FA] bg-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-[#2D2921]/70">Event Date</Label>
                  <Input
                    name="eventDate"
                    type="date"
                    value={inquiry.eventDate}
                    onChange={handleInquiryChange}
                    className="border-[#DBD4C3] focus:border-[#85D4FA] bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#2D2921]/70">Event Type</Label>
                <select
                  name="eventType"
                  value={inquiry.eventType}
                  onChange={handleInquiryChange}
                  className="w-full h-10 rounded-md border border-[#DBD4C3] bg-white px-3 text-sm text-[#2D2921] focus:outline-none focus:border-[#85D4FA] focus:ring-2 focus:ring-[#85D4FA]/20"
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

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-[#2D2921]/70">
                  Message <span className="text-[#85D4FA]">*</span>
                </Label>
                <textarea
                  name="message"
                  value={inquiry.message}
                  onChange={handleInquiryChange}
                  placeholder="Tell us about your event…"
                  required
                  rows={4}
                  className="w-full text-sm rounded-md border border-[#DBD4C3] bg-white px-3 py-2.5 text-[#2D2921] placeholder:text-[#2D2921]/35 focus:outline-none focus:border-[#85D4FA] focus:ring-2 focus:ring-[#85D4FA]/20 resize-none"
                />
              </div>

              {inquiryError && (
                <p className="text-sm text-destructive">
                  Something went wrong — call us at (520) 406-8600.
                </p>
              )}

              <Button
                type="submit"
                disabled={inquiryLoading}
                className="w-full h-11 bg-[#2D2921] hover:bg-[#3d3a34] text-white font-semibold text-base rounded-full"
              >
                {inquiryLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send Inquiry'
                )}
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0a0806] py-12 px-6 md:px-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoBlue} alt="Enzym3 Entertainment" className="h-8 w-auto opacity-80" />
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/35">
            <Link to="/login" className="hover:text-white/60 transition-colors">Client Login</Link>
            <Link to="/register" className="hover:text-white/60 transition-colors">Register with Code</Link>
            <Link to="/staff" className="hover:text-white/60 transition-colors">Staff / Vendor</Link>
            <a href="tel:5204068600" className="hover:text-white/60 transition-colors">(520) 406-8600</a>
          </div>
          <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} Enzym3 Entertainment</p>
        </div>
      </footer>
    </div>
  );
}
