import { GitBranch, Cloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRepoStore } from '@/stores/repo';

export function StatusBar() {
  const { repo, stagedFiles, unstagedFiles, isLoading, error } = useRepoStore();

  const totalChanges = stagedFiles.length + unstagedFiles.length;

  return (
    <footer className="h-6 flex items-center justify-between px-3 bg-void border-t border-white/5 text-xs">
      {/* Left: Branch & Status */}
      <div className="flex items-center gap-4">
        {/* Branch */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <GitBranch size={12} className="text-branch-1" />
          <span>{repo?.currentBranch || 'No branch'}</span>
        </div>

        {/* Sync Status */}
        <div className="flex items-center gap-1.5 text-text-muted">
          <Cloud size={12} />
          <span>↑0 ↓0</span>
        </div>

        {/* Changes Count */}
        {totalChanges > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-status-modified">{stagedFiles.length} staged</span>
            <span className="text-text-ghost">•</span>
            <span className="text-text-secondary">{unstagedFiles.length} changes</span>
          </div>
        )}
      </div>

      {/* Right: Status Indicator */}
      <div className="flex items-center gap-2">
        {isLoading && (
          <div className="flex items-center gap-1.5 text-accent-primary">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 text-status-deleted">
            <AlertCircle size={12} />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex items-center gap-1.5 text-status-added">
            <CheckCircle size={12} />
            <span>Ready</span>
          </div>
        )}
      </div>
    </footer>
  );
}
