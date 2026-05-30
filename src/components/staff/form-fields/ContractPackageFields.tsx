import React, { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FormData } from '@/types/eventForm';
import { usePackageTypes, usePricingDefaults } from '@/hooks/useAppConfig';
import { DollarSign, Clock, Receipt, FileText } from 'lucide-react';

interface ContractPackageFieldsProps {
  form: UseFormReturn<FormData>;
}

const ContractPackageFields = ({ form }: ContractPackageFieldsProps) => {
  const { options: packageOptions } = usePackageTypes();
  const { depositPercentage } = usePricingDefaults();
  const depositFraction = depositPercentage / 100;
  const bookingSource = form.watch('bookingSource');
  const pricingType = form.watch('pricingType');
  const hoursBooked = form.watch('hoursBooked');
  const hourlyRate = form.watch('hourlyRate');
  const totalPrice = form.watch('totalPrice');
  
  const isIndependent = bookingSource === 'independent';
  const isFlatRate = pricingType === 'flat_rate';

  // Set default pricing type when independent is selected
  useEffect(() => {
    if (isIndependent && !pricingType) {
      form.setValue('pricingType', 'hourly');
    }
  }, [isIndependent, pricingType, form]);

  // Auto-calculate total and deposit for hourly pricing
  useEffect(() => {
    if (isIndependent && !isFlatRate && hoursBooked && hourlyRate) {
      const total = hoursBooked * hourlyRate;
      const deposit = total * depositFraction;
      form.setValue('totalPrice', total);
      form.setValue('depositAmount', deposit);
    }
  }, [hoursBooked, hourlyRate, isIndependent, isFlatRate, form, depositFraction]);

  // Auto-calculate deposit for flat rate pricing
  useEffect(() => {
    if (isIndependent && isFlatRate && totalPrice) {
      const deposit = totalPrice * depositFraction;
      form.setValue('depositAmount', deposit);
    }
  }, [totalPrice, isIndependent, isFlatRate, form, depositFraction]);

  // Clear irrelevant fields when switching pricing type
  useEffect(() => {
    if (isFlatRate) {
      form.setValue('hoursBooked', undefined);
      form.setValue('hourlyRate', undefined);
    }
  }, [isFlatRate, form]);

  if (isIndependent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Contract & Pricing</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          For independent gigs, contract & payment details will be included in the client's welcome email.
        </p>

        {/* Pricing Type Toggle */}
        <FormField
          control={form.control}
          name="pricingType"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium">Pricing Type</FormLabel>
                <FieldTooltip content="Choose hourly rate or a flat rate for this gig" />
              </div>
              <FormControl>
                <RadioGroup
                  value={field.value || 'hourly'}
                  onValueChange={(val) => {
                    field.onChange(val);
                    // Reset total when switching
                    form.setValue('totalPrice', undefined);
                    form.setValue('depositAmount', undefined);
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="pricing-hourly" />
                    <Label htmlFor="pricing-hourly" className="font-poppins cursor-pointer">
                      Hourly Rate
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="flat_rate" id="pricing-flat" />
                    <Label htmlFor="pricing-flat" className="font-poppins cursor-pointer">
                      Flat Rate
                    </Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hourly fields */}
        {!isFlatRate && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="hoursBooked"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="font-poppins font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Hours Booked
                    </FormLabel>
                    <FieldTooltip content="Number of hours for the event" />
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g., 5"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="font-poppins focus:ring-2 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel className="font-poppins font-medium flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Hourly Rate
                    </FormLabel>
                    <FieldTooltip content="Rate per hour in dollars" />
                  </div>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Enter hourly rate"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      className="font-poppins focus:ring-2 focus:ring-primary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Flat rate field */}
        {isFlatRate && (
          <FormField
            control={form.control}
            name="totalPrice"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center">
                  <FormLabel className="font-poppins font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Price
                  </FormLabel>
                  <FieldTooltip content="Flat rate total for this gig" />
                </div>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g., 800"
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="font-poppins focus:ring-2 focus:ring-primary"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Pricing summary */}
        {((!isFlatRate && hoursBooked && hourlyRate) || (isFlatRate && totalPrice)) && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Total Price
              </span>
              <span className="text-lg font-bold text-primary">
                ${isFlatRate 
                  ? totalPrice?.toLocaleString() 
                  : ((hoursBooked ?? 0) * (hourlyRate ?? 0)).toLocaleString()
                }
              </span>
            </div>
            {!isFlatRate && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{hoursBooked} hrs × ${hourlyRate}/hr</span>
              </div>
            )}
            {isFlatRate && (
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Flat Rate</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{depositPercentage}% Deposit Required</span>
              <span className="font-medium">
                ${(
                  (isFlatRate ? (totalPrice ?? 0) : ((hoursBooked ?? 0) * (hourlyRate ?? 0))) * depositFraction
                ).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="contract"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center">
                <FormLabel className="font-poppins font-medium">Contract Notes (Optional)</FormLabel>
                <FieldTooltip content="Any contract details or special terms" />
              </div>
              <FormControl>
                <Textarea
                  {...field}
                  className="font-poppins focus:ring-2 focus:ring-primary min-h-[80px]"
                  placeholder="Enter contract details or special terms..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  }

  // Venue Partner view - only package type
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-medium text-foreground">Package Selection</h3>
      </div>
      
      <FormField
        control={form.control}
        name="packageType"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center">
              <FormLabel className="font-poppins font-medium">Package Type (Optional)</FormLabel>
              <FieldTooltip content="Select the event package type" />
            </div>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="font-poppins focus:ring-2 focus:ring-primary transition-all duration-200">
                  <SelectValue placeholder="Select package type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-background z-50">
                {packageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ContractPackageFields;
