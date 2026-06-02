export type Portal = 'client' | 'staff' | 'vendor' | null;
const MAP: Record<string, Portal> = {
  'coordination.enzym3entertainment.vip': 'staff',
  'vendor.enzym3entertainment.vip': 'vendor',
};
// plan.enzym3entertainment.vip is the unified app — role determines portal, not hostname
export function portalFromHostname(hostname: string): Portal {
  return MAP[hostname] ?? null;
}
