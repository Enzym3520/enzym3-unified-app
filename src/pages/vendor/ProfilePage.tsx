import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Bell, Lock, Camera } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { formatVendorType } from "@/utils/vendorHelpers";
import { smartCapitalize, formatPhone } from "@/utils/smartFields";

const VENDOR_TYPE_OPTIONS = [
  "dj", "mc", "photography", "videography", "lighting", "photo_booth",
  "floral", "catering", "venue", "transportation", "bartending", "coordinator", "officiant", "band", "other",
];

const SERVICE_AREAS = ["Tucson", "Phoenix", "Southern Arizona", "Statewide", "Other"];

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { isSubscribed, subscribe, unsubscribe, loading: pushLoading, supported } = usePushNotifications();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company_name: "",
    vendor_type: "",
    phone: "",
    website: "",
    instagram_handle: "",
    vendor_types: [] as string[],
    starting_price: "",
    price_type: "custom_quote",
    service_area: [] as string[],
    equipment_notes: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTestPush = async () => {
    if (!user) return;
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-push-notification", {
        body: {
          userId: user.id,
          title: "Test notification",
          body: "If you can see this, push is working! 🎉",
          url: "/vendor/notifications",
          tag: "test",
        },
      });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      if (sent > 0) toast.success(`Test sent to ${sent} device${sent === 1 ? "" : "s"}.`);
      else toast.warning("No devices received the test. Check VAPID config or re-enable push.");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send test notification.");
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        company_name: profile.company_name ?? "",
        vendor_type: profile.vendor_type ?? "",
        phone: profile.phone ?? "",
        website: profile.website ?? "",
        instagram_handle: profile.instagram_handle ?? "",
        vendor_types: profile.vendor_types?.length ? profile.vendor_types : (profile.vendor_type ? [profile.vendor_type] : []),
        starting_price: profile.starting_price?.toString() ?? "",
        price_type: profile.price_type ?? "custom_quote",
        service_area: profile.service_area ?? [],
        equipment_notes: profile.equipment_notes ?? "",
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max file size is 2 MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      toast.error("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatar_url = urlData.publicUrl + "?t=" + Date.now();

    updateProfile.mutate({ avatar_url }, {
      onSettled: () => setUploading(false),
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      first_name: form.first_name,
      last_name: form.last_name,
      company_name: form.company_name,
      vendor_type: form.vendor_types[0] || form.vendor_type,
      phone: form.phone,
      website: form.website || undefined,
      instagram_handle: form.instagram_handle || undefined,
      vendor_types: form.vendor_types,
      starting_price: form.starting_price ? parseFloat(form.starting_price) : null,
      price_type: form.price_type || null,
      service_area: form.service_area.length > 0 ? form.service_area : null,
      equipment_notes: form.equipment_notes || undefined,
    } as any);
  };

  const toggleVendorType = (type: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      vendor_types: checked
        ? [...prev.vendor_types, type]
        : prev.vendor_types.filter(t => t !== type),
    }));
  };

  const toggleServiceArea = (area: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      service_area: checked
        ? [...prev.service_area, area]
        : prev.service_area.filter(a => a !== area),
    }));
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) await subscribe();
    else await unsubscribe();
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match."); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { console.error("Password change error:", error); toast.error("Something went wrong. Please try again."); }
    else {
      toast.success("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const initials = profile
    ? (profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "")
    : "?";

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="font-display text-2xl font-bold">Profile Settings</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile" />}
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">{initials.toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Button variant="link" size="sm" className="px-0 h-auto" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading…" : "Change photo"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal Info</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: smartCapitalize(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: smartCapitalize(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: smartCapitalize(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>Instagram Handle</Label>
              <Input value={form.instagram_handle} onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })} placeholder="@username" />
            </div>

            <Separator />

            {/* Vendor Types Multi-Select */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">Your Roles</h3>
                <p className="text-sm text-muted-foreground">Select all the services you provide</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {VENDOR_TYPE_OPTIONS.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={form.vendor_types.includes(type)}
                      onCheckedChange={(checked) => toggleVendorType(type, !!checked)}
                    />
                    <label htmlFor={`type-${type}`} className="text-sm font-medium leading-none cursor-pointer">
                      {formatVendorType(type)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Pricing & Service Area */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold">Pricing & Service Area</h3>
                <p className="text-sm text-muted-foreground">Your rates and service coverage</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Type</Label>
                  <Select value={form.price_type} onValueChange={(v) => setForm({ ...form, price_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select pricing model" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="flat_fee">Flat Fee</SelectItem>
                      <SelectItem value="custom_quote">Custom Quote Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Starting Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={form.starting_price}
                      onChange={(e) => setForm({ ...form, starting_price: e.target.value })}
                      placeholder="0.00"
                      className="pl-7"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Service Area</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_AREAS.map((area) => (
                    <div key={area} className="flex items-center space-x-2">
                      <Checkbox
                        id={`area-${area}`}
                        checked={form.service_area.includes(area)}
                        onCheckedChange={(checked) => toggleServiceArea(area, !!checked)}
                      />
                      <label htmlFor={`area-${area}`} className="text-sm font-medium leading-none cursor-pointer">
                        {area}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Equipment Notes */}
            <div className="space-y-3">
              <div>
                <h3 className="text-base font-semibold">Equipment & Notes</h3>
                <p className="text-sm text-muted-foreground">Additional details about your services</p>
              </div>
              <Textarea
                value={form.equipment_notes}
                onChange={(e) => setForm({ ...form, equipment_notes: e.target.value })}
                placeholder="Describe your equipment, setup requirements, special capabilities, etc."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" variant="outline" onClick={signOut}>Sign Out</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <div className="space-y-2">
            <Label>Confirm Password</Label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
            {changingPassword ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      {supported && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="h-4 w-4" /> Push Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Enable push notifications</p>
                <p className="text-xs text-muted-foreground">Get notified about new events, messages, and meetings.</p>
              </div>
              <Switch checked={isSubscribed} onCheckedChange={handlePushToggle} disabled={pushLoading} />
            </div>
            {isSubscribed && (
              <div className="flex items-center justify-between border-t pt-4">
                <div>
                  <p className="text-sm font-medium">Test push delivery</p>
                  <p className="text-xs text-muted-foreground">Send a test notification to all your devices.</p>
                </div>
                <Button size="sm" variant="outline" onClick={handleSendTestPush} disabled={sendingTest}>
                  {sendingTest ? "Sending..." : "Send test"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
