import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Image, Music, Star, Type } from 'lucide-react';
import { Section } from './blockTypes';
import { useState } from 'react';

interface BlockPickerProps {
  existingSections: Section[];
  onAdd: (section: Section) => void;
}

const BLOCK_OPTIONS: { type: Section['type']; label: string; icon: any; singleton?: boolean }[] = [
  { type: 'gallery', label: 'Gallery', icon: Image, singleton: true },
  { type: 'services', label: 'Services', icon: Music, singleton: true },
  { type: 'reviews', label: 'Reviews', icon: Star, singleton: true },
  { type: 'custom', label: 'Custom Section', icon: Type },
];

export function BlockPicker({ existingSections, onAdd }: BlockPickerProps) {
  const [open, setOpen] = useState(false);
  const existingTypes = new Set(existingSections.map(s => s.type));

  const available = BLOCK_OPTIONS.filter(opt => {
    if (opt.singleton && existingTypes.has(opt.type)) return false;
    return true;
  });

  const handleAdd = (type: Section['type']) => {
    let section: Section;
    switch (type) {
      case 'gallery': section = { type: 'gallery', photos: [] }; break;
      case 'services': section = { type: 'services' }; break;
      case 'reviews': section = { type: 'reviews' }; break;
      case 'custom': section = { type: 'custom', title: '', body: '' }; break;
      default: return;
    }
    onAdd(section);
    setOpen(false);
  };

  if (available.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs border-dashed">
          <Plus className="h-3.5 w-3.5" /> Add Block
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="center">
        {available.map(opt => (
          <button
            key={opt.type + (opt.singleton ? '' : '-multi')}
            onClick={() => handleAdd(opt.type)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
          >
            <opt.icon className="h-4 w-4 text-muted-foreground" />
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
