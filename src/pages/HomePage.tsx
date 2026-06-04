import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import logoBlue from '@/assets/logo-blue.png';
import heroVideoAsset from '@/assets/hero-video.asset.json';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2, Star, Phone, Mail, FileText, Music, Calendar, Heart, ArrowRight, Volume2, VolumeX } from 'lucide-react';

type InquiryForm = {
  name: string; email: string; phone: string;
  eventDate: string; eventType: string; message: string;
};

const steps = [
  { number: '01', Icon: FileText, title: 'Get Your Invite', desc: 'After booking, you receive a personal invite code to unlock your private client portal.' },
  { number: '02', Icon: Music, title: 'Plan Your Music', desc: 'Submit your vibe sheet, must-plays, do-not-plays, and every special song request.' },
  { number: '03', Icon: Calendar, title: 'Stay Connected', desc: 'Review contracts, track payments, schedule meetings, and message your DJ team directly.' },
  { number: '04', Icon: Heart, title: 'Enjoy Your Event', desc: "Show up and dance. We've had every detail locked in from day one." },
];

const reviews = [
  { name: 'Mariana & Carlos V.', event: 'Wedding · Tucson, AZ', stars: 5, quote: 'Enzym3 made our wedding night absolutely unforgettable. The portal made everything so easy — playlist, contract, timeline, all in one place. Our guests are still talking about it.' },
  { name: 'Destiny R.', event: 'Quinceañera · Phoenix, AZ', stars: 5, quote: 'I was stressed about planning everything but the team walked me through every step. The client portal let me plan my songs and track every detail. 10/10 would recommend to any family.' },
  { name: 'James & Priya M.', event: 'Wedding · Scottsdale, AZ', stars: 5, quote: 'Professional, responsive, and the music was perfect. We used the vibe sheet to plan exactly what we wanted and they delivered. The night-of coordination was completely seamless.' },
];

