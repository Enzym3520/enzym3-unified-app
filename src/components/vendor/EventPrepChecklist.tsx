import { CheckCircle2, Circle } from "lucide-react";

interface EventPrepChecklistProps {
  assignment: {
    status: string | null;
    vendor_files_uploaded?: boolean | null;
    event?: { dress_code?: string | null } | null;
  };
  compact?: boolean;
}

interface CheckItem {
  label: string;
  checked: boolean;
}

export function EventPrepChecklist({ assignment, compact = false }: EventPrepChecklistProps) {
  const items: CheckItem[] = [
    { label: "Confirm assignment", checked: assignment.status === "confirmed" },
    { label: "Review music sheet", checked: false },
    { label: "Check directions to venue", checked: false },
    { label: "Confirm dress code", checked: !!assignment.event?.dress_code },
    { label: "Upload pre-event files", checked: !!assignment.vendor_files_uploaded },
  ];

  const completed = items.filter((i) => i.checked).length;
  const total = items.length;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>{completed}/{total} prep tasks</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completed / total) * 100}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Event Prep</h4>
        <span className="text-xs text-muted-foreground">{completed}/{total}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {item.checked ? (
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className={item.checked ? "text-muted-foreground line-through" : "text-foreground"}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
