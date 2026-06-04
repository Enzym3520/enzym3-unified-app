export type Portal = 'client' | 'staff' | 'vendor' | null;
const MAP: Record<string, Portal> = {};
// All portals on the unified app route by role, not hostname
export function portalFromHostname(hostname: string): Portal {
  return MAP[hostname] ?? null;
}
