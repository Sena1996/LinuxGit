import { useEffect } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit,
  ArrowUp,
  ArrowDown,
  GitBranch,
  RefreshCw,
  History,
  FileCode,
  Settings,
  Sparkles,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { useUIStore } from '@/stores/ui';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  group: string;
  action: () => void;
}

export function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, setView } = useUIStore();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCommandPalette();
      }
    };

    if (commandPaletteOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [commandPaletteOpen, closeCommandPalette]);

  const commands: CommandItem[] = [
    // Git Actions
    {
      id: 'commit',
      label: 'Commit',
      icon: <GitCommit size={16} />,
      shortcut: '⌘⏎',
      group: 'Git',
      action: () => {
        setView('changes');
        closeCommandPalette();
      },
    },
    {
      id: 'push',
      label: 'Push to remote',
      icon: <ArrowUp size={16} />,
      shortcut: '⌘⇧P',
      group: 'Git',
      action: () => {
        closeCommandPalette();
      },
    },
    {
      id: 'pull',
      label: 'Pull from remote',
      icon: <ArrowDown size={16} />,
      shortcut: '⌘⇧L',
      group: 'Git',
      action: () => {
        closeCommandPalette();
      },
    },
    {
      id: 'fetch',
      label: 'Fetch all remotes',
      icon: <RefreshCw size={16} />,
      group: 'Git',
      action: () => {
        closeCommandPalette();
      },
    },
    {
      id: 'branch',
      label: 'Switch branch',
      icon: <GitBranch size={16} />,
      shortcut: '⌘B',
      group: 'Git',
      action: () => {
        setView('branches');
        closeCommandPalette();
      },
    },
    {
      id: 'new-branch',
      label: 'Create new branch',
      icon: <Plus size={16} />,
      group: 'Git',
      action: () => {
        setView('branches');
        closeCommandPalette();
      },
    },

    // Navigation
    {
      id: 'view-changes',
      label: 'Go to Changes',
      icon: <FileCode size={16} />,
      group: 'Navigation',
      action: () => {
        setView('changes');
        closeCommandPalette();
      },
    },
    {
      id: 'view-history',
      label: 'Go to History',
      icon: <History size={16} />,
      group: 'Navigation',
      action: () => {
        setView('history');
        closeCommandPalette();
      },
    },
    {
      id: 'view-branches',
      label: 'Go to Branches',
      icon: <GitBranch size={16} />,
      group: 'Navigation',
      action: () => {
        setView('branches');
        closeCommandPalette();
      },
    },
    {
      id: 'view-settings',
      label: 'Go to Settings',
      icon: <Settings size={16} />,
      group: 'Navigation',
      action: () => {
        setView('settings');
        closeCommandPalette();
      },
    },

    // Repository
    {
      id: 'open-repo',
      label: 'Open repository...',
      icon: <FolderOpen size={16} />,
      shortcut: '⌘O',
      group: 'Repository',
      action: () => {
        closeCommandPalette();
      },
    },

    // AI
    {
      id: 'ai-commit',
      label: 'Generate commit message',
      icon: <Sparkles size={16} />,
      group: 'AI',
      action: () => {
        setView('changes');
        closeCommandPalette();
      },
    },
  ];

  const groups = [...new Set(commands.map((c) => c.group))];

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCommandPalette}
            className="fixed inset-0 bg-void/60 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-[560px] z-50"
          >
            <Command className="glass-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <span className="text-accent-primary">⌘</span>
                <Command.Input
                  placeholder="Search commands..."
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
                  autoFocus
                />
              </div>

              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-text-muted text-sm">
                  No results found.
                </Command.Empty>

                {groups.map((group) => (
                  <Command.Group
                    key={group}
                    heading={
                      <span className="text-xs font-medium text-text-muted uppercase tracking-wider px-2 py-1">
                        {group}
                      </span>
                    }
                    className="mb-2"
                  >
                    {commands
                      .filter((c) => c.group === group)
                      .map((command) => (
                        <Command.Item
                          key={command.id}
                          onSelect={command.action}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-text-secondary hover:bg-hover hover:text-text-primary data-[selected=true]:bg-accent-primary/15 data-[selected=true]:text-accent-primary transition-colors"
                        >
                          <span className="text-text-muted">{command.icon}</span>
                          <span className="flex-1 text-sm">{command.label}</span>
                          {command.shortcut && (
                            <kbd className="px-1.5 py-0.5 rounded bg-surface text-xs text-text-ghost">
                              {command.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
