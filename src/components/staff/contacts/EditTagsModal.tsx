import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Contact } from '@/types/contact';
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';
import { getTagDisplayName } from '@/utils/tagHelpers';
import { Plus } from 'lucide-react';

interface EditTagsModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactId: string, tags: string[]) => Promise<void>;
}

const EditTagsModal = ({ contact, isOpen, onClose, onSave }: EditTagsModalProps) => {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (contact) {
      setTags(contact.tags || []);
    }
  }, [contact]);

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async () => {
    if (!contact) return;

    try {
      setSaving(true);
      await onSave(contact.id, tags);
      toast({
        title: 'Tags Updated',
        description: `Successfully updated tags for ${contact.name}`,
      });
      onClose();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating tags:', error);
      toast({
        title: 'Error',
        description: 'Failed to update tags. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (!contact) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Tags for {contact.name}</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Current Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Tags:</label>
            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border rounded-md">
              {tags.length === 0 ? (
                <span className="text-muted-foreground text-sm">No tags assigned</span>
              ) : (
                tags.map(tag => {
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
                })
              )}
            </div>
          </div>

          {/* Add New Tag */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add New Tag:</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm" disabled={!newTag.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditTagsModal;