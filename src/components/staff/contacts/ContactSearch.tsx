import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, MapPin, Tag, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Contact } from '@/types/contact';
import { Badge } from '@/components/ui/badge';

interface ContactSearchProps {
  contacts: Contact[];
  onSearchResults: (results: Contact[]) => void;
  onClearSearch: () => void;
}

interface SearchCriteria {
  query: string;
  searchIn: {
    name: boolean;
    email: boolean;
    phone: boolean;
    venue: boolean;
    tags: boolean;
  };
}

const ContactSearch = ({ contacts, onSearchResults, onClearSearch }: ContactSearchProps) => {
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    query: '',
    searchIn: {
      name: true,
      email: true,
      phone: true,
      venue: true,
      tags: true,
    }
  });
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchCriteria.query.trim()) {
      return contacts;
    }

    const query = searchCriteria.query.toLowerCase();
    return contacts.filter(contact => {
      const searchFields = [];
      
      if (searchCriteria.searchIn.name) {
        searchFields.push(contact.name.toLowerCase());
      }
      
      if (searchCriteria.searchIn.email) {
        searchFields.push(contact.email.toLowerCase());
      }
      
      if (searchCriteria.searchIn.phone && contact.phone) {
        searchFields.push(contact.phone.toLowerCase());
      }
      
      if (searchCriteria.searchIn.venue) {
        searchFields.push(...contact.preferredVenues.map(v => v.toLowerCase()));
      }
      
      if (searchCriteria.searchIn.tags) {
        searchFields.push(...contact.tags.map(t => t.toLowerCase()));
      }

      return searchFields.some(field => field.includes(query));
    });
  }, [contacts, searchCriteria]);

  const handleSearch = (query: string) => {
    setSearchCriteria(prev => ({ ...prev, query }));
    if (query.trim()) {
      onSearchResults(searchResults);
    } else {
      onClearSearch();
    }
  };

  const handleCriteriaChange = (field: keyof SearchCriteria['searchIn'], value: boolean) => {
    setSearchCriteria(prev => ({
      ...prev,
      searchIn: { ...prev.searchIn, [field]: value }
    }));
  };

  const clearSearch = () => {
    setSearchCriteria(prev => ({ ...prev, query: '' }));
    onClearSearch();
  };

  const activeCriteriaCount = Object.values(searchCriteria.searchIn).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Smart search across all contact fields..."
            value={searchCriteria.query}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10 pr-20"
          />
          {searchCriteria.query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              ×
            </Button>
          )}
        </div>

        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Search in ({activeCriteriaCount})
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-3">Search in fields:</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchCriteria.searchIn.name}
                      onChange={(e) => handleCriteriaChange('name', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Contact Names</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchCriteria.searchIn.email}
                      onChange={(e) => handleCriteriaChange('email', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Email Addresses</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchCriteria.searchIn.phone}
                      onChange={(e) => handleCriteriaChange('phone', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Phone Numbers</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchCriteria.searchIn.venue}
                      onChange={(e) => handleCriteriaChange('venue', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Venues</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={searchCriteria.searchIn.tags}
                      onChange={(e) => handleCriteriaChange('tags', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Tags</span>
                  </label>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Search Results Summary */}
      {searchCriteria.query && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Found {searchResults.length} contacts matching "{searchCriteria.query}"</span>
          {searchResults.length !== contacts.length && (
            <Badge variant="outline" className="ml-2">
              {((searchResults.length / contacts.length) * 100).toFixed(0)}% of total
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactSearch;