import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface VendorPage {
  id: string;
  slug: string | null;
  headline: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  cover_photo_url: string | null;
  theme_color: string | null;
  show_pricing: boolean | null;
  highlight_reviews: boolean | null;
  highlight_services: boolean | null;
  status: string | null;
  gallery_photos: any | null;
  custom_sections: any | null;
  admin_notes: string | null;
}

export function useVendorPage() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["vendor-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("vendor_pages")
        .select("*")
        .eq("vendor_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as VendorPage | null;
    },
  });
}

export function useSaveVendorPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ pageId, form }: { pageId?: string; form: any }) => {
      const payload = {
        vendor_id: user!.id,
        slug: form.slug || null,
        headline: form.headline || null,
        bio: form.bio || null,
        theme_color: form.theme_color || null,
        show_pricing: form.show_pricing ?? false,
        highlight_reviews: form.highlight_reviews ?? false,
        highlight_services: form.highlight_services ?? false,
        gallery_photos: form.gallery_photos || [],
        custom_sections: form.custom_sections || [],
      };
      const result = pageId
        ? await supabase.from("vendor_pages").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", pageId).select().single()
        : await supabase.from("vendor_pages").insert(payload).select().single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      toast.success("Page saved!");
      qc.invalidateQueries({ queryKey: ["vendor-page"] });
    },
    onError: (e: any) => {
      toast.error(e.message?.includes("unique") ? "That URL slug is taken" : "Failed to save page");
    },
  });
}

export function useSubmitForReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("vendor_pages")
        .update({ status: "pending_review", submitted_at: new Date().toISOString() })
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Submitted for review!");
      qc.invalidateQueries({ queryKey: ["vendor-page"] });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to submit"),
  });
}
