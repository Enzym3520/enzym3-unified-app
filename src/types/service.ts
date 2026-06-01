export interface VendorService {
  id: string;
  service_type: string;
  rate_type: string;
  base_rate: number;
  overtime_rate: number | null;
  min_hours: number | null;
  is_active: boolean;
  notes: string | null;
}

export interface VendorPackage {
  id: string;
  vendor_id?: string;
  name: string;
  description: string | null;
  price: number;
  features: string[] | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface VendorAddOn {
  id: string;
  vendor_id?: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}
