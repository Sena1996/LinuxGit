import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  GitCommit,
  Copy,
  Eye,
  RotateCcw,
  Tag,
  ChevronRight,
  ChevronsUp,
  FileCode,
  GitCompare,
  History,
  AlertTriangle,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  FilePlus,
  FileX,
  FileEdit,
  GitMerge,
  FolderTree,
  MessageSquare,
  Trash2,
  Combine,
  PenLine,
  ArrowUpToLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { invoke } from '@tauri-apps/api/core';

// Types
interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  color: string;
  tags?: string[];
}

interface CommitActionMenuProps {
  commit: CommitInfo;
  position: { x: number; y: number };
  currentBranch: string;
  onClose: () => void;
  onAction: (action: CommitAction, data?: unknown) => void;
}

export type CommitAction =
  // Core Actions
  | 'view-changes'
  | 'copy-sha'
  | 'copy-message'
  // Branch Operations
  | 'create-branch'
  | 'checkout'
  | 'merge-into-current'
  // History Rewriting
  | 'cherry-pick'
  | 'revert'
  | 'reset-soft'
  | 'reset-mixed'
  | 'reset-hard'
  | 'rebase-onto'
  | 'interactive-rebase'
  // Tags
  | 'create-tag'
  | 'delete-tag'
  // Compare & Inspect
  | 'compare-with-head'
  | 'compare-with'
  | 'browse-files'
  // Advanced
  | 'squash-with-parent'
  | 'edit-message'
  | 'drop-commit';

interface MenuItem {
  id: CommitAction | 'reset' | 'rebase' | 'tags' | 'compare' | 'advanced' | 'divider' | 'group-label';
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  submenu?: MenuItem[];
  description?: string;
}

const menuItems: MenuItem[] = [
  // === CORE ACTIONS ===
  {
    id: 'view-changes',
    label: 'View Changes',
    icon: <Eye size={14} />,
    shortcut: 'Enter',
    description: 'View diff for this commit',
  },
  {
    id: 'browse-files',
    label: 'Browse Files',
    icon: <FolderTree size={14} />,
    description: 'View file tree at this commit',
  },
  { id: 'divider', label: '' },

  // === COMPARE & INSPECT ===
  {
    id: 'compare',
    label: 'Compare',
    icon: <GitCompare size={14} />,
    submenu: [
      {
        id: 'compare-with-head',
        label: 'Compare with HEAD',
        description: 'Diff between this and current',
      },
      {
        id: 'compare-with',
        label: 'Compare with...',
        description: 'Select another commit to compare',
      },
    ],
  },
  { id: 'divider', label: '' },

  // === BRANCH OPERATIONS ===
  {
    id: 'create-branch',
    label: 'Create Branch Here',
    icon: <GitBranch size={14} />,
    shortcut: 'B',
    description: 'Start a new branch at this commit',
  },
  {
    id: 'checkout',
    label: 'Checkout Commit',
    icon: <GitCommit size={14} />,
    description: 'Switch to this commit (detached HEAD)',
  },
  {
    id: 'merge-into-current',
    label: 'Merge into Current Branch',
    icon: <GitMerge size={14} />,
    description: 'Merge this commit into current branch',
  },
  { id: 'divider', label: '' },

  // === HISTORY REWRITING ===
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
  {
    id: 'reset',
    label: 'Reset Branch to Here',
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
    label: 'Rebase',
    icon: <ArrowUpToLine size={14} />,
    submenu: [
      {
        id: 'rebase-onto',
        label: 'Rebase onto This Commit',
        description: 'Rebase current branch onto here',
      },
      {
        id: 'interactive-rebase',
        label: 'Interactive Rebase from Here',
        description: 'Edit commit history from this point',
      },
    ],
  },
  { id: 'divider', label: '' },

  // === TAGS ===
  {
    id: 'tags',
    label: 'Tags',
    icon: <Tag size={14} />,
    submenu: [
      {
        id: 'create-tag',
        label: 'Create Tag',
        shortcut: 'T',
        description: 'Tag this commit',
      },
      {
        id: 'delete-tag',
        label: 'Delete Tag',
        danger: true,
        description: 'Remove tag from this commit',
      },
    ],
  },
  { id: 'divider', label: '' },

  // === ADVANCED ===
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <FileCode size={14} />,
    submenu: [
      {
        id: 'squash-with-parent',
        label: 'Squash with Parent',
        icon: <Combine size={14} />,
        description: 'Combine with previous commit',
      },
      {
        id: 'edit-message',
        label: 'Edit Commit Message',
        icon: <PenLine size={14} />,
        description: 'Amend the commit message',
      },
      {
        id: 'drop-commit',
        label: 'Drop Commit',
        icon: <Trash2 size={14} />,
        danger: true,
        description: 'Remove commit from history',
      },
    ],
  },
  { id: 'divider', label: '' },

  // === COPY ACTIONS ===
  {
    id: 'copy-sha',
    label: 'Copy Commit SHA',
    icon: <Copy size={14} />,
    shortcut: 'C',
  },
  {
    id: 'copy-message',
    label: 'Copy Commit Message',
    icon: <MessageSquare size={14} />,
    shortcut: 'M',
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
            className="dropdown-inline left-full top-0 ml-1 w-48 p-1"
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
  currentBranch: _currentBranch,
  onClose,
  onAction,
}: CommitActionMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleAction = (action: CommitAction) => {
    onAction(action);
  };

  // Adjust position to stay within viewport
  useEffect(() => {
    if (menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 8;

      let newX = position.x;
      let newY = position.y;

      // Check right overflow
      if (position.x + rect.width > viewportWidth - padding) {
        newX = viewportWidth - rect.width - padding;
      }

      // Check left overflow
      if (newX < padding) {
        newX = padding;
      }

      // Check bottom overflow - show above cursor if not enough space below
      if (position.y + rect.height > viewportHeight - padding) {
        newY = position.y - rect.height - padding;
        // If still overflows top, just align to top
        if (newY < padding) {
          newY = padding;
        }
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position]);

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
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1 }}
        className="w-64 dropdown-menu p-1"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
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
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-card w-full max-w-md p-6"
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
    <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-card w-full max-w-md p-6"
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

