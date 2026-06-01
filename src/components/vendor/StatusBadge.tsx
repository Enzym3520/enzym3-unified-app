import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  assigned: { label: "Pending Confirmation", className: "bg-warning/10 text-warning border-warning/20" },
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20" },
  confirmed: { label: "Confirmed", className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary border-primary/20" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

interface StatusBadgeProps {
  status: string | null | undefined;
  compact?: boolean;
  className?: string;
}

export function StatusBadge({ status, compact = false, className }: StatusBadgeProps) {
  const s = status?.toLowerCase() ?? "";
  const config = STATUS_CONFIG[s];

  if (!config) {
    return <Badge variant="outline" className={className}>{status ?? "unknown"}</Badge>;
  }

  return (
    <Badge variant="outline" className={`${config.className} ${className ?? ""}`}>
      {compact ? (status ?? "unknown") : config.label}
    </Badge>
  );
}
