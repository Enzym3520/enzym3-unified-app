import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { KeyboardShortcut, useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsContextType {
  shortcuts: KeyboardShortcut[];
  registerShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  unregisterShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  helpModalOpen: boolean;
  setHelpModalOpen: (open: boolean) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const KeyboardShortcutsProvider = ({ children }: { children: ReactNode }) => {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  const registerShortcuts = useCallback((newShortcuts: KeyboardShortcut[]) => {
    setShortcuts(prev => [...prev, ...newShortcuts]);
  }, []);

  const unregisterShortcuts = useCallback((shortcutsToRemove: KeyboardShortcut[]) => {
    setShortcuts(prev => 
      prev.filter(s => !shortcutsToRemove.some(r => 
        r.key === s.key && 
        r.ctrlKey === s.ctrlKey && 
        r.metaKey === s.metaKey
      ))
    );
  }, []);

  // Global listener that executes all registered shortcuts
  useKeyboardShortcuts(shortcuts);

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        shortcuts,
        registerShortcuts,
        unregisterShortcuts,
        helpModalOpen,
        setHelpModalOpen,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider');
  }
  return context;
};
