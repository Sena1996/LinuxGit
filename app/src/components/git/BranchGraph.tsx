import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, GitMerge, GitBranch, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  CommitActionMenu,
  ConfirmDialog,
  InputDialog,
  DiffViewerModal,
  type CommitAction
} from './CommitActionMenu';
import { invoke } from '@tauri-apps/api/core';

// Types for the branch graph
interface GraphCommit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  branch: string;
  parents: string[];
  isMerge: boolean;
  lane: number;
  color: string;
}

interface GraphBranch {
  name: string;
  color: string;
  lane: number;
  commits: string[];
  isCurrent: boolean;
}

// Branch colors matching Aurora theme
const BRANCH_COLORS = [
  '#00D9FF', // cyan - main
  '#BD00FF', // purple
  '#FF006B', // magenta
  '#00FF94', // green
  '#FFB800', // orange
  '#FF4D4D', // red
  '#4D94FF', // blue
  '#FF69B4', // pink
];

// Mock data for visualization demo
const mockGraphData: { commits: GraphCommit[]; branches: GraphBranch[] } = {
  branches: [
    { name: 'main', color: BRANCH_COLORS[0], lane: 0, commits: ['c1', 'c2', 'c5', 'c8', 'c10'], isCurrent: true },
    { name: 'feature/auth', color: BRANCH_COLORS[1], lane: 1, commits: ['c3', 'c4', 'c6'], isCurrent: false },
    { name: 'feature/ui', color: BRANCH_COLORS[2], lane: 2, commits: ['c7', 'c9'], isCurrent: false },
  ],
  commits: [
    { sha: 'c10', shortSha: 'a1b2c3d', message: 'Merge feature/auth into main', author: 'John', date: '1 hour ago', branch: 'main', parents: ['c8', 'c6'], isMerge: true, lane: 0, color: BRANCH_COLORS[0] },
    { sha: 'c9', shortSha: 'b2c3d4e', message: 'Add responsive styles', author: 'Jane', date: '2 hours ago', branch: 'feature/ui', parents: ['c7'], isMerge: false, lane: 2, color: BRANCH_COLORS[2] },
    { sha: 'c8', shortSha: 'c3d4e5f', message: 'Update dependencies', author: 'John', date: '3 hours ago', branch: 'main', parents: ['c5'], isMerge: false, lane: 0, color: BRANCH_COLORS[0] },
    { sha: 'c7', shortSha: 'd4e5f6g', message: 'Implement dark mode toggle', author: 'Jane', date: '4 hours ago', branch: 'feature/ui', parents: ['c5'], isMerge: false, lane: 2, color: BRANCH_COLORS[2] },
    { sha: 'c6', shortSha: 'e5f6g7h', message: 'Add JWT validation', author: 'Alex', date: '5 hours ago', branch: 'feature/auth', parents: ['c4'], isMerge: false, lane: 1, color: BRANCH_COLORS[1] },
    { sha: 'c5', shortSha: 'f6g7h8i', message: 'Refactor API endpoints', author: 'John', date: '6 hours ago', branch: 'main', parents: ['c2'], isMerge: false, lane: 0, color: BRANCH_COLORS[0] },
    { sha: 'c4', shortSha: 'g7h8i9j', message: 'Add login form', author: 'Alex', date: '1 day ago', branch: 'feature/auth', parents: ['c3'], isMerge: false, lane: 1, color: BRANCH_COLORS[1] },
    { sha: 'c3', shortSha: 'h8i9j0k', message: 'Create auth service', author: 'Alex', date: '1 day ago', branch: 'feature/auth', parents: ['c2'], isMerge: false, lane: 1, color: BRANCH_COLORS[1] },
    { sha: 'c2', shortSha: 'i9j0k1l', message: 'Add base components', author: 'John', date: '2 days ago', branch: 'main', parents: ['c1'], isMerge: false, lane: 0, color: BRANCH_COLORS[0] },
    { sha: 'c1', shortSha: 'j0k1l2m', message: 'Initial commit', author: 'John', date: '3 days ago', branch: 'main', parents: [], isMerge: false, lane: 0, color: BRANCH_COLORS[0] },
  ],
};

