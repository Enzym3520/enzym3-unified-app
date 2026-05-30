import React, { useEffect } from 'react';
import { parseLocalDate } from '@/utils/dateHelpers';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormData, formSchema } from '@/types/eventForm';
import { Form } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFormSubmission } from '@/hooks/useFormSubmission';

// Import field components
import SmartInputField from '@/components/staff/form-fields/SmartInputField';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedCalendar } from '@/components/ui/enhanced-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import BirthdayContactFields from '../contact-fields/BirthdayContactFields';
import QuinceContactFields from '../contact-fields/QuinceContactFields';
import BanquetContactFields from '../contact-fields/BanquetContactFields';
import { PACKAGE_TYPE_OPTIONS } from '@/config/packageTypes';
import DressCodeField from '@/components/staff/form-fields/DressCodeField';

// Import comprehensive sections
import TimingSection from '../comprehensive-sections/TimingSection';
import MusicEntertainmentSection from '../comprehensive-sections/MusicEntertainmentSection';
import TechnicalSetupSection from '../comprehensive-sections/TechnicalSetupSection';
import CateringSection from '../comprehensive-sections/CateringSection';
import SpecialRequestsSection from '../comprehensive-sections/SpecialRequestsSection';
import EnhancedPackageSection from '../comprehensive-sections/EnhancedPackageSection';

interface ComprehensiveNonWeddingFormProps {
  initialData?: Partial<FormData>;
  onSuccess?: () => void;
}

