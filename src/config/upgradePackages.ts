export const UPGRADE_PACKAGES = {
  Ruby: {
    price: 250,
    features: ['Uplights'],
  },
  Emerald: {
    price: 500,
    features: ['Uplights', 'Choice of: Projector Monogram OR Cold Sparks'],
  },
  Sapphire: {
    price: 1000,
    features: ['Uplights', 'Projector Monogram', 'Cold Sparks', 'Cloud 9'],
  },
} as const;

export const PAYMENT_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  paid: 'Paid',
} as const;

export const PAYMENT_STATUS_COLORS = {
  draft: 'secondary',
  pending: 'default',
  paid: 'default',
} as const;
