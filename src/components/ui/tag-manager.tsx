import React, { useState } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';
import { getTagDisplayName, TAG_CATEGORIES, getPopularTags } from '@/utils/tagHelpers';
import { Contact } from '@/types/contact';

interface TagManagerProps {
  contacts: Contact[];
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  className?: string;
}

export const TagManager = ({ contacts, selectedTags, onTagsChange, className }: TagManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const popularTags = getPopularTags(contacts, 20);
  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  const filteredTags = allTags.filter(tag => {
    const matchesSearch = tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getTagDisplayName(tag).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    
    const category = TAG_CATEGORIES.find(cat => cat.name.toLowerCase() === selectedCategory);
    const matchesCategory = category?.tags.includes(tag.toLowerCase()) || false;
    
    return matchesSearch && matchesCategory;
  });

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  const createNewTag = () => {
    if (newTag.trim() && !allTags.includes(newTag.trim())) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Tag Manager
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search and Create */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Create new tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createNewTag()}
            />
            <Button onClick={createNewTag} size="sm" disabled={!newTag.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('all')}
          >
            All Categories
          </Badge>
          {TAG_CATEGORIES.map(category => (
            <Badge
              key={category.name}
              variant={selectedCategory === category.name.toLowerCase() ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Selected Tags ({selectedTags.length}):</span>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => {
                const { variant, icon } = getSmartTagConfig(tag);
                return (
                  <EnhancedTag 
                    key={tag} 
                    variant={variant}
                    size="sm"
                    icon={icon}
                    onRemove={() => removeTag(tag)}
                  >
                    {getTagDisplayName(tag)}
                  </EnhancedTag>
                );
              })}
            </div>
          </div>
        )}

        {/* Popular Tags */}
        {searchTerm === '' && selectedCategory === 'all' && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Popular Tags:</span>
            <div className="flex flex-wrap gap-2">
              {popularTags.slice(0, 8).map(({ tag, count }) => {
                const { variant, icon } = getSmartTagConfig(tag);
                const isSelected = selectedTags.includes(tag);
                return (
                  <EnhancedTag 
                    key={tag} 
                    variant={isSelected ? variant : 'default'}
                    size="sm"
                    icon={icon}
                    interactive
                    onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
                    className={`cursor-pointer ${isSelected ? 'opacity-50' : 'hover:scale-105'}`}
                  >
                    {getTagDisplayName(tag)} ({count})
                  </EnhancedTag>
                );
              })}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div className="space-y-2">
          <span className="text-sm font-medium">
            Available Tags ({filteredTags.length}):
          </span>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {filteredTags.map(tag => {
              const { variant, icon } = getSmartTagConfig(tag);
              const isSelected = selectedTags.includes(tag);
              return (
                <EnhancedTag 
                  key={tag} 
                  variant={isSelected ? variant : 'default'}
                  size="xs"
                  icon={icon}
                  interactive
                  onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
                  className={`cursor-pointer ${isSelected ? 'opacity-50' : 'hover:scale-105'}`}
                >
                  {getTagDisplayName(tag)}
                </EnhancedTag>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};