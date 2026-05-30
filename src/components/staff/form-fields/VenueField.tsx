import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, MapPin, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const HARDCODED_VENUES: Record<string, string> = {
  "Saguaro Buttes": "SB",
  "The Barn at Tanque Verde": "BTV",
  "Stillwell House": "STW",
  "Stardance Event Center": "SDE",
  "Reflections at the Buttes": "RAB",
  "The Rubi House": "RUB",
  "Tanque Verde Ranch": "TVR",
  "La Mariposa Resort": "LMR",
  "The Z Mansion": "ZMS",
  "The Westin La Paloma": "WLP",
  "Loews Ventana Canyon": "LVC",
  "Hacienda del Sol": "HDS",
  "Oasis at Wild Horse Ranch": "OWH",
  "Tubac Golf Resort": "TGR",
  "JW Marriott Starr Pass": "JWM",
  "The Gallery Golf Club": "GGC",
  "The Highlands at Dove Mtn": "HDM"
};

interface VenueFieldProps {
  form: UseFormReturn<FormData>;
}

const VenueField = ({ form }: VenueFieldProps) => {
  const [venues, setVenues] = useState<Record<string, string>>({ ...HARDCODED_VENUES });
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueCode, setNewVenueCode] = useState('');
  const [newVenueDressCode, setNewVenueDressCode] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { suggestions: smartSuggestions } = useSmartSuggestions();

  // Address autocomplete as user types in the address field
  useEffect(() => {
    if (newVenueAddress.trim().length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLookingUp(true);
      try {
        const q = encodeURIComponent(newVenueAddress.trim());
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&countrycodes=us`,
          { signal: controller.signal, headers: { 'Accept': 'application/json' } }
        );
        const data = await res.json();
        const suggestions = (data || []).map((item: any) => item.display_name).filter(Boolean);
        setAddressSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (e: any) {
        if (e.name !== 'AbortError' && import.meta.env.DEV) console.error('Address lookup failed', e);
      } finally {
        setLookingUp(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [newVenueAddress]);

  // Load custom venues from database on mount
  useEffect(() => {
    const fetchCustomVenues = async () => {
      const { data, error } = await supabase
        .from('custom_venues')
        .select('name, code')
        .limit(200);

      if (!error && data) {
        setVenues(prev => {
          const merged = { ...prev };
          data.forEach((v) => {
            merged[v.name] = v.code;
          });
          return merged;
        });
      }
    };
    fetchCustomVenues();
  }, []);

  const combinedVenues = Array.from(new Set([
    ...Object.keys(venues),
    ...smartSuggestions.venues,
  ]));

  const handleAddVenue = async () => {
    const name = newVenueName.trim();
    const code = newVenueCode.trim().toUpperCase();
    if (!name || !code) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('custom_venues').insert({
        name,
        code,
        address: newVenueAddress.trim() || null,
        dress_code: newVenueDressCode.trim() || null,
        created_by: user?.id,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('A venue with that name already exists');
        } else {
          toast.error('Failed to save venue');
        }
        return;
      }

      setVenues(prev => ({ ...prev, [name]: code }));
      form.setValue('venue', name);
      form.setValue('venueCode', code);
      form.setValue('dressCode', newVenueDressCode);
      form.setValue('address', newVenueAddress);
      setNewVenueName('');
      setNewVenueCode('');
      setNewVenueDressCode('');
      setNewVenueAddress('');
      setShowAddVenue(false);
      toast.success('Venue saved');
    } finally {
      setSaving(false);
    }
  };

  const selectedVenue = form.watch('venue');
  const selectedVenueCode = selectedVenue && venues[selectedVenue] ? venues[selectedVenue] : null;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="venue"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              Venue
              {selectedVenueCode && (
                <Badge variant="secondary" className="text-xs">
                  {selectedVenueCode}
                </Badge>
              )}
            </FormLabel>
            <FormControl>
                <div className="relative">
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue('venueCode', venues[value] || '');
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select a venue" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background">
                      {combinedVenues.map((name) => (
                        <SelectItem key={name} value={name}>
                          <div className="flex items-center justify-between w-full">
                            <span>{name}</span>
                            {venues[name] && (
                              <Badge variant="outline" className="ml-2 text-xs">{venues[name]}</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {!showAddVenue ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowAddVenue(true)}
          className="flex items-center gap-2 text-primary border-primary/20 hover:bg-primary/5"
        >
          <Plus className="w-4 h-4" />
          Add New Venue
        </Button>
      ) : (
        <div className="border border-border/40 rounded-lg p-4 bg-muted/30 space-y-3">
          <h4 className="font-medium text-foreground text-sm">Add New Venue</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Venue Name</label>
              <Input
                placeholder="Enter venue name"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                className="h-10 border-border/60 focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Venue Code</label>
              <Input
                placeholder="Enter 3-4 letter code"
                value={newVenueCode}
                onChange={(e) => setNewVenueCode(e.target.value.toUpperCase())}
                maxLength={4}
                className="h-10 border-border/60 focus:border-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Venue Address</label>
            <div className="relative">
              <Input
                placeholder="Start typing an address…"
                value={newVenueAddress}
                onChange={(e) => setNewVenueAddress(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="h-10 border-border/60 focus:border-primary/40 pr-8"
              />
              {lookingUp && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground absolute right-2 top-3" />
              )}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setNewVenueAddress(suggestion);
                        setAddressSuggestions([]);
                        setShowSuggestions(false);
                      }}
                    >
                      <MapPin className="w-3 h-3 inline-block mr-2 text-muted-foreground" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Default Dress Code</label>
            <Input
              placeholder="e.g. Semi-Formal, Casual"
              value={newVenueDressCode}
              onChange={(e) => setNewVenueDressCode(e.target.value)}
              className="h-10 border-border/60 focus:border-primary/40"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddVenue}
              disabled={!newVenueName.trim() || !newVenueCode.trim() || saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              Add Venue
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAddVenue(false);
                setNewVenueName('');
                setNewVenueCode('');
                setNewVenueDressCode('');
                setNewVenueAddress('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueField;