const fadeUp = { hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { isAdmin, isVendor, isLoading, roles } = useUserRole();
  const [scrolled, setScrolled] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryError, setInquiryError] = useState(false);
  const [inquiry, setInquiry] = useState<InquiryForm>({ name: '', email: '', phone: '', eventDate: '', eventType: '', message: '' });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (roles.length === 0) return;
    if (isAdmin) navigate('/staff', { replace: true });
    else if (isVendor) navigate('/vendor', { replace: true });
    else navigate('/app', { replace: true });
  }, [isAdmin, isVendor, isLoading, roles, navigate]);

  const handleInquiryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setInquiry(p => ({ ...p, [e.target.name]: e.target.value }));
    setInquiryError(false);
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiry.name.trim() || !inquiry.email.trim() || !inquiry.message.trim()) return;
    setInquiryLoading(true);
    setInquiryError(false);
    try {
      const { error } = await supabase.functions.invoke('send-inquiry-email', {
        body: { name: inquiry.name.trim(), email: inquiry.email.trim(), phone: inquiry.phone?.trim() || undefined, eventDate: inquiry.eventDate || undefined, eventType: inquiry.eventType || undefined, message: inquiry.message.trim() },
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

      {/* ── NAV — glass on scroll ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 transition-all duration-500 ${scrolled ? 'glass-dark py-3' : ''}`}>
        <motion.img
          src={logoBlue}
          alt="Enzym3 Entertainment"
          className="h-9 w-auto"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <button
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="hidden sm:block px-4 py-2 text-sm font-medium text-white/65 hover:text-white transition-colors"
          >
            Book an Event
          </button>
          <Link to="/login">
            <button className="px-5 py-2 text-sm font-semibold text-white border border-white/20 rounded-full hover:bg-white/10 hover:border-white/40 transition-all duration-200 backdrop-blur-sm">
              Client Login
            </button>
          </Link>
        </motion.div>
      </nav>

      {/* ── HERO — text over dark gradient ── */}
      <section className="relative pt-32 pb-14 px-6 bg-gradient-to-b from-[#080604] via-[#0f0d0a] to-[#1a1612]">
        <div className="text-center max-w-3xl mx-auto space-y-7">
          <motion.p
            className="text-[#85D4FA] text-xs font-semibold tracking-[6px] uppercase"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
          >
            Tucson, Arizona
          </motion.p>
          <motion.h1
            className="font-display text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.08] tracking-tight"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          >
            Your Event.<br />
            <em className="not-italic text-[#85D4FA]">Our Expertise.</em>
          </motion.h1>
          <motion.p
            className="text-[#a09590] text-lg md:text-xl leading-relaxed max-w-lg mx-auto"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35 }}
          >
            Premium DJ services and event coordination for weddings, quinceañeras, and every celebration in between.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          >
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#85D4FA] text-[#0f0d0a] font-bold rounded-full text-base hover:bg-white transition-all duration-200 hover:shadow-[0_0_32px_rgba(133,212,250,0.35)]"
            >
              Book Your Event
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link to="/login" className="w-full sm:w-auto">
              <button className="w-full px-8 py-3.5 border border-white/20 text-white font-semibold rounded-full text-base hover:bg-white/8 hover:border-white/35 transition-all duration-200">
                Client Portal →
              </button>
            </Link>
          </motion.div>
        </div>

        {/* Subtle glow behind headline */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#85D4FA]/6 rounded-full blur-[80px]" />
        </div>
      </section>

      {/* ── HERO VIDEO ── */}
      <section className="relative w-full bg-[#0a0806]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1612]/60 via-transparent to-[#0a0806]/40 pointer-events-none z-10" />
        <video
          ref={videoRef}
          src={heroVideoAsset.url}
          autoPlay loop muted playsInline
          className="w-full h-auto block"
        />
        <button
          onClick={() => {
            const v = videoRef.current;
            if (!v) return;
            v.muted = !v.muted;
            setVideoMuted(v.muted);
          }}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 text-white text-xs font-medium px-3 py-2 rounded-full backdrop-blur-sm transition-colors"
          aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
        >
          {videoMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {videoMuted ? 'Unmute' : 'Mute'}
        </button>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="bg-[#0a0806] border-t border-white/6 py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-white/30 text-xs font-medium tracking-widest uppercase">
          {['Weddings', 'Quinceañeras', 'Birthdays', 'Corporate', 'Sweet 16', 'Tucson · Phoenix · Scottsdale'].map(t => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section className="py-28 px-6 md:px-12 bg-[#f9f6f2]">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-20 space-y-4">
            <motion.p variants={fadeUp} className="text-[#85D4FA] text-xs font-semibold tracking-[5px] uppercase">The Client Experience</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-[#2D2921]">How the Portal Works</motion.h2>
            <motion.p variants={fadeUp} className="text-[#2D2921]/50 max-w-md mx-auto text-base leading-relaxed">
              Once you book, you get your own private planning portal — everything in one place, nothing left to chance.
            </motion.p>
          </Section>

          <Section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map(({ number, Icon, title, desc }) => (
              <motion.div key={number} variants={fadeUp} className="flex flex-col space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[#85D4FA] font-bold text-sm font-mono tracking-wider">{number}</span>
                  <div className="h-px flex-1 bg-[#DBD4C3]" />
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#85D4FA]/12 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-[#85D4FA]" />
                </div>
                <h3 className="font-display font-semibold text-[#2D2921] text-xl leading-snug">{title}</h3>
                <p className="text-[#2D2921]/50 text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="py-28 px-6 md:px-12 bg-[#141110]">
        <div className="max-w-5xl mx-auto">
          <Section className="text-center mb-20 space-y-4">
            <motion.p variants={fadeUp} className="text-[#85D4FA] text-xs font-semibold tracking-[5px] uppercase">Client Stories</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-white">What Our Clients Say</motion.h2>
          </Section>

          <Section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative bg-white/[0.04] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5 hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-300"
              >
                <div className="flex gap-1">
                  {Array.from({ length: r.stars }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-[#85D4FA] text-[#85D4FA]" />
                  ))}
                </div>
                <p className="text-[#a09590] text-sm leading-relaxed flex-1 italic">
                  &ldquo;{r.quote}&rdquo;
                </p>
                <div className="border-t border-white/8 pt-4">
                  <p className="text-white font-semibold text-sm">{r.name}</p>
                  <p className="text-white/25 text-xs mt-0.5">{r.event}</p>
                </div>
              </motion.div>
            ))}
          </Section>
        </div>
      </section>

      {/* ── CONTACT / INQUIRY ── */}
      <section id="contact" className="py-28 px-6 md:px-12 bg-[#f9f6f2]">
        <div className="max-w-xl mx-auto">
          <Section className="text-center mb-12 space-y-4">
            <motion.p variants={fadeUp} className="text-[#85D4FA] text-xs font-semibold tracking-[5px] uppercase">Get In Touch</motion.p>
            <motion.h2 variants={fadeUp} className="font-display text-4xl md:text-5xl font-bold text-[#2D2921]">Ready to Book?</motion.h2>
            <motion.p variants={fadeUp} className="text-[#2D2921]/50 leading-relaxed">
              Tell us about your event and we'll be in touch within 24 hours.
            </motion.p>
          </Section>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="flex flex-wrap justify-center gap-6 mb-10 text-sm"
          >
            <a href="tel:5204068600" className="flex items-center gap-2 text-[#2D2921]/55 hover:text-[#2D2921] transition-colors">
              <Phone className="h-4 w-4 text-[#85D4FA]" /> (520) 406-8600
            </a>
            <a href="mailto:booking@enzym3entertainment.vip" className="flex items-center gap-2 text-[#2D2921]/55 hover:text-[#2D2921] transition-colors">
              <Mail className="h-4 w-4 text-[#85D4FA]" /> booking@enzym3entertainment.vip
            </a>
          </motion.div>

          {inquirySuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
              className="text-center py-16 bg-[#85D4FA]/10 rounded-2xl border border-[#85D4FA]/20"
            >
              <p className="font-display text-2xl font-semibold text-[#2D2921]">We got it — talk soon.</p>
              <p className="text-sm text-[#2D2921]/45 mt-2">Or call us at (520) 406-8600</p>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }}
              onSubmit={handleInquirySubmit}
              className="space-y-4 bg-white rounded-3xl p-8 shadow-[0_2px_40px_rgba(45,41,33,0.08)]"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#2D2921]/50 uppercase tracking-wider">Name <span className="text-[#85D4FA]">*</span></Label>
                  <Input name="name" value={inquiry.name} onChange={handleInquiryChange} placeholder="Your name" required className="border-[#E8E2D8] focus:border-[#85D4FA] h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#2D2921]/50 uppercase tracking-wider">Email <span className="text-[#85D4FA]">*</span></Label>
                  <Input name="email" type="email" value={inquiry.email} onChange={handleInquiryChange} placeholder="you@email.com" required className="border-[#E8E2D8] focus:border-[#85D4FA] h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#2D2921]/50 uppercase tracking-wider">Phone</Label>
                  <Input name="phone" type="tel" value={inquiry.phone} onChange={handleInquiryChange} placeholder="Optional" className="border-[#E8E2D8] focus:border-[#85D4FA] h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-[#2D2921]/50 uppercase tracking-wider">Event Date</Label>
                  <Input name="eventDate" type="date" value={inquiry.eventDate} onChange={handleInquiryChange} className="border-[#E8E2D8] focus:border-[#85D4FA] h-11 rounded-xl" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#2D2921]/50 uppercase tracking-wider">Event Type</Label>
                <select name="eventType" value={inquiry.eventType} onChange={handleInquiryChange} className="w-full h-11 rounded-xl border border-[#E8E2D8] bg-white px-3 text-sm text-[#2D2921] focus:outline-none focus:border-[#85D4FA] focus:ring-2 focus:ring-[#85D4FA]/20">
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
                <Label className="text-xs font-semibold text-[#2D2921]/50 uppercase tracking-wider">Message <span className="text-[#85D4FA]">*</span></Label>
                <textarea name="message" value={inquiry.message} onChange={handleInquiryChange} placeholder="Tell us about your event…" required rows={4} className="w-full text-sm rounded-xl border border-[#E8E2D8] bg-white px-3 py-3 text-[#2D2921] placeholder:text-[#2D2921]/30 focus:outline-none focus:border-[#85D4FA] focus:ring-2 focus:ring-[#85D4FA]/20 resize-none" />
              </div>

              {inquiryError && <p className="text-sm text-destructive">Something went wrong — call us at (520) 406-8600.</p>}

              <Button type="submit" disabled={inquiryLoading} className="w-full h-12 bg-[#2D2921] hover:bg-[#1a1612] text-white font-semibold text-base rounded-full transition-all duration-200 hover:shadow-lg">
                {inquiryLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</> : 'Send Inquiry'}
              </Button>
            </motion.form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#080604] py-14 px-6 md:px-12 border-t border-white/6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <img src={logoBlue} alt="Enzym3 Entertainment" className="h-8 w-auto opacity-70" />
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-white/30">
            <Link to="/login" className="hover:text-white/60 transition-colors">Client Login</Link>
            <Link to="/register" className="hover:text-white/60 transition-colors">Register with Code</Link>
            <Link to="/staff" className="hover:text-white/60 transition-colors">Staff & Vendor</Link>
            <a href="tel:5204068600" className="hover:text-white/60 transition-colors">(520) 406-8600</a>
          </div>
          <p className="text-white/18 text-xs">&copy; {new Date().getFullYear()} Enzym3 Entertainment</p>
        </div>
      </footer>
    </div>
  );
}