// Types for diff data from backend
interface DiffLine {
  line_type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  old_line: number | null;
  new_line: number | null;
}

interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

interface FileDiff {
  path: string;
  old_path: string | null;
  status: 'Added' | 'Modified' | 'Deleted' | 'Renamed' | 'Untracked' | 'Conflict';
  hunks: DiffHunk[];
  is_binary: boolean;
  additions: number;
  deletions: number;
}

// File status icon component
function FileStatusIcon({ status }: { status: FileDiff['status'] }) {
  switch (status) {
    case 'Added':
      return <FilePlus size={16} className="text-status-added" />;
    case 'Deleted':
      return <FileX size={16} className="text-status-deleted" />;
    case 'Modified':
      return <FileEdit size={16} className="text-status-modified" />;
    case 'Renamed':
      return <FileText size={16} className="text-accent-primary" />;
    default:
      return <FileCode size={16} className="text-text-muted" />;
  }
}

// File diff item component
function FileDiffItem({ file, defaultExpanded = true }: { file: FileDiff; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="mb-4 border border-white/5 rounded-lg overflow-hidden">
      {/* File header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2 bg-elevated hover:bg-hover transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-text-muted" />
        ) : (
          <ChevronUp size={16} className="text-text-muted" />
        )}
        <FileStatusIcon status={file.status} />
        <span className="flex-1 text-sm font-medium text-text-primary truncate">
          {file.old_path && file.status === 'Renamed' ? (
            <>
              <span className="text-text-muted">{file.old_path}</span>
              <span className="text-text-ghost mx-2">→</span>
              {file.path}
            </>
          ) : (
            file.path
          )}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-status-added/20 text-status-added">
          +{file.additions}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-status-deleted/20 text-status-deleted">
          -{file.deletions}
        </span>
      </button>

      {/* File content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {file.is_binary ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm bg-surface">
                Binary file not shown
              </div>
            ) : file.hunks.length === 0 ? (
              <div className="px-4 py-8 text-center text-text-muted text-sm bg-surface">
                No changes to display
              </div>
            ) : (
              <div className="bg-surface font-mono text-xs overflow-x-auto">
                {file.hunks.map((hunk, hunkIndex) => (
                  <div key={hunkIndex}>
                    {/* Hunk header */}
                    <div className="px-4 py-1.5 bg-accent-primary/10 text-accent-primary border-y border-white/5 sticky top-0">
                      {hunk.header}
                    </div>
                    {/* Hunk lines */}
                    {hunk.lines.map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className={cn(
                          'flex',
                          line.line_type === 'addition' && 'bg-status-added/10',
                          line.line_type === 'deletion' && 'bg-status-deleted/10'
                        )}
                      >
                        {/* Line numbers */}
                        <div className="flex-shrink-0 w-20 flex text-text-ghost select-none border-r border-white/5">
                          <span className="w-10 px-2 py-0.5 text-right">
                            {line.old_line || ''}
                          </span>
                          <span className="w-10 px-2 py-0.5 text-right">
                            {line.new_line || ''}
                          </span>
                        </div>
                        {/* Line indicator */}
                        <span
                          className={cn(
                            'flex-shrink-0 w-6 text-center py-0.5 select-none',
                            line.line_type === 'addition' && 'text-status-added',
                            line.line_type === 'deletion' && 'text-status-deleted',
                            line.line_type === 'context' && 'text-text-ghost'
                          )}
                        >
                          {line.line_type === 'addition' ? '+' : line.line_type === 'deletion' ? '-' : ' '}
                        </span>
                        {/* Line content */}
                        <pre
                          className={cn(
                            'flex-1 py-0.5 pr-4 whitespace-pre',
                            line.line_type === 'addition' && 'text-status-added',
                            line.line_type === 'deletion' && 'text-status-deleted',
                            line.line_type === 'context' && 'text-text-secondary'
                          )}
                        >
                          {line.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Diff Viewer Modal
interface DiffViewerModalProps {
  commit: CommitInfo;
  onClose: () => void;
}

export function DiffViewerModal({ commit, onClose }: DiffViewerModalProps) {
  const [files, setFiles] = useState<FileDiff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDiff() {
      try {
        setLoading(true);
        setError(null);
        const diffData = await invoke<FileDiff[]>('get_commit_diff', { sha: commit.sha });
        setFiles(diffData);
      } catch (e) {
        setError(String(e));
        console.error('Failed to load diff:', e);
      } finally {
        setLoading(false);
      }
    }

    loadDiff();
  }, [commit.sha]);

  // Calculate totals
  const totals = files.reduce(
    (acc, file) => ({
      additions: acc.additions + file.additions,
      deletions: acc.deletions + file.deletions,
    }),
    { additions: 0, deletions: 0 }
  );

  return (
    <div className="fixed inset-0 bg-void/80  flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 1 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-card w-full max-w-5xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: commit.color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{commit.message}</p>
              <p className="text-xs text-text-muted">
                <code className="font-mono">{commit.shortSha}</code> • {commit.author} • {commit.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-hover text-text-muted hover:text-text-primary transition-colors flex-shrink-0 ml-4"
          >
            <X size={20} />
          </button>
        </div>

        {/* Stats bar */}
        {!loading && !error && files.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2 bg-elevated border-b border-white/5 text-sm flex-shrink-0">
            <span className="text-text-muted">
              {files.length} {files.length === 1 ? 'file' : 'files'} changed
            </span>
            <span className="text-status-added">+{totals.additions}</span>
            <span className="text-status-deleted">-{totals.deletions}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-accent-primary" />
              <span className="ml-3 text-text-muted">Loading diff...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertTriangle size={48} className="text-status-deleted mb-4" />
              <p className="text-text-primary font-medium">Failed to load diff</p>
              <p className="text-sm text-text-muted mt-1">{error}</p>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileCode size={48} className="text-text-ghost mb-4" />
              <p className="text-text-muted">No changes in this commit</p>
            </div>
          ) : (
            files.map((file, index) => (
              <FileDiffItem
                key={`${file.path}-${index}`}
                file={file}
                defaultExpanded={files.length <= 5}
              />
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
