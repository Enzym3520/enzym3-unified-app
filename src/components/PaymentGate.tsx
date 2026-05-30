import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { Loader2 } from "lucide-react";

interface PaymentGateProps {
  children: ReactNode;
}

export function PaymentGate({ children }: PaymentGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLocked, checking } = usePaymentStatus();

  const isContractPage = location.pathname.startsWith('/app/contract');

  useEffect(() => {
    if (!checking && isLocked && !isContractPage) {
      navigate('/app/contract', { replace: true });
    }
  }, [checking, isLocked, isContractPage, navigate]);

  if (checking || (isLocked && !isContractPage)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
