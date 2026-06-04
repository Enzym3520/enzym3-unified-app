import React from 'react';
import logoRed from '@/assets/logo-red.png';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Home, FileText, History, Users, X, Calendar, Ban, User, Package, Bell, BarChart3, Shield, MessageSquare, Settings, Video, Download, Sparkles } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserRole } from '@/hooks/useUserRole';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentPath = location.pathname;
  const currentTab = searchParams.get('tab');
  const isMobile = useIsMobile();
  const { isAdmin, isSuperAdmin, isModerator, isVendor, isLoading: rolesLoading } = useUserRole();
  const { canInstall, promptInstall, isInstalled } = useInstallPrompt();

  const isActive = (url: string) => {
    const [path] = url.split('?');
    if (path === '/') return currentPath === '/';
    if (path === '/staff/comprehensive-form') return currentPath.startsWith('/staff/comprehensive-form');
    if (path === '/staff/event-notification/step-1') return currentPath.startsWith('/staff/event-notification');
    return currentPath === path;
  };

  const navigationItems = [
    ...(isAdmin ? [
      { title: 'Admin Dashboard', url: '/staff/admin-dashboard', icon: Shield },
    ] : []),

    [
      { title: 'Home', url: '/staff/coordinator-dashboard', icon: Home },
      { title: 'Event Notification', url: '/staff/event-notification/step-1', icon: FileText },
      { title: 'Notification History', url: '/staff/notification-history', icon: History },
      { title: 'Details Forms', url: '/staff/comprehensive-form', icon: FileText },
      { title: 'Contacts', url: '/staff/contacts', icon: Users },
      { title: 'Calendar', url: '/staff/calendar', icon: Calendar },
      { title: 'Messages', url: '/staff/messages', icon: MessageSquare },
      { title: 'Reminders', url: '/staff/reminders', icon: Bell },
      { title: 'Submissions', url: '/staff/submissions', icon: Package },
      { title: 'Upgrades', url: '/staff/upgrades', icon: Sparkles },
      ...(isSuperAdmin ? [{ title: 'Reporting', url: '/staff/reporting', icon: BarChart3 }] : []),
    ],

    ...(isAdmin || isModerator ? [
      { title: 'Vendor Management', url: '/staff/vendor-management', icon: Users },
      { title: 'Vendor Invites', url: '/staff/vendor-invites', icon: Users },
    ] : []),

    { title: 'Settings', url: '/staff/settings', icon: Settings },
  ].flat();

  const getNavClassName = (url: string) => {
    return isActive(url)
      ? 'bg-accent text-accent-foreground font-medium shadow-sm'
      : 'hover:bg-accent/50 text-foreground/80 hover:text-foreground';
  };

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-border bg-background">
      <SidebarHeader className="border-b border-border bg-background pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between h-16 md:h-20 px-4">
          <img
            src={logoRed}
            alt="Enzym3 Entertainment"
            className="h-10 md:h-16 w-auto max-w-full object-scale-down"
          />
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
              className="md:hidden"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-background">
        <SidebarGroup className="bg-background px-2">
          <SidebarGroupContent className="bg-background">
            <SidebarMenu className="space-y-1">
              {navigationItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`${getNavClassName(item.url)} w-full justify-start py-3 px-4 text-base md:text-sm rounded-lg transition-all duration-200`}
                  >
                    <NavLink to={item.url} onClick={handleNavClick}>
                      <item.icon className="w-5 h-5 md:w-4 md:h-4 mr-3" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {canInstall && !isInstalled && (
          <SidebarGroup className="bg-background px-2 mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={promptInstall}
                    className="w-full justify-start py-3 px-4 text-base md:text-sm rounded-lg transition-all duration-200 hover:bg-accent/50 text-foreground/80 hover:text-foreground"
                  >
                    <Download className="w-5 h-5 md:w-4 md:h-4 mr-3" />
                    <span className="font-medium">Install App</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
