import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, DriveStep, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { getTourSteps, getTourSections, TourStep } from '@/config/portalTourSteps';
import { supabase } from '@/integrations/supabase/client';
import { resolveClientEvent } from '@/lib/resolveClientEvent';
import { auditAllVisibleSteps } from '@/lib/tourAudit';

interface PortalTourContextType {
  startTour: (section?: string) => void;
  stopTour: () => void;
  isTourActive: boolean;
  hasCompletedTour: boolean;
  markTourComplete: () => void;
  resetTour: () => void;
  eventType: string | undefined;
}

const PortalTourContext = createContext<PortalTourContextType | undefined>(undefined);

// Helper to wait for an element to appear in the DOM
const waitForElement = (selector: string, timeout: number = 3000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, timeout);
  });
};

export const PortalTourProvider = ({ children }: { children: ReactNode }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [eventType, setEventType] = useState<string | undefined>(undefined);
  const navigate = useNavigate();
  const driverRef = useRef<Driver | null>(null);
  const currentStepsRef = useRef<TourStep[]>([]);
  const isNavigatingRef = useRef(false);

  // Load tour completion status and event type from database
  useEffect(() => {
    const loadTourStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tour_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        setHasCompletedTour(profile.tour_completed || false);
      }

      // Fetch the user's event type for dynamic tour copy
      const userEmail = user.email;
      let eventTypeResult: string | null = null;

      if (userEmail) {
        const eventResult = await resolveClientEvent(
          user.id,
          userEmail,
          'event_type'
        );
        eventTypeResult = eventResult?.event_type ?? null;
      }

      if (eventTypeResult) {
        setEventType(eventTypeResult);
      }
    };

    loadTourStatus();
  }, []);

  const markTourComplete = useCallback(async () => {
    setHasCompletedTour(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ tour_completed: true })
        .eq('id', user.id);
    }
  }, []);

  const stopTour = useCallback(() => {
    if (driverRef.current) {
      driverRef.current.destroy();
      driverRef.current = null;
    }
    setIsTourActive(false);
    isNavigatingRef.current = false;
  }, []);

  const startTour = useCallback((section?: string) => {
    // Clean up any existing tour
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const sections = getTourSections(eventType);
    let steps: TourStep[] = getTourSteps(eventType);

    if (section && sections[section as keyof typeof sections]) {
      steps = sections[section as keyof typeof sections];
    }

    currentStepsRef.current = steps;

    // Dev-only: warn about missing data-tour elements on the current page
    if (import.meta.env.DEV) {
      const missing = auditAllVisibleSteps(steps);
      if (missing.length > 0) {
        console.warn(
          `[Tour Audit] ${missing.length} missing element(s) before tour start:\n` +
          missing.map(s => `  ⚠ ${s}`).join('\n')
        );
      }
    }

    // Create driver instance with navigation handling
    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Done! 🎉',
      showButtons: ['next', 'previous', 'close'],
      popoverClass: 'portal-tour-popover',
      overlayOpacity: 0.5,
      stagePadding: 10,
      stageRadius: 8,
      animate: true,
      allowClose: true,
      onHighlightStarted: async (_element, _step) => {
        // Get the current step index
        const currentIndex = driverObj.getActiveIndex() || 0;
        const tourStep = currentStepsRef.current[currentIndex];
        
        // Check if we need to navigate to a different route
        const currentPath = window.location.pathname;
        if (tourStep?.route && currentPath !== tourStep.route && !isNavigatingRef.current) {
          isNavigatingRef.current = true;
          
          // Navigate to the correct page
          navigate(tourStep.route);
          
          // Wait for the page to load
          await new Promise(resolve => setTimeout(resolve, 300));
          
          isNavigatingRef.current = false;
        }
        
        // Handle tab switching if the step requires it
        if (tourStep?.tab) {
          const tabTrigger = document.querySelector(
            `[role="tablist"] [data-value="${tourStep.tab}"], button[value="${tourStep.tab}"]`
          );
          if (tabTrigger && tabTrigger instanceof HTMLElement) {
            tabTrigger.click();
            // Wait for tab content to render
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        // Wait for the target element to appear
        if (tourStep?.element) {
          const selector = tourStep.element as string;
          await waitForElement(selector, 3000);
          
          // Small delay to ensure React has finished rendering
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Scroll element into view
          const targetElement = document.querySelector(selector);
          if (targetElement) {
            targetElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // Small delay after scroll to let it settle
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      },
      onDestroyed: () => {
        setIsTourActive(false);
        isNavigatingRef.current = false;
      },
      onDestroyStarted: () => {
        const activeIndex = driverObj.getActiveIndex();
        if (activeIndex !== undefined && activeIndex === currentStepsRef.current.length - 1) {
          markTourComplete();
        }
        setIsTourActive(false);
        driverObj.destroy();
      },
    });

    driverRef.current = driverObj;

    // Convert TourStep[] to DriveStep[] (remove route property for driver.js)
    const driveSteps: DriveStep[] = steps.map(({ route, ...step }) => step);
    
    driverObj.setSteps(driveSteps);
    
    // Navigate to the first step's route if needed
    const firstStep = steps[0];
    if (firstStep?.route && window.location.pathname !== firstStep.route) {
      navigate(firstStep.route);
      // Wait for navigation before starting
      setTimeout(() => {
        driverObj.drive();
        setIsTourActive(true);
      }, 300);
    } else {
      driverObj.drive();
      setIsTourActive(true);
    }
  }, [navigate, markTourComplete, eventType]);

  const resetTour = useCallback(async () => {
    setHasCompletedTour(false);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ tour_completed: false })
        .eq('id', user.id);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  return (
    <PortalTourContext.Provider
      value={{
        startTour,
        stopTour,
        isTourActive,
        hasCompletedTour,
        markTourComplete,
        resetTour,
        eventType,
      }}
    >
      {children}
    </PortalTourContext.Provider>
  );
};

export const usePortalTour = () => {
  const context = useContext(PortalTourContext);
  if (context === undefined) {
    throw new Error('usePortalTour must be used within a PortalTourProvider');
  }
  return context;
};