// Graph dimensions
const NODE_RADIUS = 8;
const LANE_WIDTH = 30;
const ROW_HEIGHT = 60;
const LEFT_PADDING = 20;

interface CommitNodeProps {
  commit: GraphCommit;
  index: number;
  selectedSha: string | null;
  onSelect: (sha: string) => void;
  onOpenMenu: (commit: GraphCommit, position: { x: number; y: number }) => void;
}

function CommitNode({ commit, index, selectedSha, onSelect, onOpenMenu }: CommitNodeProps) {
  const x = LEFT_PADDING + commit.lane * LANE_WIDTH;
  const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;
  const isSelected = selectedSha === commit.sha;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenMenu(commit, { x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onOpenMenu(commit, { x: e.clientX, y: e.clientY });
  };

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(commit.sha)}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Outer glow for selected */}
      {isSelected && (
        <motion.circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 12}
          fill={`${commit.color}20`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Selection ring */}
      {isSelected && (
        <motion.circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 6}
          fill="transparent"
          stroke="#fff"
          strokeWidth={2}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        />
      )}

      {/* Merge indicator */}
      {commit.isMerge && (
        <motion.circle
          cx={x}
          cy={y}
          r={NODE_RADIUS + 4}
          fill="transparent"
          stroke={commit.color}
          strokeWidth={2}
          strokeDasharray="4 2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.1 }}
        />
      )}

      {/* Commit node */}
      <motion.circle
        cx={x}
        cy={y}
        r={isSelected ? NODE_RADIUS + 2 : NODE_RADIUS}
        fill={commit.color}
        stroke={isSelected ? '#fff' : 'transparent'}
        strokeWidth={2}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: index * 0.05 }}
      />

      {/* Inner dot for selected */}
      {isSelected && (
        <circle
          cx={x}
          cy={y}
          r={3}
          fill="#fff"
        />
      )}
    </g>
  );
}

interface BranchLineProps {
  commits: GraphCommit[];
  allCommits: GraphCommit[];
}

