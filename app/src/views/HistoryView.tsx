import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit,
  GitMerge,
  User,
  Calendar,
  Copy,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRepoStore, Commit } from '@/stores/repo';
import { useCommits } from '@/hooks/useGit';

function CommitNode({ commit, isSelected, onClick }: { commit: Commit; isSelected: boolean; onClick: () => void }) {
  const isMerge = commit.parents.length > 1;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={cn(
        'flex items-start gap-4 px-4 py-3 cursor-pointer transition-colors border-b border-white/5',
        isSelected ? 'bg-accent-primary/10' : 'hover:bg-hover'
      )}
    >
      {/* Graph visualization placeholder */}
      <div className="flex-shrink-0 w-8 flex flex-col items-center">
        <div
          className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center',
            isMerge ? 'bg-accent-secondary' : 'bg-accent-primary',
            isSelected && 'ring-2 ring-accent-primary/50'
          )}
        >
          {isMerge ? (
            <GitMerge size={10} className="text-void" />
          ) : (
            <GitCommit size={10} className="text-void" />
          )}
        </div>
        <div className="w-0.5 flex-1 bg-branch-1/30 mt-1" />
      </div>

      {/* Commit info */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', isSelected && 'text-accent-primary')}>
          {commit.message}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <User size={12} />
            {commit.author}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {commit.date}
          </span>
          <span className="font-mono text-text-ghost">{commit.shortSha}</span>
        </div>
      </div>
    </motion.div>
  );
}

function CommitDetail({ commit }: { commit: Commit }) {
  return (
    <div className="p-4">
      <div className="glass-card p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-text-primary">{commit.message}</h3>
            <div className="flex items-center gap-3 mt-2 text-sm text-text-secondary">
              <span className="flex items-center gap-1">
                <User size={14} />
                {commit.author}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {commit.date}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg bg-elevated hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
              title="Copy SHA"
            >
              <Copy size={16} />
            </button>
            <button
              className="p-2 rounded-lg bg-elevated hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
              title="View on GitHub"
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* SHA */}
        <div className="flex items-center gap-2 p-2 rounded-lg bg-surface mb-4">
          <span className="text-xs text-text-muted">SHA:</span>
          <code className="text-xs font-mono text-accent-primary">{commit.sha}</code>
        </div>

        {/* Parents */}
        {commit.parents.length > 0 && (
          <div className="mb-4">
            <span className="text-xs text-text-muted">Parents:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {commit.parents.map((parent) => (
                <span
                  key={parent}
                  className="px-2 py-0.5 rounded bg-surface text-xs font-mono text-text-secondary"
                >
                  {parent.substring(0, 7)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Files changed placeholder */}
        <div className="border-t border-white/5 pt-4">
          <h4 className="text-sm font-medium text-text-secondary mb-2">Files Changed</h4>
          <p className="text-xs text-text-muted">
            Connect to Git backend to see changed files
          </p>
        </div>
      </div>
    </div>
  );
}

export function HistoryView() {
  const { commits: repoCommits, selectedCommit, selectCommit, repo } = useRepoStore();
  const { fetchCommits } = useCommits();
  const [searchQuery, setSearchQuery] = useState('');

  // Load commits when component mounts or repo changes
  useEffect(() => {
    if (repo) {
      fetchCommits(100);
    }
  }, [repo, fetchCommits]);

  const filteredCommits = repoCommits.filter(
    (commit) =>
      commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commit.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      commit.sha.includes(searchQuery)
  );

  // Empty state when no repo is open
  if (!repo) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <GitCommit size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm font-medium">Open a repository to view commit history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Panel - Commit List */}
      <div className="w-[450px] flex flex-col border-r border-white/5">
        {/* Search */}
        <div className="p-3 border-b border-white/5">
          <div className="glass-card p-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commits..."
                className="w-full pl-10 pr-10 py-2 bg-surface/50 rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Commit List */}
        <div className="flex-1 overflow-y-auto">
          {filteredCommits.length === 0 ? (
            <div className="p-4 text-center text-text-muted">
              <p className="text-sm">No commits found</p>
            </div>
          ) : (
            filteredCommits.map((commit) => (
              <CommitNode
                key={commit.sha}
                commit={commit}
                isSelected={selectedCommit?.sha === commit.sha}
                onClick={() => selectCommit(commit)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Commit Detail */}
      <div className="flex-1 overflow-y-auto bg-transparent">
        {selectedCommit ? (
          <CommitDetail commit={selectedCommit} />
        ) : (
          <div className="h-full flex items-center justify-center text-text-muted p-4">
            <div className="glass-card p-8 text-center">
              <GitCommit size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm font-medium">Select a commit to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
