import React, { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import SmartFormRenderer from "@/components/staff/forms/SmartFormRenderer";
import { weddingDetailsSchema } from "@/types/weddingSmartForm";
import { useWeddingDetailsSubmission } from "@/hooks/useWeddingDetailsSubmission";

interface WeddingDetailsSmartFormProps {
  initialData?: Record<string, any>;
  selectedCoupleData?: any;
  onSuccess?: () => void;
}

// Build a Zod schema based on the JSON schema types (lenient, mostly optional)
const makeZodForField = (type: string, options?: string[]) => {
  switch (type) {
    case "number":
      return z.coerce.number().optional();
    case "date":
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional();
    case "time":
      return z.string().regex(/^\d{2}:\d{2}$/).optional();
    case "select":
      return options && options.length ? z.enum(options as [string, ...string[]]).optional() : z.string().optional();
    default:
      return z.string().optional();
  }
};

const dynamicZodSchema = z.object(
  Object.fromEntries(
    weddingDetailsSchema.fields.map((f) => [f.name, makeZodForField(f.type, f.options)])
  )
);

const mapInitialToSmartSchema = (data?: Record<string, any>) => {
  if (!data) return {};
  const out: Record<string, any> = {};

  const copyIf = (srcKey: string, destKey: string = srcKey, transform?: (v: any) => any) => {
    const v = data[srcKey];
    if (v !== undefined && v !== null && v !== "") out[destKey] = transform ? transform(v) : v;
  };

  // Common mappings
  copyIf("brideName", "bride");
  copyIf("groomName", "groom");
  copyIf("contact_phone", "phone");
  copyIf("coordinator_name", "coordinator");

  // Event date
  if (data.event_date) out.date_of_event = typeof data.event_date === "string" ? data.event_date : "";
  if (data.weddingDate instanceof Date) {
    const d = data.weddingDate as Date;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.date_of_event = out.date_of_event || iso;
  }

  // Guest count -> total_people fallback
  if (typeof data.guest_count === "number") out.total_people = data.guest_count;
  if (typeof data.numberOfGuests === "number") out.total_people = data.numberOfGuests;

  // Pass through any matching keys directly
  for (const f of weddingDetailsSchema.fields) {
    if (data[f.name] !== undefined && out[f.name] === undefined) out[f.name] = data[f.name];
  }

  return out;
};

const WeddingDetailsSmartForm: React.FC<WeddingDetailsSmartFormProps> = ({ initialData, onSuccess }) => {
  const defaults = useMemo(() => mapInitialToSmartSchema(initialData), [initialData]);
  const form = useForm<z.infer<typeof dynamicZodSchema>>({
    resolver: zodResolver(dynamicZodSchema) as any,
    defaultValues: defaults,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset(mapInitialToSmartSchema(initialData));
  }, [initialData, form]);

  const { submit } = useWeddingDetailsSubmission();

  const onSubmit = async (values: z.infer<typeof dynamicZodSchema>) => {
    const ok = await submit(values);
    if (ok) onSuccess?.();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">{weddingDetailsSchema.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...(form as any)}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <SmartFormRenderer schema={weddingDetailsSchema} form={form as any} />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => form.reset(defaults)}>
                  Reset
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeddingDetailsSmartForm;
