import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EnhancedInput } from '@/components/ui/enhanced-input';
import { FieldTooltip } from '@/components/ui/field-tooltip';
import { FormData } from '@/types/eventForm';
import RealTimeValidation from './RealTimeValidation';
import { useSmartSuggestions } from '@/hooks/useSmartSuggestions';

interface SmartInputFieldProps {
  form: UseFormReturn<FormData>;
  name: keyof FormData;
  label: string;
  placeholder: string;
  tooltip?: string;
  suggestions?: string[];
  validation?: (value: string) => boolean;
  type?: 'text' | 'email' | 'tel';
  suggestionType?: 'venue' | 'coordinator' | 'vendor' | 'package';
}

const SmartInputField = ({ 
  form, 
  name, 
  label, 
  placeholder, 
  tooltip, 
  suggestions = [],
  validation,
  type = 'text',
  suggestionType
}: SmartInputFieldProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const { suggestions: smartSuggestions } = useSmartSuggestions();

  const fieldValue = form.watch(name as any);

  // Get smart suggestions based on type
  const getRelevantSuggestions = () => {
    if (suggestions.length > 0) return suggestions;
    
    switch (suggestionType) {
      case 'venue':
        return smartSuggestions.venues;
      case 'coordinator':
        return smartSuggestions.coordinators;
      case 'vendor':
        return smartSuggestions.vendorNames;
      case 'package':
        return smartSuggestions.packageTypes;
      default:
        return [];
    }
  };

  // Enhanced validation based on field type
  const getContextualValidation = (value: string) => {
    if (validation) return validation(value);
    
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'tel':
        return /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, ''));
      default:
        return true;
    }
  };

  useEffect(() => {
    const relevantSuggestions = getRelevantSuggestions();
    if (relevantSuggestions.length > 0 && inputValue) {
      const filtered = relevantSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && inputValue.length > 1);
    } else {
      setShowSuggestions(false);
    }
    // getRelevantSuggestions derives only from the inputs already listed below;
    // adding the inline function itself would re-run this on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, suggestions, smartSuggestions, suggestionType]);

  // Hide suggestions when field loses focus permanently
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions(false);
      setInputValue('');
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue(name as any, suggestion);
    setShowSuggestions(false);
  };

  return (
    <FormField
      control={form.control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="relative">
          <div className="flex items-center">
            <FormLabel className="font-poppins font-medium">{label}</FormLabel>
            {tooltip && <FieldTooltip content={tooltip} />}
          </div>
          <FormControl>
            <div className="relative">
              <EnhancedInput
                {...field}
                type={type}
                className="font-poppins focus:ring-2 focus:ring-primary transition-all duration-200"
                placeholder={placeholder}
                onChange={(e) => {
                  field.onChange(e);
                  setInputValue(e.target.value);
                }}
                onFocus={() => {
                  if (suggestions.length > 0 && field.value) {
                    setInputValue(field.value);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
              />
              
              {/* Suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute z-50 w-full mt-1 rounded-md border border-border bg-background text-foreground shadow-md max-h-40 overflow-y-auto">
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm font-poppins hover:bg-accent focus:bg-accent focus:outline-none"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormControl>
          
          <RealTimeValidation
            fieldName={name as any}
            value={fieldValue}
            errors={form.formState.errors}
            isValid={getContextualValidation(fieldValue || '')}
          />
          
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SmartInputField;