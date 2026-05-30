import type { TourStep } from '@/config/portalTourSteps';

/**
 * Dev-only utility that validates tour steps against the current DOM.
 * Logs warnings for any data-tour selectors that are missing on the expected route.
 * 
 * This does NOT run in production — guarded by import.meta.env.DEV.
 */
export function auditTourSteps(steps: TourStep[], currentPath: string): void {
  if (!import.meta.env.DEV) return;

  const stepsForCurrentRoute = steps.filter(s => s.route === currentPath);
  if (stepsForCurrentRoute.length === 0) return;

  const missing: string[] = [];

  for (const step of stepsForCurrentRoute) {
    if (!step.element) continue;
    const selector = step.element as string;
    const el = document.querySelector(selector);
    if (!el) {
      missing.push(selector);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[Tour Audit] ${missing.length} missing element(s) on ${currentPath}:\n` +
      missing.map(s => `  ⚠ ${s}`).join('\n') +
      '\n\nUpdate src/config/portalTourSteps.ts or add the missing data-tour attributes.'
    );
  } else {
    console.debug(`[Tour Audit] ✅ All ${stepsForCurrentRoute.length} tour elements found on ${currentPath}`);
  }
}

/**
 * Audit all steps across all routes (checks only what's currently in the DOM).
 * Useful when called from startTour() to catch any immediately-visible issues.
 */
export function auditAllVisibleSteps(steps: TourStep[]): string[] {
  if (!import.meta.env.DEV) return [];

  const currentPath = window.location.pathname;
  const missing: string[] = [];

  for (const step of steps) {
    if (step.route !== currentPath) continue;
    if (!step.element) continue;
    const selector = step.element as string;
    if (!document.querySelector(selector)) {
      missing.push(selector);
    }
  }

  return missing;
}
