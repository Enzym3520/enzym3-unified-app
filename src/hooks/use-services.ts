import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";
import type { VendorService, VendorPackage, VendorAddOn } from "@/types";
export type { VendorService, VendorPackage, VendorAddOn };

export function useServices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.services.all(user?.id),
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("vendor_services").select("*").eq("vendor_id", user.id).order("created_at");
      if (error) throw error;
      return data as VendorService[];
    },
  });
}

export function usePackages() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.packages.all(user?.id),
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("vendor_packages").select("*").eq("vendor_id", user.id).order("sort_order");
      if (error) throw error;
      return data as VendorPackage[];
    },
  });
}

export function useAddOns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: queryKeys.addOns.all(user?.id),
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("vendor_add_ons").select("*").eq("vendor_id", user.id).order("sort_order");
      if (error) throw error;
      return data as VendorAddOn[];
    },
  });
}

export function useSaveService() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: any) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...form, vendor_id: user.id, overtime_rate: form.overtime_rate || null, min_hours: form.min_hours || null };
      const result = id
        ? await supabase.from("vendor_services").update(payload).eq("id", id).select().single()
        : await supabase.from("vendor_services").insert(payload).select().single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.id ? "Service updated" : "Service added");
      qc.invalidateQueries({ queryKey: queryKeys.services.root() });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to save service"),
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service removed");
      qc.invalidateQueries({ queryKey: queryKeys.services.root() });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove service"),
  });
}

export function useSavePackage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, features, ...form }: any) => {
      if (!user) throw new Error("Not authenticated");
      const featureArr = typeof features === "string" ? features.split("\n").map((f: string) => f.trim()).filter(Boolean) : features;
      const payload = { ...form, features: featureArr, vendor_id: user.id };
      const result = id
        ? await supabase.from("vendor_packages").update(payload).eq("id", id).select().single()
        : await supabase.from("vendor_packages").insert(payload).select().single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.id ? "Package updated" : "Package added");
      qc.invalidateQueries({ queryKey: queryKeys.packages.root() });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to save package"),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Package removed");
      qc.invalidateQueries({ queryKey: queryKeys.packages.root() });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove package"),
  });
}

export function useSaveAddOn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...form }: any) => {
      if (!user) throw new Error("Not authenticated");
      const payload = { ...form, vendor_id: user.id };
      const result = id
        ? await supabase.from("vendor_add_ons").update(payload).eq("id", id).select().single()
        : await supabase.from("vendor_add_ons").insert(payload).select().single();
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.id ? "Add-on updated" : "Add-on added");
      qc.invalidateQueries({ queryKey: queryKeys.addOns.root() });
    },
    onError: (error: any) => toast.error(error?.message || "Failed to save add-on"),
  });
}

export function useDeleteAddOn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_add_ons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Add-on removed");
      qc.invalidateQueries({ queryKey: queryKeys.addOns.root() });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to remove add-on"),
  });
}
