import { HelpCircle, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePortalTour } from "@/contexts/PortalTourContext";
import { tourSections } from "@/config/portalTourSteps";
import { useLocation } from "react-router-dom";

export const TourButton = () => {
  const { startTour, hasCompletedTour } = usePortalTour();
  const location = useLocation();

  const getSectionFromPath = (): keyof typeof tourSections | undefined => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('vibe-sheet')) return 'vibeSheet';
    if (path.includes('upgrades')) return 'upgrades';
    if (path.includes('schedule')) return 'schedule';
    if (path.includes('uploads')) return 'uploads';
    if (path.includes('settings')) return 'settings';
    return undefined;
  };

  const currentSection = getSectionFromPath();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative landscape:h-8 landscape:w-8"
          title="Portal Tour & Help"
          data-tour="tour-button"
        >
          <HelpCircle className="h-5 w-5 landscape:h-4 landscape:w-4" />
          {!hasCompletedTour && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => startTour()}>
          <PlayCircle className="mr-2 h-4 w-4" />
          Start Full Tour
        </DropdownMenuItem>
        
        {currentSection && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => startTour(currentSection)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Tour This Page
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          Learn how to use the portal effectively
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
