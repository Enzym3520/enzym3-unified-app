import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MusicEntertainmentSectionProps {
  form: UseFormReturn<FormData>;
}

const MusicEntertainmentSection = ({ form }: MusicEntertainmentSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Music & Entertainment</h3>
      
      <FormField
        control={form.control}
        name="specialSongs"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Special Song Requests / Must Plays</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any special songs or must-play requests"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="doNotPlayList"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Do Not Play List</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List any songs or genres to avoid"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="musicGenrePreferences"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Music Genre Preferences</FormLabel>
            <FormControl>
              <Textarea
                placeholder="List preferred music genres (e.g., Pop, Rock, Latin, R&B, etc.)"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="microphoneNeeds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Microphone Requirements</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select microphone needs" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="handheld">Handheld Microphone</SelectItem>
                  <SelectItem value="lapel">Lapel/Clip-on Microphone</SelectItem>
                  <SelectItem value="headset">Headset Microphone</SelectItem>
                  <SelectItem value="multiple">Multiple Microphones</SelectItem>
                  <SelectItem value="none">No Microphone Needed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="announcements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Announcements</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="List any special announcements needed during the event"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default MusicEntertainmentSection;