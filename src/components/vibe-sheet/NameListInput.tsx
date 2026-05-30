import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NameListInputProps {
  label: string;
  placeholder: string;
  names: string[];
  onChange: (names: string[]) => void;
  addLabel?: string;
}

export const NameListInput = ({ label, placeholder, names, onChange, addLabel }: NameListInputProps) => {
  const list = names.length ? names : [''];

  return (
    <div>
      <Label>{label}</Label>
      <div className="space-y-2">
        {list.map((name, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder={`${placeholder} ${i + 1}`}
              value={name}
              onChange={(e) => {
                const updated = [...list];
                updated[i] = e.target.value;
                onChange(updated);
              }}
            />
            {list.length > 1 && (
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                onClick={() => onChange(list.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-primary hover:underline mt-1"
          onClick={() => onChange([...list, ''])}
        >
          + {addLabel || `Add ${placeholder}`}
        </button>
      </div>
    </div>
  );
};
