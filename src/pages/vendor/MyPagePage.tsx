import { VendorPageBuilder } from '@/components/vendor/VendorPageBuilder';
import { useProfile } from '@/hooks/use-profile';

export default function MyPagePage() {
  const { data: profile } = useProfile();

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <VendorPageBuilder
        vendorProfile={profile ? {
          first_name: profile.first_name,
          last_name: profile.last_name,
          company_name: profile.company_name,
          vendor_type: profile.vendor_type,
          website: profile.website,
          instagram_handle: profile.instagram_handle,
        } : null}
      />
    </div>
  );
}
