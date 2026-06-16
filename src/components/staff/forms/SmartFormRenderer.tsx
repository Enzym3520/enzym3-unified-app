import React from "react";
import { UseFormReturn } from "react-hook-form";
import { SmartFormSchema, SmartFormField } from "@/types/weddingSmartForm";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { EnhancedInput } from "@/components/ui/enhanced-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EnhancedCalendar } from "@/components/ui/enhanced-calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { TimeInput12Hour } from "@/components/ui/time-input-12hour";
import SignaturePad from "@/components/ui/signature-pad";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface SmartFormRendererProps {
  schema: SmartFormSchema;
  form: UseFormReturn<any>;
}

const renderField = (field: SmartFormField, form: UseFormReturn<any>) => {
  const { control } = form;

  switch (field.type) {
    case "text":
    case "name":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <EnhancedInput {...rhf} placeholder={field.label} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "phone":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <PhoneInput value={rhf.value || ""} onChange={rhf.onChange} placeholder={field.label} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "number":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <EnhancedInput
                  type="number"
                  value={rhf.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    rhf.onChange(val === "" ? undefined : Number(val));
                  }}
                  placeholder={field.label}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "select":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <Select onValueChange={rhf.onChange} value={rhf.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label}`} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(field.options || []).map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "date":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={`w-full justify-between pl-3 text-left font-normal ${!rhf.value ? "text-muted-foreground" : ""}`}
                    >
                      {rhf.value ? (
                        format(new Date(rhf.value), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <EnhancedCalendar
                    mode="single"
                    selected={rhf.value ? new Date(rhf.value) : undefined}
                    onSelect={(d) => rhf.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "time":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <TimeInput12Hour
                  value={rhf.value || ""}
                  onChange={rhf.onChange}
                  label=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    case "signature":
      return (
        <FormField
          key={field.name}
          control={control}
          name={field.name}
          render={({ field: rhf }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <SignaturePad value={rhf.value || ""} onChange={rhf.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );

    default:
      return null;
  }
};

export const SmartFormRenderer: React.FC<SmartFormRendererProps> = ({ schema, form }) => {
  const fieldsByName = React.useMemo(() => new Map(schema.fields.map((f) => [f.name, f])), [schema.fields]);

  if (schema.sections && schema.sections.length > 0) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {schema.sections.map((section) => (
          <Card key={section.id} className="animate-fade-in">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              {section.description ? <CardDescription>{section.description}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fieldNames
                  .map((name) => fieldsByName.get(name))
                  .filter(Boolean)
                  .map((f) => (
                    <div key={(f as SmartFormField).name}>{renderField(f as SmartFormField, form)}</div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {schema.fields.map((f) => (
        <div key={f.name}>{renderField(f, form)}</div>
      ))}
    </div>
  );
};

export default SmartFormRenderer;
