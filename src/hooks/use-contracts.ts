import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ContractTemplate {
  id: string;
  vendor_id: string;
  name: string;
  body_html: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  vendor_id: string;
  template_id: string | null;
  event_id: string | null;
  title: string;
  body_html: string;
  status: "draft" | "sent" | "viewed" | "signed" | "declined";
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  signer_name: string | null;
  signer_email: string | null;
  signature_data: string | null;
  signature_ip: string | null;
  sign_token: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  event?: { couple_name: string; event_date: string; event_type: string } | null;
}

const TEMPLATES_KEY = "contract-templates";
const CONTRACTS_KEY = "vendor-contracts";

// ─── Templates ───────────────────────────────────────────────

export function useContractTemplates() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [TEMPLATES_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vendor_contract_templates")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContractTemplate[];
    },
    enabled: !!user,
  });
}

export function useSaveTemplate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: { id?: string; name: string; body_html: string; is_default?: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (t.id) {
        const { error } = await supabase
          .from("vendor_contract_templates")
          .update({ name: t.name, body_html: t.body_html, is_default: t.is_default ?? false, updated_at: new Date().toISOString() })
          .eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("vendor_contract_templates")
          .insert({ vendor_id: user.id, name: t.name, body_html: t.body_html, is_default: t.is_default ?? false });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
      toast.success("Template saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_contract_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] });
      toast.success("Template deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Contracts ───────────────────────────────────────────────

export function useContracts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: [CONTRACTS_KEY, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("vendor_contracts")
        .select("*, event:event_notification_history(couple_name, event_date, event_type)")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!user,
  });
}

export function useSaveContract() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: {
      id?: string;
      template_id?: string | null;
      event_id?: string | null;
      title: string;
      body_html: string;
      signer_email?: string;
      signer_name?: string;
      status?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (c.id) {
        const { data, error } = await supabase
          .from("vendor_contracts")
          .update({
            title: c.title,
            body_html: c.body_html,
            template_id: c.template_id ?? null,
            event_id: c.event_id ?? null,
            signer_email: c.signer_email,
            signer_name: c.signer_name,
            status: c.status ?? "draft",
            updated_at: new Date().toISOString(),
          })
          .eq("id", c.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("vendor_contracts")
          .insert({
            vendor_id: user.id,
            title: c.title,
            body_html: c.body_html,
            template_id: c.template_id ?? null,
            event_id: c.event_id ?? null,
            signer_email: c.signer_email,
            signer_name: c.signer_name,
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      toast.success("Contract saved");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      toast.success("Contract deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useSendContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contractId: string) => {
      const { data, error } = await supabase.functions.invoke("send-contract-email", {
        body: { contractId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CONTRACTS_KEY] });
      toast.success("Contract sent to client");
    },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Public (no auth) ────────────────────────────────────────

export function usePublicContract(token: string | undefined) {
  return useQuery({
    queryKey: ["public-contract", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from("vendor_contracts")
        .select("id, title, body_html, status, signer_name, signer_email, expires_at, sign_token, vendor_id")
        .eq("sign_token", token)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Contract not found");
      // Mark as viewed
      if (data.status === "sent") {
        await supabase
          .from("vendor_contracts")
          .update({ status: "viewed", viewed_at: new Date().toISOString() })
          .eq("id", data.id);
      }
      return data;
    },
    enabled: !!token,
    staleTime: 0,
  });
}

export function useSignContract() {
  return useMutation({
    mutationFn: async (payload: {
      contractId: string;
      signToken: string;
      signerName: string;
      signatureData: string;
    }) => {
      const { error } = await supabase
        .from("vendor_contracts")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signer_name: payload.signerName,
          signature_data: payload.signatureData,
        })
        .eq("sign_token", payload.signToken);
      if (error) throw error;
    },
    onError: (e) => toast.error(e.message),
  });
}
