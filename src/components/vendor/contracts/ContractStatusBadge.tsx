import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  viewed: { label: "Viewed", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  signed: { label: "Signed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  declined: { label: "Declined", className: "bg-destructive/10 text-destructive" },
};

export function ContractStatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}
