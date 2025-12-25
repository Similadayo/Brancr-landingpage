/**
 * Keyboard shortcuts utility for improved UX
 */

export type KeyboardShortcut = {
  key: string;
  ctrlOrCmd?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  if (typeof window === 'undefined') return;

  const handleKeyDown = (event: KeyboardEvent) => {
    shortcuts.forEach((shortcut) => {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlOrCmdMatches = shortcut.ctrlOrCmd
        ? event.ctrlKey || event.metaKey
        : !event.ctrlKey && !event.metaKey;
      const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatches = shortcut.alt ? event.altKey : !event.altKey;

      if (keyMatches && ctrlOrCmdMatches && shiftMatches && altMatches) {
        // Don't trigger if user is typing in an input
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        shortcut.action();
      }
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }
}

/**
 * Common keyboard shortcuts for navigation
 */
export const COMMON_SHORTCUTS = {
  search: { key: 'k', ctrlOrCmd: true, description: 'Open search/command palette' },
  new: { key: 'n', ctrlOrCmd: true, description: 'Create new item' },
  save: { key: 's', ctrlOrCmd: true, description: 'Save' },
  close: { key: 'Escape', description: 'Close modal/dialog' },
} as const;

