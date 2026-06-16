import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData, formSchema } from '@/types/eventForm';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFormSubmission } from '@/hooks/useFormSubmission';
import { useFormPrePopulation } from '@/hooks/useFormPrePopulation';
import { useCoupleDataIntegration } from '@/hooks/useCoupleDataIntegration';

// Import field components
import SmartInputField from '@/components/staff/form-fields/SmartInputField';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import WeddingContactFields from '../contact-fields/WeddingContactFields';
import DressCodeField from '@/components/staff/form-fields/DressCodeField';
import PrePopulationDebugPanel from '@/components/staff/form-fields/PrePopulationDebugPanel';

// Import new comprehensive sections
import TimingSection from '../comprehensive-sections/TimingSection';
import WeddingCeremonySection from '../comprehensive-sections/WeddingCeremonySection';
import MusicEntertainmentSection from '../comprehensive-sections/MusicEntertainmentSection';
import TechnicalSetupSection from '../comprehensive-sections/TechnicalSetupSection';
import CateringSection from '../comprehensive-sections/CateringSection';
import SpecialRequestsSection from '../comprehensive-sections/SpecialRequestsSection';
import EnhancedPackageSection from '../comprehensive-sections/EnhancedPackageSection';
import CeremonyDetailsSection from '../comprehensive-sections/CeremonyDetailsSection';
import VendorCoordinationSection from '../comprehensive-sections/VendorCoordinationSection';
import LinensTableDecorSection from '../comprehensive-sections/LinensTableDecorSection';
import BartendingOutsideDecorSection from '../comprehensive-sections/BartendingOutsideDecorSection';

interface ComprehensiveWeddingFormProps {
  initialData?: Partial<FormData>;
  onSuccess?: () => void;
  selectedCoupleData?: any; // Couple data from selector
}

const ComprehensiveWeddingForm = ({ initialData, onSuccess, selectedCoupleData }: ComprehensiveWeddingFormProps) => {
  const { toast } = useToast();
  const { submitForm, isSubmitting } = useFormSubmission();
  const { data: prePopData, loading: prePopLoading } = useFormPrePopulation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: 'wedding',
      from: '',
      vendors: '',
      vendorType: '',
      venue: '',
      venueCode: '',
      contract: '',
      packageType: '',
      numberOfGuests: undefined,
      brideName: '',
      groomName: '',
      bridePhone: '',
      groomPhone: '',
      brideEmail: '',
      groomEmail: '',
      notes: '',
      wedding_id: crypto.randomUUID(),
    },
  });

  // Integrate couple data with pre-population
  const { mapCoupleDataToFormFields } = useCoupleDataIntegration({
    form,
    selectedCoupleData,
    prePopulationData: prePopData?.fieldMappings
  });

  // Helper function to get default form values
  const getDefaultFormValues = () => ({
    eventType: 'wedding',
    from: '',
    vendors: '',
    vendorType: '',
    venue: '',
    venueCode: '',
    contract: '',
    packageType: '',
    numberOfGuests: undefined,
    weddingDate: undefined,
    brideName: '',
    groomName: '',
    bridePhone: '',
    groomPhone: '',
    brideEmail: '',
    groomEmail: '',
    notes: '',
    wedding_id: crypto.randomUUID(),
  });

  // Handle pre-population data from URL params or props
  useEffect(() => {
    const dataToUse = prePopData?.fieldMappings || initialData;
    
    if (dataToUse && Object.keys(dataToUse).length > 0) {
      if (import.meta.env.DEV) {
        console.log('🔄 Pre-population data received:', dataToUse);
        console.log('🎯 Available fields in data:', Object.keys(dataToUse));
      }
      
      // Create form values with defaults first, then override with data
      const defaultValues = getDefaultFormValues();
      const formValues = { ...defaultValues };
      
      // Process and normalize the data
      Object.entries(dataToUse).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Handle date conversion
          if (key === 'weddingDate' && typeof value === 'string') {
            try {
              formValues[key] = new Date(value);
            } catch (e) {
              if (import.meta.env.DEV) console.warn('Failed to parse date:', value);
            }
          } else if (key === 'numberOfGuests' && typeof value === 'string') {
            formValues[key] = parseInt(value, 10);
          } else {
            formValues[key] = value;
          }
        }
      });
      
      if (import.meta.env.DEV) {
        console.log('📝 Key field mappings:', {
          eventType: formValues.eventType, venue: formValues.venue,
          weddingDate: formValues.weddingDate, packageType: formValues.packageType,
        });
      }
      
      form.reset(formValues);
      
      if (import.meta.env.DEV) console.log('✅ Form reset complete with pre-populated data');
    }
  }, [prePopData?.fieldMappings, initialData, form]);

  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data, undefined, 100);
      toast({
        title: "Success",
        description: "Wedding form submitted successfully",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Debug Panel */}
      <PrePopulationDebugPanel
        prePopData={prePopData}
        selectedCoupleData={selectedCoupleData}
        mergedData={initialData}
        formValues={form.getValues()}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Wedding Details Form</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Coordinator and Vendor Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Coordinator & Vendor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartInputField
                    form={form}
                    name="from"
                    label="Coordinator Name *"
                    placeholder="Enter coordinator name"
                    tooltip="Name of the wedding coordinator"
                  />

                  <SmartInputField
                    form={form}
                    name="vendors"
                    label="Vendor(s) *"
                    placeholder="Enter vendor names"
                    tooltip="Names of vendors involved in the wedding"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="vendorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type of Vendor *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dj">DJ</SelectItem>
                          <SelectItem value="photographer">Photographer</SelectItem>
                          <SelectItem value="videographer">Videographer</SelectItem>
                          <SelectItem value="florist">Florist</SelectItem>
                          <SelectItem value="caterer">Caterer</SelectItem>
                          <SelectItem value="decorator">Decorator</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Enhanced Package Section */}
              <EnhancedPackageSection form={form} />

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartInputField
                    form={form}
                    name="venue"
                    label="Venue *"
                    placeholder="Enter venue name"
                    tooltip="Wedding venue location"
                  />

                  <SmartInputField
                    form={form}
                    name="venueCode"
                    label="Venue Code"
                    placeholder="Enter venue code"
                    tooltip="Internal venue identification code"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="weddingDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wedding Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <EnhancedCalendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="numberOfGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Guests</FormLabel>
                        <FormControl>
                          <input
                            type="number"
                            min="1"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Enter number of guests"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Dress Code */}
                <DressCodeField form={form} />
              </div>

              {/* Timing Section */}
              <TimingSection form={form} />

              {/* Wedding Ceremony Section */}
              <WeddingCeremonySection form={form} />

              {/* Ceremony Details */}
              <CeremonyDetailsSection form={form} />

              {/* Vendor Coordination */}
              <VendorCoordinationSection form={form} />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                <WeddingContactFields form={form} />
              </div>

              {/* Music and Entertainment */}
              <MusicEntertainmentSection form={form} />

              {/* Catering Section */}
              <CateringSection form={form} />

              {/* Technical Setup */}
              <TechnicalSetupSection form={form} />

              {/* Linens & Table Decor */}
              <LinensTableDecorSection form={form} />

              {/* Bartending & Outside Decor */}
              <BartendingOutsideDecorSection form={form} />

              {/* Special Requests */}
              <SpecialRequestsSection form={form} />

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Additional Notes</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes or information"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Hidden Wedding ID Field */}
              <input type="hidden" {...form.register('wedding_id')} />

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Wedding Details'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveWeddingForm;