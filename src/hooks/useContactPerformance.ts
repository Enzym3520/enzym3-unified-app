import { useMemo, useState, useEffect } from 'react';
import { Contact } from '@/types/contact';

interface ContactPerformanceConfig {
  pageSize: number;
  searchDebounceMs: number;
  enableVirtualization: boolean;
}

const DEFAULT_CONFIG: ContactPerformanceConfig = {
  pageSize: 50,
  searchDebounceMs: 300,
  enableVirtualization: true
};

export const useContactPerformance = (
  contacts: Contact[],
  config: Partial<ContactPerformanceConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, finalConfig.searchDebounceMs);

    return () => clearTimeout(timer);
  }, [searchQuery, finalConfig.searchDebounceMs]);

  // Memoized filtered contacts for better performance
  const filteredContacts = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return contacts;
    
    const query = debouncedSearchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.phone?.toLowerCase().includes(query) ||
      contact.preferredVenues.some(venue => venue.toLowerCase().includes(query)) ||
      contact.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [contacts, debouncedSearchQuery]);

  // Memoized paginated results
  const paginatedContacts = useMemo(() => {
    const startIndex = (currentPage - 1) * finalConfig.pageSize;
    const endIndex = startIndex + finalConfig.pageSize;
    return filteredContacts.slice(startIndex, endIndex);
  }, [filteredContacts, currentPage, finalConfig.pageSize]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const totalContacts = contacts.length;
    const filteredCount = filteredContacts.length;
    const displayedCount = paginatedContacts.length;
    const totalPages = Math.ceil(filteredCount / finalConfig.pageSize);

    return {
      totalContacts,
      filteredCount,
      displayedCount,
      totalPages,
      currentPage,
      isFiltered: filteredCount !== totalContacts,
      loadPercentage: totalContacts > 0 ? (displayedCount / totalContacts) * 100 : 0
    };
  }, [contacts.length, filteredContacts.length, paginatedContacts.length, currentPage, finalConfig.pageSize]);

  // Contact index mapping for efficient lookups
  const contactIndex = useMemo(() => {
    const index = new Map<string, Contact>();
    contacts.forEach(contact => {
      index.set(contact.id, contact);
      index.set(contact.email.toLowerCase(), contact);
    });
    return index;
  }, [contacts]);

  // Quick contact lookup functions
  const findContactById = (id: string): Contact | undefined => {
    return contactIndex.get(id);
  };

  const findContactByEmail = (email: string): Contact | undefined => {
    return contactIndex.get(email.toLowerCase());
  };

  // Optimized tag and venue extraction
  const aggregatedData = useMemo(() => {
    const allTags = new Set<string>();
    const allVenues = new Set<string>();
    const eventTypes = new Map<string, number>();
    
    contacts.forEach(contact => {
      contact.tags.forEach(tag => allTags.add(tag));
      contact.preferredVenues.forEach(venue => allVenues.add(venue));
      contact.eventTypes.forEach(eventType => {
        eventTypes.set(eventType, (eventTypes.get(eventType) || 0) + 1);
      });
    });

    return {
      uniqueTags: Array.from(allTags).sort(),
      uniqueVenues: Array.from(allVenues).sort(),
      eventTypeDistribution: Array.from(eventTypes.entries()).sort(([,a], [,b]) => b - a)
    };
  }, [contacts]);

  return {
    // Core data
    contacts: paginatedContacts,
    allContacts: contacts,
    filteredContacts,
    
    // Search functionality
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    
    // Pagination
    currentPage,
    setCurrentPage,
    
    // Performance metrics
    performanceMetrics,
    
    // Lookup functions
    findContactById,
    findContactByEmail,
    
    // Aggregated data
    aggregatedData,
    
    // Configuration
    config: finalConfig
  };
};

export default useContactPerformance;