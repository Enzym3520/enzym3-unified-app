import { Badge } from "@/components/ui/badge";
import { getModifierSymbol } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutBadgeProps {
  keys: string[];
  className?: string;
}

export const KeyboardShortcutBadge = ({ keys, className = "" }: KeyboardShortcutBadgeProps) => {
  // Only show on desktop
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return null;
  }

  const displayKeys = keys.map(key => {
    if (key.toLowerCase() === 'ctrl' || key.toLowerCase() === 'cmd') {
      return getModifierSymbol();
    }
    if (key.toLowerCase() === 'shift') return '⇧';
    if (key.toLowerCase() === 'alt') return '⌥';
    return key.toUpperCase();
  });

  return (
    <div className={`hidden md:flex items-center gap-0.5 ${className}`}>
      {displayKeys.map((key, i) => (
        <Badge 
          key={i} 
          variant="outline" 
          className="font-mono text-[10px] px-1.5 py-0 h-5 bg-muted/50 text-muted-foreground border-muted-foreground/20"
        >
          {key}
        </Badge>
      ))}
    </div>
  );
};
