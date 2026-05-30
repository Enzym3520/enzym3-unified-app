import { DollarSign, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAllVendorServices } from '@/hooks/useVendorServices';
import { SERVICE_TYPES, RATE_TYPES } from '@/config/serviceTypes';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export const AdminVendorRates = () => {
  const { data: services = [], isLoading } = useAllVendorServices();
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const isMobile = useIsMobile();

  const filteredServices = serviceFilter === 'all'
    ? services
    : services.filter(s => s.service_type === serviceFilter);

  const servicesByType = filteredServices.reduce((acc: any, service: any) => {
    if (!acc[service.service_type]) {
      acc[service.service_type] = [];
    }
    acc[service.service_type].push(service);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-center py-8">Loading vendor rates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Vendor Rate Comparison</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 shrink-0" />
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {SERVICE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {Object.keys(servicesByType).length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No vendor services found. Vendors need to add their services first.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(servicesByType).map(([serviceType, services]: [string, any]) => {
          const serviceLabel = SERVICE_TYPES.find(t => t.value === serviceType)?.label || serviceType;
          const sortedServices = services.sort((a: any, b: any) => a.base_rate - b.base_rate);

          return (
            <Card key={serviceType}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {serviceLabel}
                  <Badge variant="secondary">{services.length} vendors</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <div className="space-y-3">
                    {sortedServices.map((service: any) => {
                      const vendor = service.profiles;
                      const vendorName = vendor?.company_name || 
                        `${vendor?.first_name || ''} ${vendor?.last_name || ''}`.trim() || 
                        'Unknown Vendor';
                      const rateTypeLabel = RATE_TYPES.find(t => t.value === service.rate_type)?.label;

                      return (
                        <div key={service.id} className="p-3 rounded-lg border">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{vendorName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-semibold text-green-600">${service.base_rate}</span>
                                <Badge variant="outline" className="text-xs">{rateTypeLabel}</Badge>
                              </div>
                              {service.min_hours && (
                                <p className="text-xs text-muted-foreground mt-0.5">Min {service.min_hours}h</p>
                              )}
                            </div>
                            {service.overtime_rate && (
                              <span className="text-xs text-muted-foreground shrink-0">OT: ${service.overtime_rate}/hr</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Base Rate</TableHead>
                      <TableHead>Rate Type</TableHead>
                      <TableHead>Min Hours</TableHead>
                      <TableHead>Overtime Rate</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedServices.map((service: any) => {
                      const vendor = service.profiles;
                      const vendorName = vendor?.company_name || 
                        `${vendor?.first_name || ''} ${vendor?.last_name || ''}`.trim() || 
                        'Unknown Vendor';
                      const rateTypeLabel = RATE_TYPES.find(t => t.value === service.rate_type)?.label;

                      return (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{vendorName}</TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              ${service.base_rate}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{rateTypeLabel}</Badge>
                          </TableCell>
                          <TableCell>
                            {service.min_hours ? `${service.min_hours}h` : '—'}
                          </TableCell>
                          <TableCell>
                            {service.overtime_rate ? `$${service.overtime_rate}/hr` : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {service.notes || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
