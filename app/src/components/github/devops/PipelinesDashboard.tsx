import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useDevOpsStore } from '@/presentation/stores';
import { useGitHubStore } from '@/stores/github';
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  StopCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  GitBranch,
} from 'lucide-react';

type FilterStatus = 'all' | 'success' | 'failure' | 'in_progress' | 'queued';

export function PipelinesDashboard() {
  const { owner, repoName } = useGitHubStore();
  const { workflowRuns, loading, fetchWorkflowRuns } = useDevOpsStore();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const filteredRuns = workflowRuns.filter((run) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'success') return run.conclusion === 'success';
    if (filterStatus === 'failure') return run.conclusion === 'failure';
    if (filterStatus === 'in_progress') return run.status === 'in_progress';
    if (filterStatus === 'queued') return run.status === 'queued';
    return true;
  });

  const handleRerun = async (runId: number) => {
    if (!owner || !repoName) return;
    setActionLoading(runId);
    try {
      await invoke('github_rerun_workflow', { owner, repo: repoName, runId });
      await fetchWorkflowRuns(owner, repoName);
    } catch (error) {
      console.error('Failed to rerun workflow:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (runId: number) => {
    if (!owner || !repoName) return;
    setActionLoading(runId);
    try {
      await invoke('github_cancel_workflow_run', { owner, repo: repoName, runId });
      await fetchWorkflowRuns(owner, repoName);
    } catch (error) {
      console.error('Failed to cancel workflow:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const seconds = Math.round((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date().getTime();
    const then = new Date(date).getTime();
    const diff = now - then;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusIcon = (run: typeof workflowRuns[0]) => {
    if (run.status === 'in_progress') {
      return <Clock size={16} className="text-status-modified animate-pulse" />;
    }
    if (run.status === 'queued') {
      return <Clock size={16} className="text-text-muted" />;
    }
    if (run.conclusion === 'success') {
      return <CheckCircle size={16} className="text-status-added" />;
    }
    if (run.conclusion === 'failure') {
      return <XCircle size={16} className="text-status-deleted" />;
    }
    return <Clock size={16} className="text-text-muted" />;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-text-muted" />
          <div className="flex gap-1">
            {(['all', 'success', 'failure', 'in_progress', 'queued'] as FilterStatus[]).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    filterStatus === status
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ')}
                </button>
              )
            )}
          </div>
          <span className="ml-auto text-xs text-text-muted">
            {filteredRuns.length} runs
          </span>
        </div>
      </div>

      {/* Workflow Runs List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {filteredRuns.map((run) => (
          <div key={run.id} className="glass-card overflow-hidden">
            {/* Main Row */}
            <div
              className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
            >
              {getStatusIcon(run)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary truncate">
                    {run.name}
                  </span>
                  <span className="text-xs text-text-muted">#{run.run_number}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <GitBranch size={10} />
                  <span>{run.head_branch}</span>
                  <span>·</span>
                  <span>{run.head_sha.slice(0, 7)}</span>
                  <span>·</span>
                  <span>{run.event}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {run.run_started_at && run.updated_at && run.conclusion && (
                  <span className="text-xs text-text-muted">
                    {formatDuration(run.run_started_at, run.updated_at)}
                  </span>
                )}
                <span className="text-xs text-text-muted">
                  {formatTimeAgo(run.created_at)}
                </span>
                <ChevronRight
                  size={14}
                  className={`text-text-muted transition-transform ${
                    expandedRun === run.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {expandedRun === run.id && (
              <div className="px-3 pb-3 pt-0 border-t border-white/5">
                <div className="flex items-center gap-2 mt-3">
                  {run.status === 'in_progress' || run.status === 'queued' ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(run.id);
                      }}
                      disabled={actionLoading === run.id}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-status-deleted/20 text-status-deleted hover:bg-status-deleted/30 transition-colors disabled:opacity-50"
                    >
                      <StopCircle size={12} />
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRerun(run.id);
                      }}
                      disabled={actionLoading === run.id}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      Re-run
                    </button>
                  )}

                  {run.conclusion === 'failure' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        invoke('github_rerun_failed_jobs', {
                          owner,
                          repo: repoName,
                          runId: run.id,
                        });
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-status-modified/20 text-status-modified hover:bg-status-modified/30 transition-colors"
                    >
                      <Play size={12} />
                      Re-run failed
                    </button>
                  )}

                  <a
                    href={run.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors ml-auto"
                  >
                    <ExternalLink size={12} />
                    View on GitHub
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredRuns.length === 0 && !loading && (
          <div className="text-center py-8 text-text-muted">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No workflow runs found</p>
            <p className="text-xs mt-1">
              {filterStatus !== 'all'
                ? 'Try changing the filter'
                : 'Push some code to trigger workflows'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
