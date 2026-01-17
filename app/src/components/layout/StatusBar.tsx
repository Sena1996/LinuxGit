import { GitBranch, Cloud, CheckCircle, AlertCircle, Loader2, ArrowUp, ArrowDown, CircleDot, XCircle, PlayCircle } from 'lucide-react';
import { useRepoStore } from '@/stores/repo';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

export function StatusBar() {
  const { repo, isLoading, error } = useRepoStore();
  const { syncStatus, latestCIStatus, counts } = useNotifications();

  return (
    <footer className="px-3 pb-3 bg-void">
      <div className={cn(
        'h-8 flex items-center justify-between px-4 text-xs rounded-lg',
        'bg-elevated',
        'border border-white/[0.1]',
        'shadow-sm'
      )}>
      {/* Left: Branch & Status */}
      <div className="flex items-center gap-4">
        {/* Branch */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <GitBranch size={12} className="text-branch-1" />
          <span>{repo?.currentBranch || 'No branch'}</span>
        </div>

        {/* Sync Status */}
        {syncStatus && (syncStatus.ahead > 0 || syncStatus.behind > 0 || syncStatus.remote_name) && (
          <div className="flex items-center gap-2 text-text-muted">
            <Cloud size={12} />
            <div className="flex items-center gap-1.5">
              <span className={cn('flex items-center gap-0.5', syncStatus.ahead > 0 && 'text-status-added')}>
                <ArrowUp size={10} />
                {syncStatus.ahead}
              </span>
              <span className={cn('flex items-center gap-0.5', syncStatus.behind > 0 && 'text-status-modified')}>
                <ArrowDown size={10} />
                {syncStatus.behind}
              </span>
            </div>
          </div>
        )}

        {/* Changes Count */}
        {counts.totalChanges > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-status-modified">{counts.stagedChanges} staged</span>
            <span className="text-text-ghost">•</span>
            <span className="text-text-secondary">{counts.unstagedChanges} changes</span>
          </div>
        )}
      </div>

      {/* Right: CI Status & Status Indicator */}
      <div className="flex items-center gap-4">
        {/* CI Status */}
        {latestCIStatus && (
          <a
            href={latestCIStatus.url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'flex items-center gap-1.5 hover:underline cursor-pointer',
              latestCIStatus.inProgress && 'text-accent-primary',
              latestCIStatus.failed && 'text-status-deleted',
              !latestCIStatus.inProgress && !latestCIStatus.failed && 'text-status-added'
            )}
          >
            {latestCIStatus.inProgress ? (
              <PlayCircle size={12} className="animate-pulse" />
            ) : latestCIStatus.failed ? (
              <XCircle size={12} />
            ) : (
              <CircleDot size={12} />
            )}
            <span className="max-w-[120px] truncate">{latestCIStatus.name}</span>
          </a>
        )}

        {/* Failed CI Runs Count */}
        {counts.failedCIRuns > 0 && (
          <div className="flex items-center gap-1 text-status-deleted">
            <XCircle size={12} />
            <span>{counts.failedCIRuns} failed</span>
          </div>
        )}

        {/* App Status Indicator */}
        {isLoading && (
          <div className="flex items-center gap-1.5 text-accent-primary">
            <Loader2 size={12} className="animate-spin" />
            <span>Loading...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-1.5 text-status-deleted">
            <AlertCircle size={12} />
            <span className="max-w-[150px] truncate">{error}</span>
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex items-center gap-1.5 text-status-added">
            <CheckCircle size={12} />
            <span>Ready</span>
          </div>
        )}
      </div>
      </div>
    </footer>
  );
}
