import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { VendorPerformance } from '@/hooks/useAdminAnalytics';
import { useIsMobile } from '@/hooks/use-mobile';

interface TopVendorsTableProps {
  vendors: VendorPerformance[];
  limit?: number;
}

export function TopVendorsTable({ vendors, limit = 10 }: TopVendorsTableProps) {
  const topVendors = vendors.slice(0, limit);
  const isMobile = useIsMobile();

  const getComplianceBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return <Badge variant="default" className="bg-green-600">Compliant</Badge>;
      case 'attention':
        return <Badge variant="secondary">Attention</Badge>;
      case 'non_compliant':
        return <Badge variant="destructive">Non-Compliant</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        {isMobile ? (
          <div className="space-y-3">
            {topVendors.map((vendor, index) => (
              <div key={vendor.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <span className="text-lg font-bold text-muted-foreground shrink-0">#{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{vendor.name || vendor.company}</p>
                  {vendor.name && vendor.company && (
                    <p className="text-xs text-muted-foreground truncate">{vendor.company}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm">{vendor.events_completed} events</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{vendor.average_rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium">${vendor.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    {getComplianceBadge(vendor.compliance_status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Compliance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topVendors.map((vendor, index) => (
              <TableRow key={vendor.id}>
                <TableCell className="font-medium">#{index + 1}</TableCell>
                <TableCell>{vendor.name || 'N/A'}</TableCell>
                <TableCell>{vendor.company}</TableCell>
                <TableCell className="text-right">{vendor.events_completed}</TableCell>
                <TableCell className="text-right">
                  ${vendor.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span>{vendor.average_rating.toFixed(1)}</span>
                  </div>
                </TableCell>
                <TableCell>{getComplianceBadge(vendor.compliance_status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        )}
      </CardContent>
    </Card>
  );
}
