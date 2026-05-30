import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { toast } from "sonner";
import { Save, Mail, Phone, User, Lock, UserPlus, Copy, CheckCheck, Loader2, Sun, Moon, Monitor, Bell, Volume2, VolumeX, BellRing } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { getNotificationSoundPref, setNotificationSoundPref } from "@/hooks/useNotifications";
import { usePushSubscription } from "@/hooks/usePushSubscription";
import { getEventLabel, getClientLabel, getRegistrationFieldConfig, getDetailsCardTitle, normalizeEventType } from "@/lib/eventUtils";
import { formatPackageType, parseLocalDate } from "@/lib/formatters";
import { logAction } from "@/lib/activityLogger";
import { useTheme } from "next-themes";

const PushNotificationToggle = () => {
  const { isSubscribed, isSupported, loading, subscribe, unsubscribe } = usePushSubscription();

  if (!isSupported) {
    return (
      <div className="flex items-center justify-between opacity-50">
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-muted-foreground" />
          <Label>Push notifications</Label>
        </div>
        <span className="text-xs text-muted-foreground">Not supported in this browser</span>
      </div>
    );
  }

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const ok = await subscribe();
      toast[ok ? 'success' : 'error'](
        ok ? 'Push notifications enabled!' : 'Failed to enable push notifications. Check browser permissions.'
      );
    } else {
      const ok = await unsubscribe();
      toast[ok ? 'success' : 'error'](
        ok ? 'Push notifications disabled' : 'Failed to disable push notifications'
      );
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <BellRing className="h-4 w-4 text-muted-foreground" />
        <Label htmlFor="push-notif">Push notifications</Label>
      </div>
      <Switch
        id="push-notif"
        checked={isSubscribed}
        disabled={loading}
        onCheckedChange={handleToggle}
      />
    </div>
  );
};

