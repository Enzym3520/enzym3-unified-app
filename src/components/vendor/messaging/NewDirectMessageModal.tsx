import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NewDirectMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (userId: string, userName: string) => void;
}

export const NewDirectMessageModal = ({ open, onOpenChange, onSelectUser }: NewDirectMessageModalProps) => {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['profiles-for-dm'],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, role')
        .neq('id', user.id)
        .order('first_name');
      if (error) throw error;
      return (data || []).map(p => ({
        id: p.id,
        name: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.company_name || 'Unknown',
        role: p.role,
      }));
    },
    enabled: open,
  });

  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()));

  const getRoleBadge = (role: string | null) => {
    if (!role) return null;
    const label = role === 'dj' ? 'DJ' : role.charAt(0).toUpperCase() + role.slice(1);
    return <Badge variant="outline" className="text-xs">{label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No contacts found</p>
          ) : (
            <div className="space-y-1">
              {filtered.map(u => (
                <button
                  key={u.id}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  onClick={() => { onSelectUser(u.id, u.name); onOpenChange(false); setSearch(''); }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                  </div>
                  {getRoleBadge(u.role)}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
