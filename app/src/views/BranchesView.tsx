import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitBranch,
  Plus,
  Trash2,
  GitMerge,
  Check,
  Cloud,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepoStore, Branch } from '@/stores/repo';

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

function BranchItem({ branch, onCheckout, onDelete, onMerge }: {
  branch: Branch;
  onCheckout: () => void;
  onDelete: () => void;
  onMerge: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
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
}: {
  title: string;
  icon: React.ReactNode;
  branches: Branch[];
  isExpanded: boolean;
  onToggle: () => void;
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
              onCheckout={() => {}}
              onDelete={() => {}}
              onMerge={() => {}}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

export function BranchesView() {
  const { branches: repoBranches } = useRepoStore();
  const [expandedSections, setExpandedSections] = useState({
    local: true,
    remote: true,
  });
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');

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
        <div className="p-3 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-text-primary">Branches</h2>
          <button
            onClick={() => setShowNewBranchModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary text-xs font-medium transition-colors"
          >
            <Plus size={14} />
            New Branch
          </button>
        </div>

        {/* Branch List */}
        <div className="flex-1 overflow-y-auto p-2">
          <BranchSection
            title="Local"
            icon={<GitBranch size={14} />}
            branches={localBranches}
            isExpanded={expandedSections.local}
            onToggle={() => toggleSection('local')}
          />

          <BranchSection
            title="Remote"
            icon={<Cloud size={14} />}
            branches={remoteBranches}
            isExpanded={expandedSections.remote}
            onToggle={() => toggleSection('remote')}
          />
        </div>
      </div>

      {/* Right Panel - Branch Visualization */}
      <div className="flex-1 flex items-center justify-center bg-void">
        <div className="text-center text-text-muted">
          <GitBranch size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">Branch visualization</p>
          <p className="text-xs mt-1">River Flow graph coming soon</p>
        </div>
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
    </div>
  );
}
