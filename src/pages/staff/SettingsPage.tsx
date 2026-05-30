import { useUserRole } from '@/hooks/useUserRole';
// VendorProfileSettings is a Plan 4 component — stubbed until implemented
import { CoordinatorProfileSettings } from '@/components/staff/coordinator/CoordinatorProfileSettings';
import { NotificationSettings } from '@/components/staff/NotificationSettings';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { isVendor, isAdmin, isModerator, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold font-playfair text-primary">Profile & Settings</h1>
      {isVendor && !isAdmin && !isModerator ? <div>Vendor profile settings coming soon</div> : <CoordinatorProfileSettings />}
      <NotificationSettings />
    </div>
  );
}