const Settings = () => {
  const { event: wedding, loading: eventLoading, user, refetch } = useClientEvent<any>(
    'id, couple_name, event_date, venue, event_type, contact_email, contact_phone, bride_email, groom_email, package_type'
  );
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [eventType, setEventType] = useState<string>('wedding');
  const [coupleName, setCoupleName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [brideEmail, setBrideEmail] = useState('');
  const [groomEmail, setGroomEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Partner invite state
  const [partnerEmail, setPartnerEmail] = useState('');
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fieldConfig = getRegistrationFieldConfig(eventType);

  // Populate form fields when wedding data loads
  useEffect(() => {
    if (!wedding) return;
    setEventType(normalizeEventType(wedding.event_type));
    setCoupleName(wedding.couple_name || '');
    setContactEmail(wedding.contact_email || '');
    setBrideEmail(wedding.bride_email || '');
    setGroomEmail(wedding.groom_email || '');
    setContactPhone(wedding.contact_phone || '');
  }, [wedding]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('event_notification_history')
        .update({
          couple_name: coupleName,
          contact_email: contactEmail,
          bride_email: brideEmail,
          groom_email: groomEmail,
          contact_phone: contactPhone
        })
        .eq('id', wedding.id);

      if (error) throw error;

      toast.success('Settings saved successfully!');
      if (user) {
        await logAction(wedding.id, "updated contact settings", user.id, user.email || "Unknown", "Settings");
      }
      await refetch();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (eventLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!wedding) {
    return <div className="text-center py-12">No event found</div>;
  }

  const handleGenerateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wedding || !partnerEmail) return;

    setGeneratingInvite(true);
    try {
      const { data, error } = await supabase
        .from('partner_invitations')
        .insert([{
          wedding_id: wedding.id,
          invited_email: partnerEmail,
          created_by_user_id: user?.id,
        }] as any)
        .select('token')
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/join?token=${(data as any).token}`;
      setInviteLink(link);
      toast.success('Invite link generated!');
    } catch (err: any) {
      console.error('Partner invite error:', err);
      toast.error('Failed to generate invite link. Please try again.');
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    // Tour step: portalTourSteps.ts — "Manage Your Account"
    <div className="container mx-auto px-4 space-y-6" data-tour="settings-intro">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your contact information and preferences
        </p>
      </div>


      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setTheme("light")}
            >
              <Sun className="h-4 w-4" /> Light
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setTheme("dark")}
            >
              <Moon className="h-4 w-4" /> Dark
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              className="flex-1 gap-2"
              onClick={() => setTheme("system")}
            >
              <Monitor className="h-4 w-4" /> System
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Update your contact details for communication with your DJ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupleName">
                <User className="inline h-4 w-4 mr-2" />
                {getClientLabel(eventType)}
              </Label>
              <Input
                id="coupleName"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
                placeholder={fieldConfig.person1Placeholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">
                <Mail className="inline h-4 w-4 mr-2" />
                Primary Contact Email
              </Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="primary@example.com"
                required
              />
              <p className="text-sm text-muted-foreground">
                Primary contact for communications
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brideEmail">
                <Mail className="inline h-4 w-4 mr-2" />
                {fieldConfig.person1Label}'s Email
              </Label>
              <Input
                id="brideEmail"
                type="email"
                value={brideEmail}
                onChange={(e) => setBrideEmail(e.target.value)}
                placeholder={`${fieldConfig.person1Label.toLowerCase()}@example.com`}
                required
              />
              <p className="text-sm text-muted-foreground">
                Can be used to access the portal
              </p>
            </div>

            {fieldConfig.showPerson2 && (
              <div className="space-y-2">
                <Label htmlFor="groomEmail">
                  <Mail className="inline h-4 w-4 mr-2" />
                  {fieldConfig.person2Label}'s Email
                </Label>
                <Input
                  id="groomEmail"
                  type="email"
                  value={groomEmail}
                  onChange={(e) => setGroomEmail(e.target.value)}
                  placeholder={`${fieldConfig.person2Label.toLowerCase()}@example.com`}
                />
                <p className="text-sm text-muted-foreground">
                  Can be used to access the portal
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contactPhone">
                <Phone className="inline h-4 w-4 mr-2" />
                Contact Phone
              </Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{getDetailsCardTitle(eventType)}</CardTitle>
          <CardDescription>
            These details are managed by Enzym3 Entertainment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-muted-foreground">Event Date</Label>
            <p className="font-medium">
              {parseLocalDate(wedding.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          {wedding.venue && (
            <div>
              <Label className="text-muted-foreground">Venue</Label>
              <p className="font-medium">{wedding.venue}</p>
            </div>
          )}
          {wedding.package_type && (
            <div>
              <Label className="text-muted-foreground">Package</Label>
              <p className="font-medium">{formatPackageType(wedding.package_type)}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-4">
            Need to update these details? Contact us at{" "}
            <a 
              href="mailto:help@enzym3entertainment.vip" 
              className="text-primary hover:underline"
            >
              help@enzym3entertainment.vip
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Partner Invite Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Your Partner
          </CardTitle>
          <CardDescription>
            Give your partner their own login so you can both access the portal independently. Their actions will be logged separately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!inviteLink ? (
            <form onSubmit={handleGenerateInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="partnerEmail">
                  <Mail className="inline h-4 w-4 mr-2" />
                  Partner's Email Address
                </Label>
                <Input
                  id="partnerEmail"
                  type="email"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                  placeholder="partner@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This should match the email on file for your partner (bride/groom email).
                </p>
              </div>
              <Button type="submit" disabled={generatingInvite} variant="outline">
                {generatingInvite ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-2" />Generate Invite Link</>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Share this link with your partner:</p>
              <div className="flex gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button variant="outline" onClick={handleCopyLink} className="shrink-0">
                  {copied ? <CheckCheck className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Link expires in 30 days. They'll create their own password.</p>
              <Button variant="ghost" size="sm" onClick={() => { setInviteLink(''); setPartnerEmail(''); }}>
                Generate another link
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password. Leave blank if you use magic link (email) login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword !== confirmPassword) {
                toast.error('Passwords do not match.');
                return;
              }
              if (newPassword.length < 8) {
                toast.error('Password must be at least 8 characters.');
                return;
              }
              setChangingPassword(true);
              try {
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) throw error;
                toast.success('Password updated successfully!');
                setNewPassword('');
                setConfirmPassword('');
              } catch (err: any) {
                console.error('Password update error:', err);
                toast.error('Failed to update password. Please try again.');
              } finally {
                setChangingPassword(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={changingPassword}>
              <Lock className="mr-2 h-4 w-4" />
              {changingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getNotificationSoundPref() ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              <Label htmlFor="notif-sound">Notification sound</Label>
            </div>
            <Switch
              id="notif-sound"
              defaultChecked={getNotificationSoundPref()}
              onCheckedChange={(checked) => {
                setNotificationSoundPref(checked);
                toast.success(checked ? 'Notification sound enabled' : 'Notification sound muted');
              }}
            />
          </div>
          <PushNotificationToggle />
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
