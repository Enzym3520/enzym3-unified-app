export interface UpgradeOrder {
  id: string;
  wedding_id: string;
  selected_package: 'Ruby' | 'Emerald' | 'Sapphire';
  emerald_choice?: 'Projector Monogram' | 'Cold Sparks' | null;
  notes?: string | null;
  payment_status: 'draft' | 'pending' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface UpgradeOrderWithWedding extends UpgradeOrder {
  event_notification_history: {
    couple_name: string;
    event_date: string;
    venue?: string | null;
    contact_email: string;
    contact_phone?: string | null;
    coordinator_name?: string | null;
    dj_name?: string | null;
    package_type?: string | null;
    guest_count?: number | null;
  };
}

export interface UpgradeStats {
  totalOrders: number;
  totalRevenue: number;
  byPackage: {
    Ruby: number;
    Emerald: number;
    Sapphire: number;
  };
  byStatus: {
    draft: number;
    pending: number;
    paid: number;
  };
}

export type PaymentStatus = 'draft' | 'pending' | 'paid';
export type PackageType = 'Ruby' | 'Emerald' | 'Sapphire';
