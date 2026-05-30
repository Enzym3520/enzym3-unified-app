import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ReminderFilters as ReminderFiltersType } from '@/types/reminder';

interface ReminderFiltersProps {
  filters: ReminderFiltersType;
  onFiltersChange: (filters: ReminderFiltersType) => void;
}

const ReminderFilters = ({ filters, onFiltersChange }: ReminderFiltersProps) => {
  const updateFilter = (key: keyof ReminderFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      type: 'all',
      priority: 'all',
      search: '',
      dateRange: {}
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts or notes..."
                className="pl-8"
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter */}
          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pre_wedding">Pre-Wedding</SelectItem>
              <SelectItem value="post_wedding">Post-Wedding</SelectItem>
              <SelectItem value="anniversary">Anniversary</SelectItem>
              <SelectItem value="business_development">Business Dev</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={filters.priority} onValueChange={(value) => updateFilter('priority', value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range - Simplified for now */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              placeholder="Start Date"
              className="w-[140px]"
              value={filters.dateRange.start || ''}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="date"
              placeholder="End Date"
              className="w-[140px]"
              value={filters.dateRange.end || ''}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
            />
          </div>

          {/* Clear Filters */}
          <Button variant="outline" onClick={clearFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderFilters;