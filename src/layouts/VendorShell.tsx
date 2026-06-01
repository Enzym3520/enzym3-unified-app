import { useEffect } from "react";
import { Outlet, Link } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/vendor/AppSidebar";
import { Bell, LogOut, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { NotificationBadge } from "@/components/vendor/notifications/NotificationBadge";
import { OfflineBanner } from "@/components/vendor/OfflineBanner";
import { unlockNotificationSound } from "@/utils/notificationSound";

export function VendorShell() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  useEffect(() => {
    document.documentElement.classList.remove("portal-client", "portal-staff", "portal-vendor");
    document.documentElement.classList.add("portal-vendor");
    return () => document.documentElement.classList.remove("portal-vendor");
  }, []);

  useEffect(() => {
    const onGesture = () => unlockNotificationSound();
    const opts: AddEventListenerOptions = { once: true, passive: true };
    window.addEventListener("pointerdown", onGesture, opts);
    window.addEventListener("keydown", onGesture, opts);
    window.addEventListener("touchstart", onGesture, opts);
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
    };
  }, []);

  return (
    <SidebarProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:outline-none"
      >
        Skip to content
      </a>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <header className="flex min-h-12 shrink-0 items-center gap-2 border-b bg-card/95 backdrop-blur px-4 pt-[env(safe-area-inset-top)]">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" className="relative h-8 w-8" asChild aria-label="Notifications">
              <Link to="/vendor/notifications">
                <Bell className="h-4 w-4" />
                <NotificationBadge />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme} aria-label="Toggle theme">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={signOut} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </header>
          <OfflineBanner />
          <main id="main-content" className="flex-1 overflow-auto pb-[env(safe-area-inset-bottom)]">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
