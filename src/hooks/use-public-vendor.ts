import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublicVendorData {
  slug: string;
  bio: string | null;
  headline: string | null;
  theme_color: string | null;
  gallery_photos: any[] | null;
  highlight_services: boolean | null;
  highlight_reviews: boolean | null;
  vendor_id: string;
  profile: {
    first_name: string | null;
    last_name: string | null;
    company_name: string | null;
    avatar_url: string | null;
    vendor_type: string | null;
  } | null;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number | null;
  }>;
  reviews: Array<{
    id: string;
    reviewer_name: string;
    rating: number;
    review_text: string;
    event_type: string | null;
    created_at: string | null;
  }>;
}

export function usePublicVendor(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-vendor", slug],
    enabled: !!slug,
    queryFn: async (): Promise<PublicVendorData | null> => {
      if (!slug) return null;

      const { data, error } = await (supabase.rpc as any)("va_get_public_vendor_page", {
        p_slug: slug,
      });

      if (error || !data) return null;

      const result = data as any;
      return {
        slug: result.slug ?? slug,
        bio: result.bio,
        headline: result.headline,
        theme_color: result.theme_color,
        gallery_photos: result.gallery_photos ?? null,
        highlight_services: result.highlight_services,
        highlight_reviews: result.highlight_reviews,
        vendor_id: result.vendor_id,
        profile: result.profile ?? null,
        services: result.services ?? [],
        reviews: result.reviews ?? [],
      };
    },
  });
}
