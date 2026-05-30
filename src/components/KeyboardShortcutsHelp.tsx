import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useKeyboardShortcutsContext } from "@/contexts/KeyboardShortcutsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getModifierSymbol } from "@/hooks/useKeyboardShortcuts";

export const KeyboardShortcutsHelp = () => {
  const { helpModalOpen, setHelpModalOpen, shortcuts } = useKeyboardShortcutsContext();

  const groupedShortcuts = {
    global: shortcuts.filter(s => s.category === 'global'),
    navigation: shortcuts.filter(s => s.category === 'navigation'),
    forms: shortcuts.filter(s => s.category === 'forms'),
    page: shortcuts.filter(s => s.category === 'page'),
  };

  const renderKey = (key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean }) => {
    const keys = [];
    
    if (modifiers?.ctrl) {
      keys.push(getModifierSymbol());
    }
    if (modifiers?.shift) {
      keys.push('⇧');
    }
    if (modifiers?.alt) {
      keys.push('⌥');
    }
    keys.push(key.toUpperCase());

    return (
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <Badge key={i} variant="secondary" className="font-mono text-xs px-2 py-0.5">
            {k}
          </Badge>
        ))}
      </div>
    );
  };

  const renderShortcut = (shortcut: any) => {
    if (shortcut.sequence) {
      return (
        <div className="flex items-center gap-1">
          {shortcut.sequence.map((key: string, i: number) => (
            <span key={i} className="flex items-center gap-1">
              <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5">
                {key.toUpperCase()}
              </Badge>
              {i < shortcut.sequence.length - 1 && <span className="text-muted-foreground">then</span>}
            </span>
          ))}
        </div>
      );
    }

    return renderKey(shortcut.key, {
      ctrl: shortcut.ctrlKey || shortcut.metaKey,
      shift: shortcut.shiftKey,
      alt: shortcut.altKey,
    });
  };

  return (
    <Dialog open={helpModalOpen} onOpenChange={setHelpModalOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate faster and be more productive
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          {groupedShortcuts.global.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Global</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedShortcuts.global.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    {renderShortcut(shortcut)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {groupedShortcuts.navigation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedShortcuts.navigation.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    {renderShortcut(shortcut)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {groupedShortcuts.forms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Forms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedShortcuts.forms.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    {renderShortcut(shortcut)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {groupedShortcuts.page.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {groupedShortcuts.page.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    {renderShortcut(shortcut)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <Badge variant="secondary" className="font-mono text-xs mx-1">ESC</Badge> to close this dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
