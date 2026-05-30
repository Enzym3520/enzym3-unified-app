export type Portal = 'client' | 'staff' | 'vendor' | null;
const MAP: Record<string, Portal> = {
  'plan.enzym3entertainment.vip': 'client',
  'coordination.enzymentertainment.vip': 'staff',
  'vendor.enzym3entertainment.vip': 'vendor',
};
export function portalFromHostname(hostname: string): Portal {
  return MAP[hostname] ?? null;
}
