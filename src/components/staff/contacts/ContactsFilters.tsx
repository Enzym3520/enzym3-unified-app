import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Contact } from '@/types/contact';
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';
import { getTagDisplayName } from '@/utils/tagHelpers';

interface ContactsFiltersProps {
  filters: {
    status: string;
    eventType: string;
    search: string;
    tags: string[];
  };
  onFiltersChange: (filters: any) => void;
  contacts: Contact[];
}

const ContactsFilters = ({ filters, onFiltersChange, contacts }: ContactsFiltersProps) => {
  const availableTags = Array.from(
    new Set(contacts.flatMap(contact => contact.tags))
  ).sort();

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const addTag = (tag: string) => {
    if (!filters.tags.includes(tag)) {
      handleFilterChange('tags', [...filters.tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    handleFilterChange('tags', filters.tags.filter(t => t !== tag));
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: 'all',
      eventType: 'all',
      search: '',
      tags: []
    });
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.eventType !== 'all' || 
    filters.search !== '' || 
    filters.tags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, email, phone, or venue..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="past_client">Past Client</SelectItem>
            <SelectItem value="potential">Potential</SelectItem>
          </SelectContent>
        </Select>

        {/* Event Type Filter */}
        <Select value={filters.eventType} onValueChange={(value) => handleFilterChange('eventType', value)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="wedding">Weddings</SelectItem>
            <SelectItem value="birthday">Birthdays</SelectItem>
            <SelectItem value="quince">Quinceañeras</SelectItem>
            <SelectItem value="banquet">Banquets</SelectItem>
            <SelectItem value="graduation">Graduations</SelectItem>
            <SelectItem value="sweet16">Sweet 16s</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Tags */}
      {filters.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active tags:</span>
          {filters.tags.map(tag => {
            const { variant, icon } = getSmartTagConfig(tag);
            return (
              <EnhancedTag 
                key={tag} 
                variant={variant}
                size="xs"
                icon={icon}
                onRemove={() => removeTag(tag)}
              >
                {getTagDisplayName(tag)}
              </EnhancedTag>
            );
          })}
        </div>
      )}

      {/* Available Tags */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">Available tags:</span>
          <div className="flex flex-wrap gap-2">
            {availableTags.slice(0, 12).map(tag => {
              const { variant, icon } = getSmartTagConfig(tag);
              return (
                <EnhancedTag 
                  key={tag} 
                  variant={variant}
                  size="xs"
                  icon={icon}
                  interactive
                  onClick={() => addTag(tag)}
                  className="cursor-pointer hover:scale-105"
                >
                  {getTagDisplayName(tag)}
                </EnhancedTag>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsFilters;