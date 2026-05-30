import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormData } from '@/types/eventForm';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LinensTableDecorSectionProps {
  form: UseFormReturn<FormData>;
}

const LinensTableDecorSection = ({ form }: LinensTableDecorSectionProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Linens & Table Decor</h3>
      
      {/* Linens Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Linens</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="headTableLocation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location of Head Table</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter location"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberAtHeadTable"
            render={({ field }) => (
              <FormItem>
                <FormLabel># at Head Table</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Number of people"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="headTableDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description of Head Table</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe head table setup"
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
            name="headTableColors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Head Table Colors</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guestTableColors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guest Table Colors</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="chargerPlateColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Charger Plate Color</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter color"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="napkinColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Napkin Color</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter color"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="napkinFold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Napkin Fold</FormLabel>
                <FormControl>
                  <Input
                    placeholder="If cuff, how wide?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="chiavariChairColor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chiavari Chair Color</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter color"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="chairCushions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chair Cushions</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cushion color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="black">Black</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="cakeTableColors"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cake Table Colors</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter colors"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="useSbCakeKnifeSet"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Use SB Cake Knife Set?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Table Decorations Section */}
      <div className="space-y-4">
        <h4 className="text-md font-medium">Table Decorations</h4>
        
        <FormField
          control={form.control}
          name="centerpiecesHeadTable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centerpieces on Head Table</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe centerpieces"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="mirrorsHeadTable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Mirrors on Head Table?</FormLabel>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mirrorsHeadTableShape"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mirror Shape</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter shape"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="votivesHeadTable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Votives on Head Table?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="votiveShapeColorHeadTable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shape/Color of Votive (Head Table)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter shape and color"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="centerpiecesGuestTables"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Centerpieces for Guest Tables</FormLabel>
              <FormControl>
                <Input
                  placeholder="Describe centerpieces"
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
            name="mirrorsGuestTables"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mirrors on Guest Tables (Round or Square?)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Round or Square"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="votivesGuestTables"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Votives on Guest Tables?</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="votiveShapeColorGuestTables"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shape/Color of Votive (Guest Tables)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter shape and color"
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

export default LinensTableDecorSection;