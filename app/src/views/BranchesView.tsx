import { useState } from 'react';
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
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepoStore, Branch } from '@/stores/repo';
import { useBranches } from '@/hooks/useGit';
import { BranchGraph } from '@/components/git/BranchGraph';

// Mock commit data for list view
const mockCommits = [
  { sha: 'a1b2c3d4e5f6', shortSha: 'a1b2c3d', message: 'Merge feature/auth into main', author: 'John Doe', email: 'john@example.com', date: '1 hour ago', branch: 'main', isMerge: true },
  { sha: 'b2c3d4e5f6g7', shortSha: 'b2c3d4e', message: 'Add responsive styles for mobile', author: 'Jane Smith', email: 'jane@example.com', date: '2 hours ago', branch: 'feature/ui', isMerge: false },
  { sha: 'c3d4e5f6g7h8', shortSha: 'c3d4e5f', message: 'Update dependencies to latest versions', author: 'John Doe', email: 'john@example.com', date: '3 hours ago', branch: 'main', isMerge: false },
  { sha: 'd4e5f6g7h8i9', shortSha: 'd4e5f6g', message: 'Implement dark mode toggle component', author: 'Jane Smith', email: 'jane@example.com', date: '4 hours ago', branch: 'feature/ui', isMerge: false },
  { sha: 'e5f6g7h8i9j0', shortSha: 'e5f6g7h', message: 'Add JWT token validation middleware', author: 'Alex Johnson', email: 'alex@example.com', date: '5 hours ago', branch: 'feature/auth', isMerge: false },
  { sha: 'f6g7h8i9j0k1', shortSha: 'f6g7h8i', message: 'Refactor API endpoints for consistency', author: 'John Doe', email: 'john@example.com', date: '6 hours ago', branch: 'main', isMerge: false },
  { sha: 'g7h8i9j0k1l2', shortSha: 'g7h8i9j', message: 'Add login form with validation', author: 'Alex Johnson', email: 'alex@example.com', date: '1 day ago', branch: 'feature/auth', isMerge: false },
  { sha: 'h8i9j0k1l2m3', shortSha: 'h8i9j0k', message: 'Create authentication service', author: 'Alex Johnson', email: 'alex@example.com', date: '1 day ago', branch: 'feature/auth', isMerge: false },
  { sha: 'i9j0k1l2m3n4', shortSha: 'i9j0k1l', message: 'Add base UI components library', author: 'John Doe', email: 'john@example.com', date: '2 days ago', branch: 'main', isMerge: false },
  { sha: 'j0k1l2m3n4o5', shortSha: 'j0k1l2m', message: 'Initial commit - project setup', author: 'John Doe', email: 'john@example.com', date: '3 days ago', branch: 'main', isMerge: false },
];

// Branch colors
const BRANCH_COLORS: Record<string, string> = {
  'main': '#00D9FF',
  'feature/auth': '#BD00FF',
  'feature/ui': '#FF006B',
};

function CommitListView({ selectedBranch }: { selectedBranch: string | null }) {
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  // Filter commits by branch if selected
  const commits = selectedBranch
    ? mockCommits.filter(c => c.branch === selectedBranch || c.branch === 'main')
    : mockCommits;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <GitCommit size={16} className="text-text-muted" />
          <span className="text-sm font-medium text-text-primary">
            {selectedBranch ? `Commits on ${selectedBranch}` : 'All Commits'}
          </span>
          <span className="text-xs text-text-muted">({commits.length})</span>
        </div>
      </div>

      {/* Commit List */}
      <div className="flex-1 overflow-y-auto">
        {commits.map((commit) => {
          const branchColor = BRANCH_COLORS[commit.branch] || '#888';
          const isSelected = selectedCommit === commit.sha;

          return (
            <div
              key={commit.sha}
              onClick={() => setSelectedCommit(commit.sha)}
              onDoubleClick={() => {/* Open action menu */}}
              className={cn(
                'flex items-start gap-3 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors',
                isSelected ? 'bg-accent-primary/10' : 'hover:bg-hover'
              )}
              data-context-menu
            >
              {/* Branch indicator */}
              <div className="flex flex-col items-center pt-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: branchColor }}
                />
                <div
                  className="w-0.5 flex-1 mt-1"
                  style={{ backgroundColor: `${branchColor}40` }}
                />
              </div>

              {/* Commit info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {commit.message}
                  </p>
                  {commit.isMerge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent-secondary/20 text-accent-secondary">
                      MERGE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{commit.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{commit.date}</span>
                  </div>
                  <code className="px-1.5 py-0.5 rounded bg-surface font-mono">
                    {commit.shortSha}
                  </code>
                </div>

                {/* Branch tag */}
                <div className="mt-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: `${branchColor}20`, color: branchColor }}
                  >
                    <GitBranch size={10} />
                    {commit.branch}
                  </span>
                </div>
              </div>

              {/* Actions on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="p-1.5 rounded hover:bg-surface text-text-muted hover:text-text-primary"
                  title="View changes"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mock data for demonstration
const mockBranches: Branch[] = [
  { name: 'main', isRemote: false, isCurrent: true, upstream: 'origin/main', ahead: 0, behind: 0 },
  { name: 'feature/auth', isRemote: false, isCurrent: false, upstream: 'origin/feature/auth', ahead: 2, behind: 0 },
  { name: 'feature/ui-redesign', isRemote: false, isCurrent: false, ahead: 5, behind: 1 },
  { name: 'bugfix/nav-issue', isRemote: false, isCurrent: false, ahead: 1, behind: 0 },
  { name: 'origin/main', isRemote: true, isCurrent: false, ahead: 0, behind: 0 },
  { name: 'origin/feature/auth', isRemote: true, isCurrent: false, ahead: 0, behind: 0 },
  { name: 'origin/develop', isRemote: true, isCurrent: false, ahead: 0, behind: 0 },
];

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
  const { branches: repoBranches } = useRepoStore();
  const { checkoutBranch, deleteBranch, mergeBranch, createBranch } = useBranches();
  const [expandedSections, setExpandedSections] = useState({
    local: true,
    remote: true,
  });
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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

  // Use mock data if no real branches
  const branches = repoBranches.length > 0 ? repoBranches : mockBranches;

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);

  const toggleSection = (section: 'local' | 'remote') => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Branch List */}
      <div className="w-80 flex flex-col border-r border-white/5">
        {/* Header */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-primary">Branches</h2>
            <button
              onClick={() => setShowNewBranchModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-xs font-medium transition-colors"
            >
              <Plus size={14} />
              New
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-surface rounded-lg">
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

        {/* Branch List */}
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

      {/* Right Panel - Branch Visualization or List */}
      <div className="flex-1 bg-void overflow-hidden">
        {viewMode === 'graph' ? (
          <BranchGraph selectedBranch={selectedBranch} />
        ) : (
          <CommitListView selectedBranch={selectedBranch} />
        )}
      </div>

      {/* New Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 bg-void/60 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md p-6"
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
