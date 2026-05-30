import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField, FormItem, FormControl } from '@/components/ui/form';
import { formSchema } from '@/types/eventForm';
import { z } from 'zod';

type EventFormData = z.infer<typeof formSchema>;

interface MultiVendorSelectorProps {
  form: UseFormReturn<EventFormData>;
}

const vendorTypes = [
  { value: 'dj', label: 'DJ' },
  { value: 'mc', label: 'MC' },
  { value: 'photo_booth', label: 'Photo Booth' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'other', label: 'Other' },
];

interface Vendor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  vendor_type: string | null;
  vendor_types: string[] | null;
  average_rating: number | null;
}

const MultiVendorSelector: React.FC<MultiVendorSelectorProps> = ({ form }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'assignedVendors',
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['active-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, vendor_type, vendor_types, average_rating')
        .in('role', ['vendor', 'dj'])
        .eq('is_active', true)
        .order('average_rating', { ascending: false, nullsFirst: false })
        .limit(200);

      if (error) throw error;
      return data as Vendor[];
    },
  });

  const getVendorName = (vendor: Vendor) => {
    if (vendor.company_name) return vendor.company_name;
    const name = [vendor.first_name, vendor.last_name].filter(Boolean).join(' ');
    return name || 'Unknown';
  };

  const getVendorsByType = (type: string) => {
    if (!type) return vendors;
    return vendors.filter(v =>
      (v.vendor_types && v.vendor_types.includes(type)) || v.vendor_type === type
    );
  };

  const getAssignedVendorIds = () => {
    return form.watch('assignedVendors')?.map(v => v.vendorId).filter(Boolean) || [];
  };

  return (
    <div className="space-y-2">
      {fields.map((field, index) => {
        const currentType = form.watch(`assignedVendors.${index}.vendorType`);
        const availableVendors = getVendorsByType(currentType);
        const assignedIds = getAssignedVendorIds();

        return (
          <div key={field.id} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name={`assignedVendors.${index}.vendorType`}
              render={({ field: typeField }) => (
                <FormItem className="flex-1">
                  <Select
                    value={typeField.value}
                    onValueChange={(value) => {
                      typeField.onChange(value);
                      form.setValue(`assignedVendors.${index}.vendorId`, '');
                      form.setValue(`assignedVendors.${index}.vendorName`, '');
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vendorTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`assignedVendors.${index}.vendorId`}
              render={({ field: vendorField }) => (
                <FormItem className="flex-[2]">
                  <Select
                    value={vendorField.value}
                    onValueChange={(value) => {
                      vendorField.onChange(value);
                      const vendor = vendors.find(v => v.id === value);
                      if (vendor) {
                        form.setValue(`assignedVendors.${index}.vendorName`, getVendorName(vendor));
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select vendor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVendors.filter(v => !assignedIds.includes(v.id) || v.id === vendorField.value).length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No vendors available
                        </div>
                      ) : (
                        availableVendors
                          .filter(v => !assignedIds.includes(v.id) || v.id === vendorField.value)
                          .map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {getVendorName(vendor)}
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => remove(index)}
            >
              <X className="h-4 w-4" />
            </Button>

            {index === fields.length - 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => append({ vendorId: '', vendorType: '', vendorName: '' })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}

      {fields.length === 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ vendorId: '', vendorType: '', vendorName: '' })}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      )}
    </div>
  );
};

export default MultiVendorSelector;
