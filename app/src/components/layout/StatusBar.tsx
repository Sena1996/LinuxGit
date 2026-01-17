import { useState, useEffect } from 'react';
import { GitBranch, Cloud, CheckCircle, AlertCircle, Loader2, ArrowUp, ArrowDown } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useRepoStore } from '@/stores/repo';
import { cn } from '@/lib/utils';

interface SyncStatus {
  ahead: number;
  behind: number;
  remote_name: string | null;
  upstream_branch: string | null;
}

export function StatusBar() {
  const { repo, stagedFiles, unstagedFiles, isLoading, error } = useRepoStore();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  const totalChanges = stagedFiles.length + unstagedFiles.length;

  // Fetch sync status when repo changes
  useEffect(() => {
    async function fetchSyncStatus() {
      if (!repo) {
        setSyncStatus(null);
        return;
      }

      try {
        const status = await invoke<SyncStatus>('get_repo_sync_status');
        setSyncStatus(status);
      } catch (e) {
        // Silently fail if no upstream configured
        setSyncStatus(null);
      }
    }

    fetchSyncStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, [repo]);

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
              <span className={cn('flex items-center gap-0.5', syncStatus.behind > 0 && 'text-status-warning')}>
                <ArrowDown size={10} />
                {syncStatus.behind}
              </span>
            </div>
          </div>
        )}

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
      </div>
    </footer>
  );
}
