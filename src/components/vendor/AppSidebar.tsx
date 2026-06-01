import logoRed from '@/assets/logo-red.png';
import {
  LayoutDashboard, Calendar, Users, MessageSquare, CalendarOff,
  Package, DollarSign, FileText, Globe, UserCircle, Bell, Briefcase,
  Inbox, History, Moon, Sun, Mail, PlusCircle, FileSignature,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { NavLink } from "@/components/vendor/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarSeparator, useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

const mainItems = [
  { title: "Dashboard", url: "/vendor/dashboard", icon: LayoutDashboard },
  { title: "Calendar", url: "/vendor/calendar", icon: Calendar },
  { title: "Meetings", url: "/vendor/meetings", icon: Users },
  { title: "Messages", url: "/vendor/messages", icon: MessageSquare },
];

const manageItems = [
  { title: "Availability", url: "/vendor/availability", icon: CalendarOff },
  { title: "Services", url: "/vendor/services", icon: Package },
  { title: "Earnings", url: "/vendor/earnings", icon: DollarSign },
  { title: "Documents", url: "/vendor/documents", icon: FileText },
  { title: "My Page", url: "/vendor/my-page", icon: Globe },
  { title: "My Clients", url: "/vendor/clients", icon: Briefcase },
  { title: "Bookings", url: "/vendor/booking-requests", icon: Inbox },
  { title: "New Booking", url: "/vendor/new-booking", icon: PlusCircle },
  { title: "Email Template", url: "/vendor/email-template", icon: Mail },
  { title: "Event History", url: "/vendor/event-history", icon: History },
  { title: "Contracts", url: "/vendor/contracts", icon: FileSignature },
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();

  const closeMobileSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isActive = (path: string) =>
    path === "/vendor/dashboard"
      ? location.pathname === "/vendor/dashboard" || location.pathname === "/vendor"
      : location.pathname.startsWith(path);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // signOut is referenced but not used in sidebar UI; it's available via useAuth for future use
  void signOut;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-2 pt-[env(safe-area-inset-top)]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src={logoRed} alt="Enzym3 Entertainment" className="h-12 w-auto" />
            <span className="font-display text-lg font-semibold">Vendor</span>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <img src={logoRed} alt="E3E" className="h-10 w-auto" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} onClick={closeMobileSidebar}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                    <NavLink to={item.url} onClick={closeMobileSidebar}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/vendor/notifications")} tooltip="Notifications">
              <NavLink to="/vendor/notifications" onClick={closeMobileSidebar}>
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/vendor/profile")} tooltip="Profile">
              <NavLink to="/vendor/profile" onClick={closeMobileSidebar}>
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[9px] bg-primary/10 text-primary"><UserCircle className="h-3 w-3" /></AvatarFallback>
                </Avatar>
                <span>Profile</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip="Toggle Theme" aria-label="Toggle theme">
              <Sun className="h-4 w-4 dark:hidden" />
              <Moon className="hidden h-4 w-4 dark:block" />
              <span>Toggle Theme</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
