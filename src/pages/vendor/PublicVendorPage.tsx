import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePublicVendor } from "@/hooks/use-public-vendor";
import { useSubmitBookingRequest } from "@/hooks/use-booking-requests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Send, Music, Calendar } from "lucide-react";
import { smartCapitalize, formatPhone, EVENT_TYPE_OPTIONS } from "@/utils/smartFields";
import { formatVendorType, formatEventType } from "@/utils/vendorHelpers";

export default function PublicVendorPage() {
  const { handle } = useParams<{ handle: string }>();
  const { data: vendor, isLoading } = usePublicVendor(handle);
  const submitMutation = useSubmitBookingRequest();

  const [form, setForm] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    event_date: "",
    event_type: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Vendor not found</h1>
          <p className="text-muted-foreground">This vendor page doesn't exist or isn't published.</p>
        </div>
      </div>
    );
  }

  const { profile, services, reviews } = vendor;
  const displayName = profile?.company_name || `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || "Vendor";
  const initials = (profile?.first_name?.[0] ?? "") + (profile?.last_name?.[0] ?? "");
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submitMutation.mutateAsync({
        vendor_id: vendor.vendor_id,
        client_name: form.client_name,
        client_email: form.client_email,
        client_phone: form.client_phone || undefined,
        event_date: form.event_date || undefined,
        event_type: form.event_type || undefined,
        message: form.message || undefined,
      });
      setSubmitted(true);
    } catch {
      // Error is handled by react-query's onError / toast
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div
        className="relative h-48 md:h-64 flex items-end"
        style={{
          background: vendor.theme_color
            ? `linear-gradient(135deg, ${vendor.theme_color}, hsl(var(--primary)))`
            : `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="relative max-w-3xl mx-auto w-full px-6 pb-6 flex items-end gap-4">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
            <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile?.vendor_type && <Badge variant="secondary">{formatVendorType(profile.vendor_type)}</Badge>}
              {avgRating && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" /> {avgRating} ({reviews.length})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Bio */}
        {(vendor.headline || vendor.bio) && (
          <section>
            {vendor.headline && <h2 className="text-xl font-semibold mb-2">{vendor.headline}</h2>}
            {vendor.bio && <p className="text-muted-foreground leading-relaxed">{vendor.bio}</p>}
          </section>
        )}

        {/* Services */}
        {vendor.highlight_services && services.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" /> Services
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((s) => (
                <Card key={s.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{s.name}</p>
                      {s.price != null && <Badge variant="outline">${s.price}</Badge>}
                    </div>
                    {s.description && <p className="text-sm text-muted-foreground mt-1">{s.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {vendor.highlight_reviews && reviews.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" /> Reviews
            </h2>
            <div className="space-y-3">
              {reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{r.reviewer_name}</p>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-primary text-primary" : "text-muted"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.review_text}</p>
                    {r.event_type && <Badge variant="outline" className="mt-2 text-[10px]">{formatEventType(r.event_type)}</Badge>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Booking Form */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" /> Request a Booking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-6">
                  <div className="text-4xl mb-3">🎉</div>
                  <h3 className="text-lg font-semibold">Request Sent!</h3>
                  <p className="text-muted-foreground mt-1">
                    {displayName} will get back to you soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Your Name *</label>
                      <Input required value={form.client_name} onChange={(e) => setForm((f) => ({ ...f, client_name: smartCapitalize(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Email *</label>
                      <Input required type="email" value={form.client_email} onChange={(e) => setForm((f) => ({ ...f, client_email: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Phone</label>
                      <Input value={form.client_phone} onChange={(e) => setForm((f) => ({ ...f, client_phone: formatPhone(e.target.value) }))} />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Event Date</label>
                      <Input type="date" value={form.event_date} onChange={(e) => setForm((f) => ({ ...f, event_date: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Event Type</label>
                    <Select value={EVENT_TYPE_OPTIONS.some(o => o.label === form.event_type || o.value === form.event_type) ? (EVENT_TYPE_OPTIONS.find(o => o.label === form.event_type)?.value ?? form.event_type) : form.event_type ? "other" : ""} onValueChange={(v) => { if (v !== "other") setForm((f) => ({ ...f, event_type: EVENT_TYPE_OPTIONS.find(o => o.value === v)?.label ?? v })); else setForm((f) => ({ ...f, event_type: "" })); }}>
                      <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {(!EVENT_TYPE_OPTIONS.some(o => o.label === form.event_type) && form.event_type !== "") && (
                      <Input className="mt-2" value={form.event_type} onChange={(e) => setForm((f) => ({ ...f, event_type: smartCapitalize(e.target.value) }))} placeholder="Custom event type" />
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Message</label>
                    <Textarea placeholder="Tell us about your event..." value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} rows={4} />
                  </div>
                  <Button type="submit" disabled={submitMutation.isPending} className="w-full">
                    <Send className="mr-2 h-4 w-4" /> {submitMutation.isPending ? "Sending..." : "Send Request"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
