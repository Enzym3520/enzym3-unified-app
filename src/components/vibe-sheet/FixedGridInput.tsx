import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FixedGridInputProps {
  label: string;
  placeholder: string;
  values: string[];
  count: number;
  onChange: (values: string[]) => void;
}

/**
 * A fixed-count grid of name inputs (e.g., 4 grandparents in a 2x2 grid).
 */
export const FixedGridInput = ({ label, placeholder, values, count, onChange }: FixedGridInputProps) => {
  const normalize = (v: unknown): string => typeof v === 'string' ? v : (v && typeof v === 'object' ? ((v as any).name || '') : '');
  const list = Array(count).fill('').map((_, i) => normalize(values[i]));

  // Pair them into rows of 2
  const rows: [number, number][] = [];
  for (let i = 0; i < count; i += 2) {
    rows.push([i, i + 1 < count ? i + 1 : -1]);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-3">
        {rows.map(([a, b]) => (
          <div key={a} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              placeholder={`${placeholder} ${a + 1}`}
              value={list[a] || ''}
              onChange={(e) => {
                const updated = [...list];
                updated[a] = e.target.value;
                onChange(updated);
              }}
            />
            {b >= 0 && (
              <Input
                placeholder={`${placeholder} ${b + 1}`}
                value={list[b] || ''}
                onChange={(e) => {
                  const updated = [...list];
                  updated[b] = e.target.value;
                  onChange(updated);
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
