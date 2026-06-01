import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  vendor_id: string;
  subject_template: string;
  greeting: string;
  body_html: string;
  cta_text: string;
  cta_url: string | null;
  signoff_text: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  logo_url: string | null;
  brand_color: string;
  created_at: string;
  updated_at: string;
}

export function useEmailTemplate() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["email-template", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("vendor_email_templates")
        .select("*")
        .eq("vendor_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as EmailTemplate | null;
    },
  });
}

export function useSaveEmailTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (template: Partial<EmailTemplate>) => {
      if (!user) throw new Error("Not authenticated");

      const payload = { ...template, vendor_id: user.id };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;

      const { error } = await supabase
        .from("vendor_email_templates")
        .upsert(payload, { onConflict: "vendor_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email template saved!");
      qc.invalidateQueries({ queryKey: ["email-template"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to save template."),
  });
}
