export interface PackageTypeOption {
  value: string;
  label: string;
}

export const PACKAGE_TYPE_OPTIONS: PackageTypeOption[] = [
  { value: 'ceremony-only', label: 'Ceremony Only' },
  { value: 'ceremony-w-patio', label: 'Ceremony W/ Patio' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'diamond', label: 'Diamond' },
];

export const PACKAGE_TYPE_VALUES = PACKAGE_TYPE_OPTIONS.map(option => option.value);

export const getPackageTypeLabel = (value?: string): string => {
  if (!value) return 'Not specified';
  const option = PACKAGE_TYPE_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value.charAt(0).toUpperCase() + value.slice(1);
};