import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Platform detection
export function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

// Get modifier key symbol based on platform
export function getModKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

// Format a shortcut for the current platform
// Input uses Mac-style: ⌘ (Cmd), ⇧ (Shift), ⌥ (Alt/Option), ⏎ (Enter)
export function formatShortcut(macShortcut: string): string {
  if (isMac()) return macShortcut;

  return macShortcut
    .replace('⌘', 'Ctrl+')
    .replace('⇧', 'Shift+')
    .replace('⌥', 'Alt+')
    .replace('⏎', 'Enter')
    .replace(/\+$/, ''); // Remove trailing + if any
}
