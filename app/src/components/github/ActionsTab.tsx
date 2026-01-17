import { useEffect, useState } from 'react';
import { useGitHubStore, WorkflowRun, Workflow } from '@/stores/github';
import {
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ChevronRight,
  RotateCcw,
  Square,
  ExternalLink,
  Download,
} from 'lucide-react';

function getStatusIcon(status?: string, conclusion?: string) {
  if (status === 'queued' || status === 'in_progress' || status === 'waiting') {
    return <Loader2 className="w-4 h-4 text-warning animate-spin" />;
  }
  if (conclusion === 'success') {
    return <CheckCircle className="w-4 h-4 text-success" />;
  }
  if (conclusion === 'failure') {
    return <XCircle className="w-4 h-4 text-danger" />;
  }
  if (conclusion === 'cancelled') {
    return <Square className="w-4 h-4 text-text-muted" />;
  }
  return <Clock className="w-4 h-4 text-text-muted" />;
}

function getStatusColor(status?: string, conclusion?: string) {
  if (status === 'queued' || status === 'in_progress' || status === 'waiting') {
    return 'bg-warning/10 text-warning border-warning/20';
  }
  if (conclusion === 'success') {
    return 'bg-success/10 text-success border-success/20';
  }
  if (conclusion === 'failure') {
    return 'bg-danger/10 text-danger border-danger/20';
  }
  return 'bg-surface-lighter text-text-muted border-surface-lighter';
}

function formatDuration(startedAt?: string, completedAt?: string) {
  if (!startedAt) return '';
  const start = new Date(startedAt);
  const end = completedAt ? new Date(completedAt) : new Date();
  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function WorkflowRunCard({ run }: { run: WorkflowRun }) {
  const { rerunWorkflow, cancelRun, fetchRunJobs, fetchArtifacts, runJobs, artifacts } = useGitHubStore();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isInProgress = run.status === 'in_progress' || run.status === 'queued' || run.status === 'waiting';

  const handleExpand = async () => {
    if (!expanded) {
      setLoading(true);
      await Promise.all([fetchRunJobs(run.id), fetchArtifacts(run.id)]);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const handleRerun = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await rerunWorkflow(run.id);
    } catch (error) {
      console.error('Failed to rerun:', error);
    }
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await cancelRun(run.id);
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div
        onClick={handleExpand}
        className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors"
      >
        <ChevronRight
          className={`w-4 h-4 text-text-muted transition-transform ${
            expanded ? 'rotate-90' : ''
          }`}
        />
        {getStatusIcon(run.status, run.conclusion)}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary truncate">
              {run.name || `Run #${run.run_number}`}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full border ${getStatusColor(
                run.status,
                run.conclusion
              )}`}
            >
              {run.conclusion || run.status}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
            <span>{run.head_branch}</span>
            <span>{run.head_sha.substring(0, 7)}</span>
            <span>{formatTimeAgo(run.created_at)}</span>
            {run.run_started_at && (
              <span>Duration: {formatDuration(run.run_started_at, run.status === 'completed' ? run.updated_at : undefined)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isInProgress ? (
            <button
              onClick={handleCancel}
              className="p-1.5 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
              title="Cancel run"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleRerun}
              className="p-1.5 rounded hover:bg-accent/10 text-text-muted hover:text-accent transition-colors"
              title="Re-run"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <a
            href={run.html_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text-secondary transition-colors"
            title="View on GitHub"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-lighter bg-deep p-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Jobs */}
              {runJobs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Jobs</h4>
                  <div className="space-y-1">
                    {runJobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center gap-2 p-2 rounded bg-surface"
                      >
                        {getStatusIcon(job.status, job.conclusion)}
                        <span className="text-sm text-text-primary">{job.name}</span>
                        {job.started_at && (
                          <span className="text-xs text-text-muted ml-auto">
                            {formatDuration(job.started_at, job.completed_at)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Artifacts */}
              {artifacts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Artifacts</h4>
                  <div className="space-y-1">
                    {artifacts.map((artifact) => (
                      <div
                        key={artifact.id}
                        className="flex items-center gap-2 p-2 rounded bg-surface"
                      >
                        <Download className="w-4 h-4 text-text-muted" />
                        <span className="text-sm text-text-primary">{artifact.name}</span>
                        <span className="text-xs text-text-muted">
                          {(artifact.size_in_bytes / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <a
                          href={artifact.archive_download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-sm text-accent hover:text-accent-hover"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ActionsTab() {
  const {
    workflows,
    workflowRuns,
    actionsLoading,
    actionsError,
    fetchWorkflows,
    fetchWorkflowRuns,
  } = useGitHubStore();

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchWorkflows();
    fetchWorkflowRuns();
  }, [fetchWorkflows, fetchWorkflowRuns]);

  // Auto-refresh when there are in-progress runs
  useEffect(() => {
    if (!autoRefresh) return;

    const hasActiveRuns = workflowRuns.some(
      (r) => r.status === 'in_progress' || r.status === 'queued' || r.status === 'waiting'
    );

    if (hasActiveRuns) {
      const interval = setInterval(() => {
        fetchWorkflowRuns(selectedWorkflow?.id);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [workflowRuns, autoRefresh, fetchWorkflowRuns, selectedWorkflow]);

  const handleRefresh = () => {
    fetchWorkflows();
    fetchWorkflowRuns(selectedWorkflow?.id);
  };

  const handleWorkflowSelect = (workflow: Workflow | null) => {
    setSelectedWorkflow(workflow);
    fetchWorkflowRuns(workflow?.id);
  };

  if (actionsError) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-status-deleted" />
          <p className="text-lg font-medium">Failed to load Actions</p>
          <p className="text-sm mt-2">{actionsError}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Play className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Workflow Runs</h2>
            {actionsLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-white/10 bg-surface/50"
              />
              Auto-refresh
            </label>
            <button
              onClick={handleRefresh}
              disabled={actionsLoading}
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${actionsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Workflow filter */}
      {workflows.length > 0 && (
        <div className="glass-card p-2 mb-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => handleWorkflowSelect(null)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                !selectedWorkflow
                  ? 'bg-accent-primary text-void'
                  : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              All workflows
            </button>
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                onClick={() => handleWorkflowSelect(workflow)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                  selectedWorkflow?.id === workflow.id
                    ? 'bg-accent-primary text-void'
                    : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
                }`}
              >
                {workflow.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Runs list */}
      {workflowRuns.length === 0 && !actionsLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          <div className="glass-card p-8 text-center">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No workflow runs found</p>
            <p className="text-sm mt-2">
              Push some code or trigger a workflow to see runs here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {workflowRuns.map((run) => (
            <WorkflowRunCard key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  );
}
