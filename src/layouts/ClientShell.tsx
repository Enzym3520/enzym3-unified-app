import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import logoBlue from "@/assets/logo-blue.png";
import {
  LayoutDashboard,
  Music,
  Sparkles,
  Calendar,
  Upload,
  Settings,
  LogOut,
  ShoppingCart,
  Keyboard,
  PanelLeft,
  MessageCircle,
  Star,
  Video,
  Lock,
  FileText,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardShortcutsContext } from "@/contexts/KeyboardShortcutsContext";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { TourButton } from "@/components/TourButton";
import { TourWelcomeDialog } from "@/components/TourWelcomeDialog";
import { PortalGate } from "@/components/client/PortalGate";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

export function ClientShell() {
  // Portal class management — must be first useEffect
  useEffect(() => {
    document.documentElement.classList.remove('portal-client', 'portal-staff', 'portal-vendor');
    document.documentElement.classList.add('portal-client');
    return () => document.documentElement.classList.remove('portal-client');
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { cart, setCartOpen, cartOpen } = useCart();
  const { isLocked } = usePaymentStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setHelpModalOpen, registerShortcuts, unregisterShortcuts } = useKeyboardShortcutsContext();
  const isMobile = useIsMobile();
  const { unreadCount, markAllRead } = useNotifications();

  const handleSidebarToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarOpen(!sidebarOpen);
    }
  };


  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard, shortcut: ['g', 'd'] },
    { path: '/app/vibe-sheet', label: 'Vibe Sheet', icon: Music, shortcut: ['g', 'v'] },
    { path: '/app/contract', label: 'Contract', icon: FileText, shortcut: ['g', 'c'] },
    { path: '/app/upgrades', label: 'Upgrades', icon: Sparkles, shortcut: ['g', 'u'] },
    { path: '/app/schedule', label: 'Schedule', icon: Calendar, shortcut: ['g', 's'] },
    { path: '/app/meeting', label: 'Meeting Room', icon: Video, shortcut: ['g', 'j'] },
    { path: '/app/uploads', label: 'Uploads', icon: Upload, shortcut: ['g', 'l'] },
    { path: '/app/messages', label: 'Messages', icon: MessageCircle, shortcut: ['g', 'm'] },
    { path: '/app/review', label: 'Review', icon: Star, shortcut: ['g', 'r'] },
    { path: '/app/settings', label: 'Settings', icon: Settings, shortcut: ['g', 't'] },
  ];

  const isItemLocked = (path: string) => isLocked && path !== '/app/contract';

  const handleLockedClick = () => {
    toast.error("Complete your contract & deposit to unlock the portal");
    navigate('/app/contract');
  };

  // Register global keyboard shortcuts
  useEffect(() => {
    const shortcuts = [
      {
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        description: 'Toggle cart',
        category: 'global' as const,
        disabled: isLocked,
        action: () => {
          setCartOpen(!cartOpen);
          toast.success(cartOpen ? 'Cart closed' : 'Cart opened');
        },
      },
      {
        key: '/',
        ctrlKey: true,
        metaKey: true,
        description: 'Show keyboard shortcuts',
        category: 'global' as const,
        disabled: isLocked,
        action: () => setHelpModalOpen(true),
      },
      {
        key: '?',
        description: 'Show keyboard shortcuts',
        category: 'global' as const,
        disabled: isLocked,
        action: () => setHelpModalOpen(true),
      },
      {
        key: 'Escape',
        description: 'Close dialogs/cart',
        category: 'global' as const,
        action: () => {
          if (cartOpen) setCartOpen(false);
          if (mobileMenuOpen) setMobileMenuOpen(false);
        },
      },
      {
        key: 'b',
        ctrlKey: true,
        metaKey: true,
        description: 'Toggle sidebar',
        category: 'global' as const,
        action: () => setSidebarOpen(!sidebarOpen),
      },
      // Navigation shortcuts
      ...navItems.map(item => ({
        key: item.shortcut[1],
        sequence: item.shortcut,
        description: `Go to ${item.label}`,
        category: 'navigation' as const,
        disabled: isItemLocked(item.path),
        action: () => {
          if (isItemLocked(item.path)) {
            handleLockedClick();
            return;
          }
          navigate(item.path);
          toast.success(`Navigated to ${item.label}`);
        },
      })),
    ];

    registerShortcuts(shortcuts);

    return () => {
      unregisterShortcuts(shortcuts);
    };
    // navItems is static and handleLockedClick/isItemLocked are derived; the effect
    // re-registers on the state that actually matters (isLocked, panel toggles).
    // Adding the inline fns/array would re-register shortcuts on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, setCartOpen, cartOpen, setHelpModalOpen, mobileMenuOpen, sidebarOpen, registerShortcuts, unregisterShortcuts, isLocked]);

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    const locked = isItemLocked(item.path);

    return (
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start relative",
          isActive && "bg-primary/10 text-primary hover:bg-primary/20",
          locked && "opacity-40 blur-[1px] pointer-events-none select-none"
        )}
        onClick={() => {
          if (locked) {
            handleLockedClick();
            return;
          }
          navigate(item.path);
          setMobileMenuOpen(false);
        }}
        disabled={locked}
      >
        <Icon className="mr-2 h-4 w-4" />
        {item.label}
        {locked && <Lock className="ml-auto h-3 w-3 opacity-60" />}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-[200] border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-[env(safe-area-inset-top)]">
        <div className="px-4 h-16 landscape:h-12 flex items-center justify-between w-full 2xl:max-w-screen-2xl 2xl:mx-auto">
          <div className="flex items-center gap-2">
            {/* Sidebar Toggle - Always visible */}
            <Button
              variant="ghost"
              size="icon"
              className="landscape:h-8 landscape:w-8"
              onClick={handleSidebarToggle}
              title="Toggle sidebar (⌘B)"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>

            <img
              src={logoBlue}
              alt="Enzym3 Entertainment"
              className="h-16 landscape:h-10 object-contain cursor-pointer transition-transform duration-200 hover:scale-105"
              onClick={() => navigate(isLocked ? '/app/contract' : '/app/dashboard')}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Tour Button - hidden when locked */}
            {!isLocked && <TourButton />}

            {/* Notification Bell */}
            {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="relative landscape:h-8 landscape:w-8"
                onClick={markAllRead}
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Keyboard Shortcuts Button - hidden when locked */}
            {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="landscape:h-8 landscape:w-8"
                onClick={() => setHelpModalOpen(true)}
                title="Keyboard shortcuts (?)"
                data-tour="keyboard-shortcuts" /* Tour step: portalTourSteps.ts — "Keyboard Shortcuts" */
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            )}

            {/* Cart Icon - hidden when locked */}
            {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="relative landscape:h-8 landscape:w-8"
                onClick={() => setCartOpen(true)}
                title="Open cart (⌘K)"
                data-tour="cart-icon" /* Tour step: portalTourSteps.ts — "View Your Cart" */
              >
                <ShoppingCart className="h-5 w-5 landscape:h-4 landscape:w-4" />
                {cart.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {cart.length}
                  </Badge>
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="landscape:h-8 landscape:py-0 landscape:text-sm"
            >
              <LogOut className="mr-2 h-4 w-4 landscape:h-3 landscape:w-3" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - Controlled by sidebarOpen state */}
        <aside className={cn(
          "flex-shrink-0 border-r bg-card/50 transition-all duration-300 overflow-hidden hidden sm:block",
          sidebarOpen ? "sm:w-48 md:w-56 lg:w-64" : "w-0"
        )}>
          <nav className="sticky top-[calc(4rem+env(safe-area-inset-top))] landscape:top-[calc(3rem+env(safe-area-inset-top))] p-4 space-y-1 min-w-48 md:min-w-56 lg:min-w-64">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[300] sm:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="absolute inset-y-0 left-0 w-64 bg-card border-r shadow-xl animate-in slide-in-from-left duration-300">
              <div className="flex items-center h-16 px-4 border-b">
                <img
                  src={logoBlue}
                  alt="Enzym3 Entertainment"
                  className="h-12 object-contain"
                />
              </div>
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-(4rem+env(safe-area-inset-top)))] landscape:min-h-[calc(100vh-(3rem+env(safe-area-inset-top)))] p-4 md:p-6 lg:p-8">
          <PortalGate>
            <Outlet />
          </PortalGate>
        </main>
      </div>

      <KeyboardShortcutsHelp />
      <TourWelcomeDialog />
    </div>
  );
}
