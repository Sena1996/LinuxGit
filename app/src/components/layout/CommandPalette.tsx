import { useState, useEffect } from 'react';
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
  Download,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useUIStore } from '@/stores/ui';
import { useRepoStore } from '@/stores/repo';
import { useRepositoriesStore } from '@/stores/repositories';
import { formatShortcut, getModKey } from '@/lib/utils';
import { CloneDialog, CreateDialog } from '@/components/repository';

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
  const { setRepo, setLoading, setError } = useRepoStore();
  const { addRecentRepository } = useRepositoriesStore();
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleOpenRepository = async () => {
    closeCommandPalette();
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Repository',
      });

      if (selected) {
        setLoading(true);
        const repoInfo = await invoke<{
          path: string;
          name: string;
          head_branch: string | null;
          head_sha: string | null;
          is_detached: boolean;
        }>('open_repository', { path: selected });

        const repo = {
          path: repoInfo.path,
          name: repoInfo.name,
          currentBranch: repoInfo.head_branch || 'main',
          headSha: repoInfo.head_sha || undefined,
          isDetached: repoInfo.is_detached,
        };

        setRepo(repo);
        addRecentRepository({
          path: repo.path,
          name: repo.name,
          lastOpened: Date.now(),
          currentBranch: repo.currentBranch,
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

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
      action: handleOpenRepository,
    },
    {
      id: 'clone-repo',
      label: 'Clone repository...',
      icon: <Download size={16} />,
      group: 'Repository',
      action: () => {
        closeCommandPalette();
        setShowCloneDialog(true);
      },
    },
    {
      id: 'create-repo',
      label: 'Create new repository...',
      icon: <Plus size={16} />,
      group: 'Repository',
      action: () => {
        closeCommandPalette();
        setShowCreateDialog(true);
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
            className="fixed inset-0 bg-void/80 z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 flex items-start justify-center pt-16 z-50 pointer-events-none"
          >
            <div className="w-full max-w-[560px] pointer-events-auto">
            <Command className="modal-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <span className="text-accent-primary">{getModKey()}</span>
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
                              {formatShortcut(command.shortcut)}
                            </kbd>
                          )}
                        </Command.Item>
                      ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
            </div>
          </motion.div>
        </>
      )}

      {/* Clone Dialog */}
      {showCloneDialog && (
        <CloneDialog onClose={() => setShowCloneDialog(false)} />
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <CreateDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </AnimatePresence>
  );
}
