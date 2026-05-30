import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { PaymentStatus, PackageType } from '@/types/upgradeOrder';

interface UpgradeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  paymentStatus: PaymentStatus | 'all';
  onPaymentStatusChange: (status: PaymentStatus | 'all') => void;
  packageType: PackageType | 'all';
  onPackageTypeChange: (type: PackageType | 'all') => void;
}

export function UpgradeFilters({
  searchQuery,
  onSearchChange,
  paymentStatus,
  onPaymentStatusChange,
  packageType,
  onPackageTypeChange,
}: UpgradeFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by client name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={paymentStatus} onValueChange={onPaymentStatusChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Payment Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="paid">Paid</SelectItem>
        </SelectContent>
      </Select>

      <Select value={packageType} onValueChange={onPackageTypeChange}>
        <SelectTrigger className="w-full md:w-[180px]">
          <SelectValue placeholder="Package Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Packages</SelectItem>
          <SelectItem value="Ruby">Ruby</SelectItem>
          <SelectItem value="Emerald">Emerald</SelectItem>
          <SelectItem value="Sapphire">Sapphire</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
