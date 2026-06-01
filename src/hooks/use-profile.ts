import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ProfileData {
  first_name: string;
  last_name: string;
  company_name: string;
  vendor_type: string;
  phone: string;
  website: string;
  instagram_handle: string;
  avatar_url?: string | null;
  vendor_types?: string[] | null;
  starting_price?: number | null;
  price_type?: string | null;
  service_area?: string[] | null;
  equipment_notes?: string | null;
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, company_name, vendor_type, phone, website, instagram_handle, avatar_url, vendor_types, starting_price, price_type, service_area, equipment_notes")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as unknown as ProfileData;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (form: Partial<ProfileData>) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated!");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save profile."),
  });
}
