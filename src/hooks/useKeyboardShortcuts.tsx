import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  description: string;
  action: () => void;
  category: 'global' | 'navigation' | 'forms' | 'page';
  sequence?: string[];
  disabled?: boolean;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const isTyping = (target: EventTarget | null): boolean => {
  if (!target) return false;
  const element = target as HTMLElement;
  const tagName = element.tagName;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName) || element.isContentEditable;
};

let keySequence: string[] = [];
let sequenceTimeout: ReturnType<typeof setTimeout> | null = null;

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  useEffect(() => {
    // Disable on touch-only devices (mobile/tablets without keyboard)
    const isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches && 
                          window.matchMedia?.('(hover: none)').matches;
    if (isTouchDevice) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field
      if (isTyping(event.target)) {
        // Allow Ctrl+Enter and Cmd+Enter even in input fields for form submission
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          // Allow this to proceed
        } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
          // Allow Ctrl/Cmd+S to proceed
        } else {
          return;
        }
      }

      // Handle sequential shortcuts (like 'g+d')
      const handleSequence = (key: string) => {
        if (sequenceTimeout) clearTimeout(sequenceTimeout);
        keySequence.push(key.toLowerCase());
        
        sequenceTimeout = setTimeout(() => {
          keySequence = [];
        }, 1000);
        
        return keySequence.join('+');
      };

      // Check for sequence shortcuts first
      const currentSequence = handleSequence(event.key);
      
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        // Check sequence shortcuts
        if (shortcut.sequence) {
          const expectedSequence = shortcut.sequence.join('+');
          if (currentSequence === expectedSequence) {
            event.preventDefault();
            shortcut.action();
            keySequence = []; // Reset sequence
            return;
          }
        }

        // Check single key shortcuts
        if (!shortcut.sequence) {
          const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
          const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey : true;
          const metaMatches = shortcut.metaKey ? (isMac ? event.metaKey : event.ctrlKey) : true;
          const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
          const altMatches = shortcut.altKey ? event.altKey : !event.altKey;

          // For modifier shortcuts, require the modifier
          const requiresModifier = shortcut.ctrlKey || shortcut.metaKey;
          const hasModifier = event.ctrlKey || event.metaKey;

          if (keyMatches) {
            if (requiresModifier) {
              if (hasModifier && ctrlMatches && metaMatches) {
                event.preventDefault();
                shortcut.action();
                return;
              }
            } else if (!event.ctrlKey && !event.metaKey && !event.altKey && shiftMatches) {
              event.preventDefault();
              shortcut.action();
              return;
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeout) clearTimeout(sequenceTimeout);
    };
  }, [shortcuts]);
};

export const getModifierSymbol = () => isMac ? '⌘' : 'Ctrl';
export const getModifierKey = () => isMac ? 'Cmd' : 'Ctrl';
