import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
export function VendorShell() {
  useEffect(() => {
    document.documentElement.classList.remove('portal-client','portal-staff','portal-vendor');
    document.documentElement.classList.add('portal-vendor');
    return () => document.documentElement.classList.remove('portal-vendor');
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 h-16 bg-primary" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex h-16 items-center px-4"><span className="font-semibold text-primary-foreground text-lg">enzym3 vendor</span></div>
      </header>
      <main className="scroll-mt-16"><Outlet /></main>
    </div>
  );
}
