import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitCommit,
  GitMerge,
  Copy,
  Eye,
  RotateCcw,
  Tag,
  Trash2,
  ChevronRight,
  ChevronsUp,
  FileCode,
  GitCompare,
  History,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  color: string;
}

interface CommitActionMenuProps {
  commit: CommitInfo;
  position: { x: number; y: number };
  currentBranch: string;
  onClose: () => void;
  onAction: (action: CommitAction, data?: unknown) => void;
}

export type CommitAction =
  | 'view-changes'
  | 'cherry-pick'
  | 'revert'
  | 'reset-soft'
  | 'reset-mixed'
  | 'reset-hard'
  | 'create-branch'
  | 'create-tag'
  | 'checkout'
  | 'copy-sha'
  | 'compare'
  | 'rebase';

interface MenuItem {
  id: CommitAction | 'reset' | 'divider';
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  submenu?: MenuItem[];
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'view-changes',
    label: 'View Changes',
    icon: <Eye size={14} />,
    shortcut: 'Enter',
    description: 'View diff for this commit',
  },
  {
    id: 'compare',
    label: 'Compare with...',
    icon: <GitCompare size={14} />,
    description: 'Compare with another commit',
  },
  { id: 'divider', label: '' },
  {
    id: 'cherry-pick',
    label: 'Cherry-pick Commit',
    icon: <ChevronsUp size={14} />,
    description: 'Apply this commit to current branch',
  },
  {
    id: 'revert',
    label: 'Revert Commit',
    icon: <RotateCcw size={14} />,
    description: 'Create a commit that undoes changes',
  },
  { id: 'divider', label: '' },
  {
    id: 'reset',
    label: 'Reset Current Branch to Here',
    icon: <History size={14} />,
    submenu: [
      {
        id: 'reset-soft',
        label: 'Soft Reset',
        description: 'Keep changes staged',
      },
      {
        id: 'reset-mixed',
        label: 'Mixed Reset',
        description: 'Keep changes unstaged',
      },
      {
        id: 'reset-hard',
        label: 'Hard Reset',
        danger: true,
        description: 'Discard all changes',
      },
    ],
  },
  {
    id: 'rebase',
    label: 'Interactive Rebase from Here',
    icon: <FileCode size={14} />,
    description: 'Edit commit history from this point',
  },
  { id: 'divider', label: '' },
  {
    id: 'create-branch',
    label: 'Create Branch from Here',
    icon: <GitBranch size={14} />,
    shortcut: 'B',
    description: 'Start a new branch at this commit',
  },
  {
    id: 'create-tag',
    label: 'Create Tag',
    icon: <Tag size={14} />,
    shortcut: 'T',
    description: 'Tag this commit',
  },
  {
    id: 'checkout',
    label: 'Checkout Commit',
    icon: <GitCommit size={14} />,
    description: 'Switch to this commit (detached HEAD)',
  },
  { id: 'divider', label: '' },
  {
    id: 'copy-sha',
    label: 'Copy Commit SHA',
    icon: <Copy size={14} />,
    shortcut: 'C',
  },
];