function BranchLines({ commits, allCommits }: BranchLineProps) {
  const lines: JSX.Element[] = [];

  commits.forEach((commit, index) => {
    const x = LEFT_PADDING + commit.lane * LANE_WIDTH;
    const y = index * ROW_HEIGHT + ROW_HEIGHT / 2;

    // Draw lines to parent commits
    commit.parents.forEach((parentSha) => {
      const parentIndex = allCommits.findIndex((c) => c.sha === parentSha);
      if (parentIndex !== -1) {
        const parent = allCommits[parentIndex];
        const parentX = LEFT_PADDING + parent.lane * LANE_WIDTH;
        const parentY = parentIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

        // Determine if this is a merge line (crossing lanes)
        const isCrossing = commit.lane !== parent.lane;

        if (isCrossing) {
          // Draw curved merge line
          const midY = (y + parentY) / 2;
          lines.push(
            <motion.path
              key={`${commit.sha}-${parentSha}`}
              d={`M ${x} ${y} C ${x} ${midY}, ${parentX} ${midY}, ${parentX} ${parentY}`}
              fill="none"
              stroke={commit.isMerge ? parent.color : commit.color}
              strokeWidth={2}
              opacity={0.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            />
          );
        } else {
          // Draw straight line
          lines.push(
            <motion.line
              key={`${commit.sha}-${parentSha}`}
              x1={x}
              y1={y}
              x2={parentX}
              y2={parentY}
              stroke={commit.color}
              strokeWidth={2}
              opacity={0.6}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            />
          );
        }
      }
    });
  });

  return <g>{lines}</g>;
}

interface CommitDetailsProps {
  commit: GraphCommit;
}

function CommitDetails({ commit }: CommitDetailsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${commit.color}20` }}
        >
          {commit.isMerge ? (
            <GitMerge size={20} style={{ color: commit.color }} />
          ) : (
            <GitCommit size={20} style={{ color: commit.color }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {commit.message}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {commit.author} • {commit.date}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${commit.color}20`, color: commit.color }}
        >
          {commit.branch}
        </span>
        <code className="px-2 py-0.5 rounded bg-surface text-text-muted font-mono">
          {commit.shortSha}
        </code>
      </div>

      {commit.parents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-xs text-text-muted mb-1">Parents:</p>
          <div className="flex gap-2">
            {commit.parents.map((p) => (
              <code
                key={p}
                className="px-2 py-0.5 rounded bg-surface text-text-muted font-mono text-xs"
              >
                {p.slice(0, 7)}
              </code>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface BranchLegendProps {
  branches: GraphBranch[];
}

function BranchLegend({ branches }: BranchLegendProps) {
  return (
    <div className="flex flex-wrap gap-3 p-3 border-b border-white/5">
      {branches.map((branch) => (
        <div
          key={branch.name}
          className={cn(
            'flex items-center gap-2 px-2.5 py-1 rounded-full text-xs',
            branch.isCurrent && 'ring-1 ring-white/20'
          )}
          style={{ backgroundColor: `${branch.color}15` }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: branch.color }}
          />
          <span style={{ color: branch.color }}>{branch.name}</span>
          {branch.isCurrent && (
            <span className="text-[10px] uppercase text-text-muted">current</span>
          )}
        </div>
      ))}
    </div>
  );
}

interface BranchGraphProps {
  selectedBranch?: string | null;
}

// Dialog state types
interface ContextMenuState {
  commit: GraphCommit;
  position: { x: number; y: number };
}

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  action: () => void;
}

interface InputDialogState {
  title: string;
  placeholder: string;
  confirmLabel: string;
  icon: React.ReactNode;
  action: (value: string) => void;
}

export function BranchGraph({ selectedBranch }: BranchGraphProps) {
  const { commits, branches } = mockGraphData;
  const [selectedSha, setSelectedSha] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [inputDialog, setInputDialog] = useState<InputDialogState | null>(null);
  const [diffViewer, setDiffViewer] = useState<GraphCommit | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Get current branch name (mock for now)
  const currentBranch = branches.find(b => b.isCurrent)?.name || 'main';

  // Filter commits if a branch is selected
  const filteredCommits = useMemo(() => {
    if (!selectedBranch) return commits;
    const branch = branches.find((b) => b.name === selectedBranch);
    if (!branch) return commits;
    return commits.filter((c) => branch.commits.includes(c.sha) || c.branch === 'main');
  }, [commits, branches, selectedBranch]);

  const selectedCommit = commits.find((c) => c.sha === selectedSha);
  const graphHeight = filteredCommits.length * ROW_HEIGHT + ROW_HEIGHT;
  const graphWidth = (branches.length + 1) * LANE_WIDTH + LEFT_PADDING * 2;

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle opening the action menu (right-click or double-click)
  const handleOpenMenu = (commit: GraphCommit, position: { x: number; y: number }) => {
    // Close any existing menu first, then open new one
    setContextMenu({ commit, position });
    setSelectedSha(commit.sha);
  };

  // Handle commit action
  const handleAction = async (action: CommitAction) => {
    if (!contextMenu) return;
    const commit = contextMenu.commit;

    switch (action) {
      case 'view-changes':
        setContextMenu(null);
        setDiffViewer(commit);
        break;

      case 'copy-sha':
        await navigator.clipboard.writeText(commit.sha);
        showNotification(`Copied ${commit.shortSha} to clipboard`, 'success');
        setContextMenu(null);
        break;

      case 'cherry-pick':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Cherry-pick Commit',
          message: `Apply commit "${commit.message}" to the current branch (${currentBranch})?`,
          confirmLabel: 'Cherry-pick',
          danger: false,
          action: async () => {
            try {
              await invoke('cherry_pick_commit', { sha: commit.sha });
              showNotification('Commit cherry-picked successfully', 'success');
            } catch (e) {
              showNotification(`Failed to cherry-pick: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'revert':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Revert Commit',
          message: `Create a new commit that undoes the changes from "${commit.message}"?`,
          confirmLabel: 'Revert',
          danger: false,
          action: async () => {
            try {
              await invoke('revert_commit', { sha: commit.sha });
              showNotification('Commit reverted successfully', 'success');
            } catch (e) {
              showNotification(`Failed to revert: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'reset-soft':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Soft Reset',
          message: `Reset ${currentBranch} to this commit? Changes will be kept staged.`,
          confirmLabel: 'Reset',
          danger: false,
          action: async () => {
            try {
              await invoke('reset_to_commit', { sha: commit.sha, resetType: 'soft' });
              showNotification('Branch reset (soft) successfully', 'success');
            } catch (e) {
              showNotification(`Failed to reset: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'reset-mixed':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Mixed Reset',
          message: `Reset ${currentBranch} to this commit? Changes will be unstaged but preserved.`,
          confirmLabel: 'Reset',
          danger: false,
          action: async () => {
            try {
              await invoke('reset_to_commit', { sha: commit.sha, resetType: 'mixed' });
              showNotification('Branch reset (mixed) successfully', 'success');
            } catch (e) {
              showNotification(`Failed to reset: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'reset-hard':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Hard Reset',
          message: `Reset ${currentBranch} to this commit? WARNING: All uncommitted changes will be permanently lost!`,
          confirmLabel: 'Hard Reset',
          danger: true,
          action: async () => {
            try {
              await invoke('reset_to_commit', { sha: commit.sha, resetType: 'hard' });
              showNotification('Branch reset (hard) successfully', 'success');
            } catch (e) {
              showNotification(`Failed to reset: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'create-branch':
        setContextMenu(null);
        setInputDialog({
          title: 'Create Branch from Commit',
          placeholder: 'feature/new-branch',
          confirmLabel: 'Create Branch',
          icon: <GitBranch size={24} />,
          action: async (name: string) => {
            try {
              await invoke('create_branch', { name, fromSha: commit.sha });
              showNotification(`Branch '${name}' created`, 'success');
            } catch (e) {
              showNotification(`Failed to create branch: ${e}`, 'error');
            }
            setInputDialog(null);
          },
        });
        break;

      case 'create-tag':
        setContextMenu(null);
        setInputDialog({
          title: 'Create Tag',
          placeholder: 'v1.0.0',
          confirmLabel: 'Create Tag',
          icon: <Tag size={24} />,
          action: async (name: string) => {
            try {
              await invoke('create_tag', { sha: commit.sha, tagName: name, message: null });
              showNotification(`Tag '${name}' created`, 'success');
            } catch (e) {
              showNotification(`Failed to create tag: ${e}`, 'error');
            }
            setInputDialog(null);
          },
        });
        break;

      case 'checkout':
        setContextMenu(null);
        setConfirmDialog({
          title: 'Checkout Commit',
          message: `Switch to commit ${commit.shortSha}? This will put you in a detached HEAD state.`,
          confirmLabel: 'Checkout',
          danger: false,
          action: async () => {
            try {
              await invoke('checkout_commit', { sha: commit.sha });
              showNotification('Checked out commit (detached HEAD)', 'success');
            } catch (e) {
              showNotification(`Failed to checkout: ${e}`, 'error');
            }
            setConfirmDialog(null);
          },
        });
        break;

      case 'compare':
        showNotification('Compare feature coming soon', 'success');
        setContextMenu(null);
        break;

      case 'rebase':
        showNotification('Interactive rebase coming soon', 'success');
        setContextMenu(null);
        break;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <BranchLegend branches={branches} />

      <div className="flex-1 flex overflow-hidden">
        {/* Graph + Commit List Container */}
        <div className="flex-1 overflow-auto p-4">
          <div className="flex" style={{ minHeight: graphHeight }}>
            {/* SVG Graph */}
            <div className="flex-shrink-0" style={{ width: graphWidth }} data-context-menu>
              <svg width={graphWidth} height={graphHeight}>
                {/* Background lane lines */}
                {branches.map((branch) => (
                  <line
                    key={branch.name}
                    x1={LEFT_PADDING + branch.lane * LANE_WIDTH}
                    y1={0}
                    x2={LEFT_PADDING + branch.lane * LANE_WIDTH}
                    y2={graphHeight}
                    stroke={branch.color}
                    strokeWidth={1}
                    opacity={0.1}
                  />
                ))}

                {/* Branch connection lines */}
                <BranchLines commits={filteredCommits} allCommits={commits} />

                {/* Commit nodes */}
                {filteredCommits.map((commit, index) => (
                  <CommitNode
                    key={commit.sha}
                    commit={commit}
                    index={index}
                    selectedSha={selectedSha}
                    onSelect={setSelectedSha}
                    onOpenMenu={handleOpenMenu}
                  />
                ))}
              </svg>
            </div>

            {/* Commit list alongside graph */}
            <div className="flex-1 ml-4" data-context-menu>
              {filteredCommits.map((commit) => (
                <div
                  key={commit.sha}
                  className="flex items-center"
                  style={{ height: ROW_HEIGHT }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleOpenMenu(commit, { x: e.clientX, y: e.clientY });
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    handleOpenMenu(commit, { x: e.clientX, y: e.clientY });
                  }}
                >
                  <button
                    onClick={() => setSelectedSha(commit.sha)}
                    className={cn(
                      'text-left px-3 py-1.5 rounded-lg transition-colors w-full',
                      selectedSha === commit.sha
                        ? 'bg-accent-primary/15'
                        : 'hover:bg-hover'
                    )}
                  >
                    <p className="text-sm text-text-primary truncate">{commit.message}</p>
                    <p className="text-xs text-text-muted">
                      {commit.author} • {commit.date}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Details panel */}
        {selectedCommit && (
          <div className="w-80 flex-shrink-0 border-l border-white/5 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-text-secondary mb-3">
              Commit Details
            </h3>
            <CommitDetails commit={selectedCommit} />
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <CommitActionMenu
            commit={{
              sha: contextMenu.commit.sha,
              shortSha: contextMenu.commit.shortSha,
              message: contextMenu.commit.message,
              author: contextMenu.commit.author,
              date: contextMenu.commit.date,
              branch: contextMenu.commit.branch,
              color: contextMenu.commit.color,
            }}
            position={contextMenu.position}
            currentBranch={currentBranch}
            onClose={() => setContextMenu(null)}
            onAction={handleAction}
          />
        )}
      </AnimatePresence>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <ConfirmDialog
            title={confirmDialog.title}
            message={confirmDialog.message}
            confirmLabel={confirmDialog.confirmLabel}
            danger={confirmDialog.danger}
            onConfirm={confirmDialog.action}
            onCancel={() => setConfirmDialog(null)}
          />
        )}
      </AnimatePresence>

      {/* Input Dialog */}
      <AnimatePresence>
        {inputDialog && (
          <InputDialog
            title={inputDialog.title}
            placeholder={inputDialog.placeholder}
            confirmLabel={inputDialog.confirmLabel}
            icon={inputDialog.icon}
            onConfirm={inputDialog.action}
            onCancel={() => setInputDialog(null)}
          />
        )}
      </AnimatePresence>

      {/* Diff Viewer */}
      <AnimatePresence>
        {diffViewer && (
          <DiffViewerModal
            commit={{
              sha: diffViewer.sha,
              shortSha: diffViewer.shortSha,
              message: diffViewer.message,
              author: diffViewer.author,
              date: diffViewer.date,
              branch: diffViewer.branch,
              color: diffViewer.color,
            }}
            onClose={() => setDiffViewer(null)}
          />
        )}
      </AnimatePresence>

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50',
              notification.type === 'success'
                ? 'bg-status-added/90 text-white'
                : 'bg-status-deleted/90 text-white'
            )}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

