import { useState, useEffect } from 'react';
import { DollarSign, Calculator, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVendorServices } from '@/hooks/useVendorServices';
import { useAssignmentCost, useCreateAssignmentCost, useUpdateAssignmentCost } from '@/hooks/useAssignmentCosts';
import { PAYMENT_STATUSES } from '@/config/serviceTypes';

interface AssignmentCostEditorProps {
  assignmentId: string;
  vendorId: string;
  eventType?: string;
  onSave?: () => void;
}

export const AssignmentCostEditor = ({ 
  assignmentId, 
  vendorId, 
  eventType,
  onSave 
}: AssignmentCostEditorProps) => {
  const { data: existingCost } = useAssignmentCost(assignmentId);
  const { data: vendorServices = [] } = useVendorServices(vendorId);
  const createCost = useCreateAssignmentCost();
  const updateCost = useUpdateAssignmentCost();

  const [formData, setFormData] = useState({
    vendor_rate: '',
    hours_booked: '',
    overtime_hours: '',
    admin_markup_percent: '20',
    payment_status: 'unpaid',
    notes: '',
  });

  const [calculations, setCalculations] = useState({
    total_vendor_cost: 0,
    client_price: 0,
    total_client_price: 0,
    profit: 0,
  });

  useEffect(() => {
    if (existingCost) {
      setFormData({
        vendor_rate: existingCost.vendor_rate.toString(),
        hours_booked: existingCost.hours_booked?.toString() || '',
        overtime_hours: existingCost.overtime_hours?.toString() || '',
        admin_markup_percent: existingCost.admin_markup_percent.toString(),
        payment_status: existingCost.payment_status,
        notes: existingCost.notes || '',
      });
    }
  }, [existingCost]);

  useEffect(() => {
    const vendorRate = parseFloat(formData.vendor_rate) || 0;
    const hours = parseFloat(formData.hours_booked) || 0;
    const overtime = parseFloat(formData.overtime_hours) || 0;
    const markup = parseFloat(formData.admin_markup_percent) || 0;

    // Calculate total vendor cost (for hourly, multiply by hours)
    const totalVendorCost = hours > 0 ? vendorRate * hours : vendorRate;
    
    // Calculate client price with markup
    const clientPrice = totalVendorCost * (1 + markup / 100);
    
    // Add overtime if applicable
    const overtimeCost = overtime * vendorRate;
    const totalClientPrice = clientPrice + overtimeCost;
    
    const profit = totalClientPrice - (totalVendorCost + overtimeCost);

    setCalculations({
      total_vendor_cost: totalVendorCost + overtimeCost,
      client_price: clientPrice,
      total_client_price: totalClientPrice,
      profit,
    });
  }, [formData.vendor_rate, formData.hours_booked, formData.overtime_hours, formData.admin_markup_percent]);

  const handleSubmit = () => {
    const costData = {
      assignment_id: assignmentId,
      vendor_rate: parseFloat(formData.vendor_rate),
      admin_markup_percent: parseFloat(formData.admin_markup_percent),
      client_price: calculations.client_price,
      hours_booked: formData.hours_booked ? parseFloat(formData.hours_booked) : undefined,
      overtime_hours: formData.overtime_hours ? parseFloat(formData.overtime_hours) : undefined,
      total_vendor_cost: calculations.total_vendor_cost,
      total_client_price: calculations.total_client_price,
      payment_status: formData.payment_status as any,
      notes: formData.notes || undefined,
    };

    if (existingCost) {
      updateCost.mutate({ id: existingCost.id, ...costData }, {
        onSuccess: () => onSave?.(),
      });
    } else {
      createCost.mutate(costData, {
        onSuccess: () => onSave?.(),
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Cost & Pricing Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vendor Service Quick Select */}
        {vendorServices.length > 0 && (
          <div>
            <Label>Quick Select from Vendor Services</Label>
            <Select 
              onValueChange={(serviceId) => {
                const service = vendorServices.find(s => s.id === serviceId);
                if (service) {
                  setFormData({
                    ...formData,
                    vendor_rate: service.base_rate.toString(),
                    hours_booked: service.min_hours?.toString() || '',
                  });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service to auto-fill" />
              </SelectTrigger>
              <SelectContent>
                {vendorServices.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.service_type} - ${service.base_rate} ({service.rate_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        {/* Manual Entry */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Vendor Rate ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.vendor_rate}
              onChange={(e) => setFormData({ ...formData, vendor_rate: e.target.value })}
              placeholder="Rate per hour or flat fee"
            />
          </div>
          <div>
            <Label>Hours Booked</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.hours_booked}
              onChange={(e) => setFormData({ ...formData, hours_booked: e.target.value })}
              placeholder="Leave empty for flat fee"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Overtime Hours</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.overtime_hours}
              onChange={(e) => setFormData({ ...formData, overtime_hours: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Admin Markup (%)</Label>
            <Input
              type="number"
              step="1"
              value={formData.admin_markup_percent}
              onChange={(e) => setFormData({ ...formData, admin_markup_percent: e.target.value })}
            />
          </div>
        </div>

        {/* Calculations Display */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Vendor Cost:</span>
            <span className="font-medium">${calculations.total_vendor_cost.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Client Price (with markup):</span>
            <span className="font-medium text-green-600">${calculations.total_client_price.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Profit:
            </span>
            <span className="font-bold text-lg text-green-600">
              ${calculations.profit.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <Label>Payment Status</Label>
          <Select value={formData.payment_status} onValueChange={(v) => setFormData({ ...formData, payment_status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any special pricing considerations"
          />
        </div>

        <Button onClick={handleSubmit} className="w-full">
          <DollarSign className="w-4 h-4 mr-2" />
          {existingCost ? 'Update' : 'Save'} Cost Details
        </Button>
      </CardContent>
    </Card>
  );
};
