import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/staff/AppSidebar';
import { ThemeToggle } from '@/components/staff/ThemeToggle';
import { NotificationBell } from '@/components/staff/notifications/NotificationBell';
import { useIsMobile } from '@/hooks/use-mobile';

import { LogOut, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUserRole } from '@/hooks/useUserRole';
import { FeedbackButton } from '@/components/staff/feedback/FeedbackButton';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export function StaffShell() {
  useEffect(() => {
    document.documentElement.classList.remove('portal-client', 'portal-staff', 'portal-vendor');
    document.documentElement.classList.add('portal-staff');
    return () => document.documentElement.classList.remove('portal-staff');
  }, []);

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { isSupported } = usePushNotifications();
  const { isAdmin, isVendor } = useUserRole();
  const queryClient = useQueryClient();
  const isVendorRoute = location.pathname.startsWith('/staff/vendor');

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      navigate('/login');
      toast({ title: 'Logged out successfully' });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen min-h-[100dvh] md:min-h-screen h-[100dvh] md:h-auto flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-background">
          <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 pt-[env(safe-area-inset-top)]">
            <div className="px-2 md:px-6 h-16 landscape:h-12 flex items-center justify-between w-full">
              <div className="flex items-center gap-1 md:gap-3 min-w-0 flex-1">
                <SidebarTrigger className="-ml-1 hover:bg-accent/50 transition-colors" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Replay Tour"
                   onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { error } = await supabase.from('profiles').update({ tour_version: 0 }).eq('id', user.id);
                    if (error) {
                      toast({ title: 'Failed to reset tour', variant: 'destructive' });
                      return;
                    }
                    queryClient.invalidateQueries({ queryKey: ['vendor-profile-tour'] });
                    queryClient.invalidateQueries({ queryKey: ['coordinator-tour-version'] });
                    const dest = '/staff/coordinator-dashboard';
                    navigate(dest);
                    toast({ title: 'Tour will replay now' });
                  }}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <ThemeToggle />
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          <main className="flex-1 min-h-0 overflow-auto overflow-x-hidden bg-background px-2 md:px-6 py-2 md:py-6 pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-7xl mx-auto w-full min-w-0">
              <Outlet />
            </div>
          </main>
          <FeedbackButton />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