function MenuItemComponent({
  item,
  onAction,
  onSubmenuHover,
  activeSubmenu,
}: {
  item: MenuItem;
  onAction: (action: CommitAction) => void;
  onSubmenuHover: (id: string | null) => void;
  activeSubmenu: string | null;
}) {
  if (item.id === 'divider') {
    return <div className="h-px bg-white/10 my-1" />;
  }

  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isSubmenuOpen = activeSubmenu === item.id;

  return (
    <div className="relative">
      <button
        onClick={() => !hasSubmenu && onAction(item.id as CommitAction)}
        onMouseEnter={() => hasSubmenu && onSubmenuHover(item.id)}
        onMouseLeave={() => hasSubmenu && onSubmenuHover(null)}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left',
          item.danger
            ? 'text-status-deleted hover:bg-status-deleted/20'
            : 'text-text-primary hover:bg-hover'
        )}
      >
        <span className={cn('text-text-muted', item.danger && 'text-status-deleted')}>
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {item.shortcut && (
          <span className="text-xs text-text-muted bg-surface px-1.5 py-0.5 rounded">
            {item.shortcut}
          </span>
        )}
        {hasSubmenu && <ChevronRight size={14} className="text-text-muted" />}
      </button>

      {/* Submenu */}
      <AnimatePresence>
        {hasSubmenu && isSubmenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-full top-0 ml-1 w-48 glass-card p-1 z-10"
            onMouseEnter={() => onSubmenuHover(item.id)}
            onMouseLeave={() => onSubmenuHover(null)}
          >
            {item.submenu?.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => onAction(subItem.id as CommitAction)}
                className={cn(
                  'w-full flex flex-col gap-0.5 px-3 py-2 text-sm rounded-md transition-colors text-left',
                  subItem.danger
                    ? 'text-status-deleted hover:bg-status-deleted/20'
                    : 'text-text-primary hover:bg-hover'
                )}
              >
                <span>{subItem.label}</span>
                {subItem.description && (
                  <span className="text-xs text-text-muted">{subItem.description}</span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CommitActionMenu({
  commit,
  position,
  currentBranch,
  onClose,
  onAction,
}: CommitActionMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAction = (action: CommitAction) => {
    onAction(action);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleContextMenuOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Close current menu - the new context menu will open from the click handler
        onClose();
      }
    };

    // Use capture phase to handle events before they bubble
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('contextmenu', handleContextMenuOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('contextmenu', handleContextMenuOutside);
    };
  }, [onClose]);

  return (
    <>
      {/* Menu */}
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="fixed z-50 w-64 glass-card p-1"
        style={{
          left: Math.min(position.x, window.innerWidth - 280),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/10 mb-1">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: commit.color }}
            />
            <code className="text-xs text-text-muted font-mono">{commit.shortSha}</code>
          </div>
          <p className="text-sm text-text-primary truncate mt-1">{commit.message}</p>
          <p className="text-xs text-text-muted">
            {commit.author} • {commit.date}
          </p>
        </div>

        {/* Menu Items */}
        <div className="max-h-80 overflow-y-auto">
          {menuItems.map((item, index) => (
            <MenuItemComponent
              key={item.id === 'divider' ? `divider-${index}` : item.id}
              item={item}
              onAction={handleAction}
              onSubmenuHover={setActiveSubmenu}
              activeSubmenu={activeSubmenu}
            />
          ))}
        </div>
      </motion.div>
    </>
  );
}

// Confirmation Dialog for dangerous operations
interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-void/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-6"
      >
        <div className="flex items-start gap-4 mb-4">
          {danger && (
            <div className="p-2 rounded-full bg-status-deleted/20">
              <AlertTriangle size={24} className="text-status-deleted" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-medium text-text-primary">{title}</h3>
            <p className="text-sm text-text-muted mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-elevated hover:bg-hover text-text-secondary text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              danger
                ? 'bg-status-deleted hover:bg-status-deleted/80 text-white'
                : 'bg-accent-primary text-void hover:shadow-glow-sm'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Input Dialog for branch/tag name
interface InputDialogProps {
  title: string;
  placeholder: string;
  confirmLabel: string;
  icon: React.ReactNode;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputDialog({
  title,
  placeholder,
  confirmLabel,
  icon,
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 bg-void/60 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-accent-primary/20 text-accent-primary">
            {icon}
          </div>
          <h3 className="text-lg font-medium text-text-primary">{title}</h3>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 mb-4"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value) onConfirm(value);
            if (e.key === 'Escape') onCancel();
          }}
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-elevated hover:bg-hover text-text-secondary text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => value && onConfirm(value)}
            disabled={!value}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              value
                ? 'bg-accent-primary text-void hover:shadow-glow-sm'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// Diff Viewer Modal
interface DiffViewerModalProps {
  commit: CommitInfo;
  onClose: () => void;
}

export function DiffViewerModal({ commit, onClose }: DiffViewerModalProps) {
  // This would fetch actual diff data from backend
  const mockDiff = {
    files: [
      {
        path: 'src/components/Button.tsx',
        status: 'modified' as const,
        additions: 12,
        deletions: 5,
        hunks: [
          {
            header: '@@ -10,7 +10,14 @@',
            lines: [
              { type: 'context' as const, content: 'import { cn } from "@/lib/utils";' },
              { type: 'deletion' as const, content: 'const Button = ({ children }) => {' },
              { type: 'addition' as const, content: 'interface ButtonProps {' },
              { type: 'addition' as const, content: '  children: React.ReactNode;' },
              { type: 'addition' as const, content: '  variant?: "primary" | "secondary";' },
              { type: 'addition' as const, content: '}' },
              { type: 'addition' as const, content: '' },
              { type: 'addition' as const, content: 'const Button = ({ children, variant = "primary" }: ButtonProps) => {' },
              { type: 'context' as const, content: '  return (' },
            ],
          },
        ],
      },
    ],
  };

  return (
    <div className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-4xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: commit.color }}
            />
            <div>
              <p className="text-sm font-medium text-text-primary">{commit.message}</p>
              <p className="text-xs text-text-muted">
                <code className="font-mono">{commit.shortSha}</code> • {commit.author} • {commit.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-auto p-4">
          {mockDiff.files.map((file) => (
            <div key={file.path} className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <FileCode size={16} className="text-text-muted" />
                <span className="text-sm font-medium text-text-primary">{file.path}</span>
                <span className="text-xs text-status-added">+{file.additions}</span>
                <span className="text-xs text-status-deleted">-{file.deletions}</span>
              </div>

              <div className="bg-surface rounded-lg overflow-hidden font-mono text-xs">
                {file.hunks.map((hunk, hunkIndex) => (
                  <div key={hunkIndex}>
                    <div className="px-4 py-1 bg-accent-primary/10 text-accent-primary">
                      {hunk.header}
                    </div>
                    {hunk.lines.map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className={cn(
                          'px-4 py-0.5',
                          line.type === 'addition' && 'bg-status-added/10 text-status-added',
                          line.type === 'deletion' && 'bg-status-deleted/10 text-status-deleted',
                          line.type === 'context' && 'text-text-secondary'
                        )}
                      >
                        <span className="inline-block w-4 select-none opacity-50">
                          {line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' '}
                        </span>
                        {line.content}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
