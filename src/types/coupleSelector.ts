import { CoupleData } from '@/hooks/useCoupleData';

export interface CoupleSelectorProps {
  onCoupleSelect: (coupleData: CoupleData) => void;
}