const ComprehensiveNonWeddingForm = ({ initialData, onSuccess }: ComprehensiveNonWeddingFormProps) => {
  const { toast } = useToast();
  const { submitForm, isSubmitting } = useFormSubmission();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventType: 'birthday',
      from: '',
      vendors: '',
      vendorType: '',
      venue: '',
      venueCode: '',
      contract: '',
      packageType: '',
      numberOfGuests: undefined,
      notes: '',
    },
  });

  // Enhanced field mapping for pre-population with prioritized nested form_data
  const mapInitialDataToFormFields = (data: any) => {
    if (import.meta.env.DEV) console.log('🔍 Raw pre-population data (Non-Wedding):', JSON.stringify(data, null, 2));
    
    const mapped: Partial<FormData> = {};
    
    // PRIORITY 1: Check nested form_data structure FIRST (most complete data)
    let sourceData = data;
    if (data.additional_metadata?.form_data) {
      if (import.meta.env.DEV) console.log('📋 Using nested form_data as primary source');
      sourceData = { ...data, ...data.additional_metadata.form_data };
    }
    
    // Core form field mappings (coordinator/vendor info)
    mapped.from = sourceData.from || sourceData.coordinator_name || data.coordinator_name || '';
    mapped.vendors = sourceData.vendors || sourceData.dj_name || data.dj_name || '';
    mapped.vendorType = sourceData.vendorType || sourceData.vendor_type || data.vendor_type || '';
    mapped.venue = sourceData.venue || sourceData.venue_name || data.venue || '';
    mapped.venueCode = sourceData.venueCode || sourceData.venue_code || '';
    mapped.contract = sourceData.contract || '';
    mapped.packageType = sourceData.packageType || sourceData.package_type || data.package_type || '';
    mapped.numberOfGuests = sourceData.numberOfGuests || sourceData.guest_count || data.guest_count || undefined;
    mapped.notes = sourceData.notes || data.notes || '';
    
    // Event type mapping
    if (sourceData.eventType) {
      mapped.eventType = sourceData.eventType;
    } else if (sourceData.event_type || data.event_type) {
      const eventType = sourceData.event_type || data.event_type;
      const eventTypeMap: Record<string, string> = {
        'birthday': 'birthday',
        'quince': 'quince',
        'quinceañera': 'quince',
        'banquet': 'banquet',
        'graduation': 'graduation',
        'sweet16': 'sweet16',
        'sweet 16': 'sweet16',
        'corporate': 'corporate',
        'other': 'other'
      };
      mapped.eventType = eventTypeMap[eventType.toLowerCase()] || 'other';
    } else {
      mapped.eventType = 'birthday'; // Default
    }
    
    // Date field mapping
    if (sourceData.weddingDate) {
      mapped.weddingDate = sourceData.weddingDate;
    } else if (sourceData.wedding_date || sourceData.event_date || data.wedding_date || data.event_date) {
      const dateValue = sourceData.wedding_date || sourceData.event_date || data.wedding_date || data.event_date;
      mapped.weddingDate = parseLocalDate(dateValue);
    }
    
    // Contact field mappings - map from wedding fields to non-wedding fields
    // For wedding forms, we need to extract from bride/groom data
    if (sourceData.brideName || sourceData.groomName) {
      // Wedding form data - map to appropriate non-wedding fields
      const coupleName = [sourceData.brideName, sourceData.groomName].filter(Boolean).join(' & ');
      
      // Map to different contact fields based on event type
      const eventType = mapped.eventType || 'birthday';
      
      if (eventType === 'birthday') {
        mapped.honoreeName = sourceData.brideName || '';
        mapped.parentName = coupleName || sourceData.contactName || sourceData.contact_name || '';
        mapped.parentEmail = sourceData.brideEmail || sourceData.groomEmail || sourceData.contactEmail || sourceData.contact_email || '';
        mapped.parentPhone = sourceData.bridePhone || sourceData.groomPhone || sourceData.contactPhone || sourceData.contact_phone || '';
      } else if (eventType === 'quince') {
        mapped.quinceaneraName = sourceData.brideName || '';
        mapped.parentName = coupleName || sourceData.contactName || sourceData.contact_name || '';
        mapped.parentEmail = sourceData.brideEmail || sourceData.groomEmail || sourceData.contactEmail || sourceData.contact_email || '';
        mapped.parentPhone = sourceData.bridePhone || sourceData.groomPhone || sourceData.contactPhone || sourceData.contact_phone || '';
      } else {
        // Banquet or other - use general contact fields
        mapped.contactName = coupleName || sourceData.contactName || sourceData.contact_name || '';
        mapped.contactEmail = sourceData.brideEmail || sourceData.groomEmail || sourceData.contactEmail || sourceData.contact_email || '';
        mapped.contactPhone = sourceData.bridePhone || sourceData.groomPhone || sourceData.contactPhone || sourceData.contact_phone || '';
      }
    } else {
      // Non-wedding form data - direct mapping
      const eventType = mapped.eventType || 'birthday';
      
      if (eventType === 'birthday') {
        mapped.honoreeName = sourceData.honoreeName || sourceData.contactName || sourceData.contact_name || '';
        mapped.parentName = sourceData.parentName || sourceData.contactName || sourceData.contact_name || '';
        mapped.parentEmail = sourceData.parentEmail || sourceData.contactEmail || sourceData.contact_email || '';
        mapped.parentPhone = sourceData.parentPhone || sourceData.contactPhone || sourceData.contact_phone || '';
      } else if (eventType === 'quince') {
        mapped.quinceaneraName = sourceData.quinceaneraName || sourceData.contactName || sourceData.contact_name || '';
        mapped.parentName = sourceData.parentName || sourceData.contactName || sourceData.contact_name || '';
        mapped.parentEmail = sourceData.parentEmail || sourceData.contactEmail || sourceData.contact_email || '';
        mapped.parentPhone = sourceData.parentPhone || sourceData.contactPhone || sourceData.contact_phone || '';
      } else {
        // Banquet or other
        mapped.contactName = sourceData.contactName || sourceData.contact_name || '';
        mapped.contactEmail = sourceData.contactEmail || sourceData.contact_email || '';
        mapped.contactPhone = sourceData.contactPhone || sourceData.contact_phone || '';
      }
    }
    
    if (import.meta.env.DEV) {
      console.log('✅ Final mapped data (Non-Wedding):', mapped);
      console.log('📊 Event type determined:', mapped.eventType);
    }
    
    return mapped;
  };

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      if (import.meta.env.DEV) console.log('🔄 Pre-population data received (Non-Wedding)');
      const mappedData = mapInitialDataToFormFields(initialData);
      if (import.meta.env.DEV) console.log('🎯 Mapped form data (Non-Wedding):', mappedData);
      
      // Reset the form with the mapped data
      form.reset({
        eventType: 'birthday',
        from: '',
        vendors: '',
        vendorType: '',
        venue: '',
        venueCode: '',
        contract: '',
        packageType: '',
        numberOfGuests: undefined,
        notes: '',
        ...mappedData,
      });
      
      if (import.meta.env.DEV) console.log('✅ Form reset complete with pre-populated data (Non-Wedding)');
    }
  }, [initialData, form]);

  const watchEventType = form.watch('eventType');

  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data, undefined, 100);
      toast({
        title: "Success",
        description: "Event form submitted successfully",
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

  const renderContactFields = () => {
    switch (watchEventType) {
      case 'birthday':
      case 'sweet16':
        return <BirthdayContactFields form={form} />;
      case 'quince':
        return <QuinceContactFields form={form} />;
      case 'banquet':
      case 'graduation':
        return <BanquetContactFields form={form} />;
      default:
        return <BanquetContactFields form={form} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Event Details Form</CardTitle>
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
                    tooltip="Name of the event coordinator"
                  />

                  <SmartInputField
                    form={form}
                    name="vendors"
                    label="Vendor(s) *"
                    placeholder="Enter vendor names"
                    tooltip="Names of vendors involved in the event"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type of Event *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select event type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="birthday">Birthday Party</SelectItem>
                            <SelectItem value="quince">Quinceañera</SelectItem>
                            <SelectItem value="banquet">Banquet</SelectItem>
                            <SelectItem value="graduation">Graduation Party</SelectItem>
                            <SelectItem value="sweet16">Sweet 16</SelectItem>
                            <SelectItem value="corporate">Corporate Event</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Event Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SmartInputField
                    form={form}
                    name="venue"
                    label="Venue *"
                    placeholder="Enter venue name"
                    tooltip="Event venue location"
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
                        <FormLabel>Event Date *</FormLabel>
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
                              disabled={(date) =>
                                date < new Date()
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <SmartInputField
                    form={form}
                    name="contract"
                    label="Contract"
                    placeholder="Enter contract details"
                    tooltip="Contract information or reference"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="packageType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Package Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select package type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PACKAGE_TYPE_OPTIONS.map((option) => (
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

              {/* Enhanced Package Section */}
              <EnhancedPackageSection form={form} />

              {/* Timing Section */}
              <TimingSection form={form} />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Information</h3>
                {renderContactFields()}
              </div>

              {/* Music and Entertainment */}
              <MusicEntertainmentSection form={form} />

              {/* Catering Section */}
              <CateringSection form={form} />

              {/* Technical Setup */}
              <TechnicalSetupSection form={form} />

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

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Event Details'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComprehensiveNonWeddingForm;