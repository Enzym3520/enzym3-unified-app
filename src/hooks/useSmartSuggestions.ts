import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PACKAGE_TYPE_OPTIONS } from '@/config/packageTypes';

interface SmartSuggestions {
  venues: string[];
  coordinators: string[];
  vendorNames: string[];
  packageTypes: string[];
}

export const useSmartSuggestions = () => {
  const [suggestions, setSuggestions] = useState<SmartSuggestions>({
    venues: [],
    coordinators: [],
    vendorNames: [],
    packageTypes: PACKAGE_TYPE_OPTIONS.map(option => option.label)
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);

        // Fetch unique venues, coordinators, and vendor names from event notifications
        const { data: notifications, error } = await supabase
          .from('event_notification_history')
          .select('venue, coordinator_name, dj_name')
          .limit(2000);

        if (!error && notifications) {
          const venues = Array.from(new Set(
            notifications
              .map(n => n.venue)
              .filter(Boolean)
              .sort()
          )) as string[];

          const coordinators = Array.from(new Set(
            notifications
              .map(n => n.coordinator_name)
              .filter(Boolean)
              .sort()
          )) as string[];

          const vendorNames = Array.from(new Set(
            notifications
              .map(n => n.dj_name)
              .filter(Boolean)
              .sort()
          )) as string[];

          setSuggestions(prev => ({
            ...prev,
            venues,
            coordinators,
            vendorNames
          }));
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  return { suggestions, loading };
};