import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch,
  Plus,
  Trash2,
  GitMerge,
  Check,
  Cloud,
  ChevronDown,
  ChevronRight,
  Network,
  List,
  GitCommit,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepoStore, Branch } from '@/stores/repo';
import { useBranches, useCommits } from '@/hooks/useGit';
import { BranchGraph } from '@/components/git/BranchGraph';

// Branch colors for visualization
const BRANCH_COLORS = [
  '#00D9FF', // cyan - main
  '#BD00FF', // purple
  '#FF006B', // magenta
  '#00FF94', // green
  '#FFB800', // orange
];

// Commit list component using real data from store
function CommitListPanel({
  selectedBranch,
  selectedCommit,
  onSelectCommit
}: {
  selectedBranch: string | null;
  selectedCommit: string | null;
  onSelectCommit: (sha: string) => void;
}) {
  const { commits } = useRepoStore();
  const { fetchCommits } = useCommits();

  // Load commits on mount
  useEffect(() => {
    fetchCommits(100);
  }, [fetchCommits]);

  // Show empty state if no commits
  if (commits.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <GitCommit size={40} className="mx-auto text-text-ghost mb-3" />
          <p className="text-sm text-text-muted">No commits yet</p>
          <p className="text-xs text-text-ghost mt-1">Make your first commit to see history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <GitCommit size={14} className="text-text-muted" />
          <span className="text-xs font-medium text-text-primary">
            {selectedBranch ? `Commits on ${selectedBranch}` : 'All Commits'}
          </span>
          <span className="text-[10px] text-text-muted">({commits.length})</span>
        </div>
      </div>

      {/* Simple Commit List */}
      <div className="flex-1 overflow-y-auto">
        {commits.map((commit, index) => {
          const isSelected = selectedCommit === commit.sha;
          const isMerge = commit.parents.length > 1;
          const color = BRANCH_COLORS[index % BRANCH_COLORS.length];

          return (
            <div
              key={commit.sha}
              onClick={() => onSelectCommit(commit.sha)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors border-b border-white/5',
                isSelected ? 'bg-accent-primary/10' : 'hover:bg-hover'
              )}
            >
              {/* Commit indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />

              {/* Commit info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-primary truncate">
                  {commit.message}
                </p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                  <span className="truncate max-w-[100px]">{commit.author}</span>
                  <span>•</span>
                  <span>{commit.date}</span>
                  {isMerge && (
                    <span className="px-1 py-0.5 rounded text-[8px] font-medium bg-accent-secondary/20 text-accent-secondary">
                      merge
                    </span>
                  )}
                </div>
              </div>

              {/* Short SHA */}
              <code className="text-[10px] font-mono text-text-muted flex-shrink-0">
                {commit.shortSha}
              </code>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Commit details panel for the right side
function CommitDetailsPanel({ selectedCommit }: { selectedCommit: string | null }) {
  const { commits } = useRepoStore();
  const selectedCommitData = selectedCommit
    ? commits.find(c => c.sha === selectedCommit)
    : null;

  if (!selectedCommitData) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <GitCommit size={40} className="mx-auto text-text-ghost mb-3" />
          <p className="text-sm text-text-muted">Select a commit</p>
          <p className="text-xs text-text-ghost mt-1">to view details</p>
        </div>
      </div>
    );
  }

  const isMerge = selectedCommitData.parents.length > 1;
  const commitColor = BRANCH_COLORS[0]; // Use primary color

  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="text-sm font-medium text-text-secondary mb-3">
        Commit Details
      </h3>
      <div className="glass-card p-4">
        {/* Commit header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${commitColor}20` }}
          >
            {isMerge ? (
              <GitMerge size={20} style={{ color: commitColor }} />
            ) : (
              <GitCommit size={20} style={{ color: commitColor }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary">
              {selectedCommitData.message}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {selectedCommitData.author} • {selectedCommitData.date}
            </p>
          </div>
        </div>

        {/* SHA */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface mb-3">
          <span className="text-xs text-text-muted">SHA:</span>
          <code className="text-xs font-mono text-accent-primary">{selectedCommitData.sha}</code>
        </div>

        {/* Parents (for merge commits) */}
        {isMerge && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-text-muted">Parents:</span>
            <div className="flex gap-1">
              {selectedCommitData.parents.map((parent, i) => (
                <code key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-text-muted">
                  {parent.slice(0, 7)}
                </code>
              ))}
            </div>
          </div>
        )}

        {/* Author info */}
        <div className="border-t border-white/5 pt-4">
          <h4 className="text-xs font-medium text-text-secondary mb-2">Author</h4>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
              <User size={16} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-sm text-text-primary">{selectedCommitData.author}</p>
              <p className="text-xs text-text-muted">{selectedCommitData.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


function BranchItem({ branch, isSelected, onSelect, onCheckout, onDelete, onMerge }: {
  branch: Branch;
  isSelected: boolean;
  onSelect: () => void;
  onCheckout: () => void;
  onDelete: () => void;
  onMerge: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer',
        isSelected ? 'bg-accent-secondary/20 ring-1 ring-accent-secondary/50' :
        branch.isCurrent ? 'bg-accent-primary/15' : 'hover:bg-hover'
      )}
    >
      <GitBranch
        size={16}
        className={cn(
          branch.isCurrent ? 'text-accent-primary' : 'text-text-muted'
        )}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium truncate',
              branch.isCurrent ? 'text-accent-primary' : 'text-text-primary'
            )}
          >
            {branch.name}
          </span>
          {branch.isCurrent && (
            <span className="px-1.5 py-0.5 rounded bg-accent-primary/20 text-[10px] font-medium text-accent-primary uppercase">
              Current
            </span>
          )}
        </div>

        {(branch.ahead > 0 || branch.behind > 0) && (
          <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
            {branch.ahead > 0 && <span className="text-status-added">↑{branch.ahead}</span>}
            {branch.behind > 0 && <span className="text-status-modified">↓{branch.behind}</span>}
            {branch.upstream && <span>• {branch.upstream}</span>}
          </div>
        )}
      </div>

      {/* Actions */}
      {!branch.isCurrent && !branch.isRemote && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onCheckout}
            className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-accent-primary transition-colors"
            title="Checkout"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onMerge}
            className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-accent-secondary transition-colors"
            title="Merge into current"
          >
            <GitMerge size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-status-deleted transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function BranchSection({
  title,
  icon,
  branches,
  isExpanded,
  onToggle,
  selectedBranch,
  onSelectBranch,
  onCheckout,
  onDelete,
  onMerge,
}: {
  title: string;
  icon: React.ReactNode;
  branches: Branch[];
  isExpanded: boolean;
  onToggle: () => void;
  selectedBranch: string | null;
  onSelectBranch: (name: string) => void;
  onCheckout: (name: string) => void;
  onDelete: (name: string) => void;
  onMerge: (name: string) => void;
}) {
  if (branches.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-2 py-1.5 text-text-secondary hover:text-text-primary transition-colors"
      >
        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        <span className="ml-auto text-xs text-text-muted">{branches.length}</span>
      </button>

      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-1 space-y-0.5"
        >
          {branches.map((branch) => (
            <BranchItem
              key={branch.name}
              branch={branch}
              isSelected={selectedBranch === branch.name}
              onSelect={() => onSelectBranch(branch.name)}
              onCheckout={() => onCheckout(branch.name)}
              onDelete={() => onDelete(branch.name)}
              onMerge={() => onMerge(branch.name)}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function BranchesView() {
  const { branches: repoBranches, repo } = useRepoStore();
  const { fetchBranches, checkoutBranch, deleteBranch, mergeBranch, createBranch } = useBranches();
  const [expandedSections, setExpandedSections] = useState({
    local: true,
    remote: true,
  });
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load branches when repo is available
  useEffect(() => {
    if (repo) {
      fetchBranches();
    }
  }, [repo, fetchBranches]);

  // Show notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Branch action handlers
  const handleCheckout = async (name: string) => {
    try {
      await checkoutBranch(name);
      showNotification(`Switched to ${name}`, 'success');
    } catch (e) {
      showNotification(`Failed to checkout: ${e}`, 'error');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete branch "${name}"?`)) return;
    try {
      await deleteBranch(name);
      showNotification(`Deleted branch ${name}`, 'success');
    } catch (e) {
      showNotification(`Failed to delete: ${e}`, 'error');
    }
  };

  const handleMerge = async (name: string) => {
    try {
      await mergeBranch(name);
      showNotification(`Merged ${name} into current branch`, 'success');
    } catch (e) {
      showNotification(`Failed to merge: ${e}`, 'error');
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName) return;
    try {
      await createBranch(newBranchName);
      showNotification(`Created branch ${newBranchName}`, 'success');
      setShowNewBranchModal(false);
      setNewBranchName('');
    } catch (e) {
      showNotification(`Failed to create branch: ${e}`, 'error');
    }
  };

  // Use real branches from the repository
  const localBranches = repoBranches.filter((b) => !b.isRemote);
  const remoteBranches = repoBranches.filter((b) => b.isRemote);

  const toggleSection = (section: 'local' | 'remote') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Always visible */}
      <div className="flex-shrink-0 p-3 border-b border-white/5">
        <div className="glass-card p-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-primary">Branches</h2>
            <button
              onClick={() => setShowNewBranchModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary text-xs font-medium transition-colors"
            >
              <Plus size={14} />
              New
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-surface/50 rounded-lg">
            <button
              onClick={() => setViewMode('graph')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center',
                viewMode === 'graph'
                  ? 'bg-accent-primary text-void'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Network size={14} />
              Graph
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex-1 justify-center',
                viewMode === 'list'
                  ? 'bg-accent-primary text-void'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <List size={14} />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'graph' ? (
          <>
            {/* Graph Mode: Left panel with branches, right panel with graph */}
            <div className="w-64 flex flex-col border-r border-white/5">
              <div className="flex-1 overflow-y-auto p-2">
                <BranchSection
                  title="Local"
                  icon={<GitBranch size={14} />}
                  branches={localBranches}
                  isExpanded={expandedSections.local}
                  onToggle={() => toggleSection('local')}
                  selectedBranch={selectedBranch}
                  onSelectBranch={setSelectedBranch}
                  onCheckout={handleCheckout}
                  onDelete={handleDelete}
                  onMerge={handleMerge}
                />

                <BranchSection
                  title="Remote"
                  icon={<Cloud size={14} />}
                  branches={remoteBranches}
                  isExpanded={expandedSections.remote}
                  onToggle={() => toggleSection('remote')}
                  selectedBranch={selectedBranch}
                  onSelectBranch={setSelectedBranch}
                  onCheckout={handleCheckout}
                  onDelete={handleDelete}
                  onMerge={handleMerge}
                />
              </div>
            </div>

            {/* Graph visualization */}
            <div className="flex-1 bg-transparent overflow-hidden">
              <BranchGraph selectedBranch={selectedBranch} />
            </div>
          </>
        ) : (
          <>
            {/* List Mode: Local/Remote on left, Commits in middle, Details on right */}
            {/* Left: Local/Remote Branches */}
            <div className="w-56 flex flex-col border-r border-white/5">
              <div className="flex-1 overflow-y-auto p-2">
                <BranchSection
                  title="Local"
                  icon={<GitBranch size={14} />}
                  branches={localBranches}
                  isExpanded={expandedSections.local}
                  onToggle={() => toggleSection('local')}
                  selectedBranch={selectedBranch}
                  onSelectBranch={setSelectedBranch}
                  onCheckout={handleCheckout}
                  onDelete={handleDelete}
                  onMerge={handleMerge}
                />

                <BranchSection
                  title="Remote"
                  icon={<Cloud size={14} />}
                  branches={remoteBranches}
                  isExpanded={expandedSections.remote}
                  onToggle={() => toggleSection('remote')}
                  selectedBranch={selectedBranch}
                  onSelectBranch={setSelectedBranch}
                  onCheckout={handleCheckout}
                  onDelete={handleDelete}
                  onMerge={handleMerge}
                />
              </div>
            </div>

            {/* Middle: Commits with SVG Graph */}
            <div className="flex-1 border-r border-white/5">
              <CommitListPanel
                selectedBranch={selectedBranch}
                selectedCommit={selectedCommit}
                onSelectCommit={setSelectedCommit}
              />
            </div>

            {/* Right: Commit Details */}
            <div className="w-72 flex-shrink-0">
              <CommitDetailsPanel selectedCommit={selectedCommit} />
            </div>
          </>
        )}
      </div>

      {/* New Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 bg-void/60  flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-card w-full max-w-md p-6"
          >
            <h3 className="text-lg font-medium text-text-primary mb-4">Create New Branch</h3>

            <input
              type="text"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="Branch name (e.g., feature/my-feature)"
              className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50 mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateBranch()}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewBranchModal(false);
                  setNewBranchName('');
                }}
                className="px-4 py-2 rounded-lg bg-elevated hover:bg-hover text-text-secondary text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBranch}
                disabled={!newBranchName}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  newBranchName
                    ? 'bg-accent-primary text-void hover:shadow-glow-sm'
                    : 'bg-elevated text-text-muted cursor-not-allowed'
                )}
              >
                Create Branch
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
                ? 'bg-status-added/20 border border-status-added/30 text-status-added'
                : 'bg-status-deleted/20 border border-status-deleted/30 text-status-deleted'
            )}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
