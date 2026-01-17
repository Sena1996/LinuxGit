import { useDevOpsStore } from '@/presentation/stores';
import { useGitHubStore } from '@/stores/github';
import {
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  AlertTriangle,
  Rocket,
  Server,
  GitBranch,
} from 'lucide-react';

export function DevOpsOverview() {
  const { owner: _owner, repoName: _repoName } = useGitHubStore();
  const {
    pipelineHealth,
    deploymentSummary,
    environments,
    workflowRuns,
    loading,
    setActiveTab,
  } = useDevOpsStore();

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  const recentDeployments = deploymentSummary?.environments
    .filter((e) => e.latest)
    .sort((a, b) => {
      const dateA = new Date(a.latest!.created_at).getTime();
      const dateB = new Date(b.latest!.created_at).getTime();
      return dateB - dateA;
    })
    .slice(0, 5) || [];

  if (loading && !pipelineHealth) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-text-muted">
          <Activity className="w-5 h-5 animate-pulse" />
          <span>Loading DevOps data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        {/* Pipeline Success Rate */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Success Rate</span>
            <TrendingUp size={14} className="text-status-added" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {pipelineHealth ? `${pipelineHealth.successRate.toFixed(0)}%` : '--'}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {pipelineHealth?.totalRuns || 0} total runs
          </div>
        </div>

        {/* Average Duration */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Avg Duration</span>
            <Clock size={14} className="text-accent-primary" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {pipelineHealth ? formatDuration(pipelineHealth.averageDuration) : '--'}
          </div>
          <div className="text-xs text-text-muted mt-1">per workflow</div>
        </div>

        {/* Active Pipelines */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Active</span>
            <Activity size={14} className="text-status-modified" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {pipelineHealth?.activeRuns || 0}
          </div>
          <div className="text-xs text-text-muted mt-1">
            {pipelineHealth?.queuedRuns || 0} queued
          </div>
        </div>

        {/* Failed This Week */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Failed (7d)</span>
            <AlertTriangle size={14} className="text-status-deleted" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {pipelineHealth?.failedThisWeek || 0}
          </div>
          <div className="text-xs text-text-muted mt-1">this week</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Recent Pipelines */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <GitBranch size={14} />
              Recent Pipelines
            </h3>
            <button
              onClick={() => setActiveTab('pipelines')}
              className="text-xs text-accent-primary hover:text-accent-primary/80"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {workflowRuns.slice(0, 5).map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
              >
                <div className="flex items-center gap-2">
                  {run.conclusion === 'success' ? (
                    <CheckCircle size={14} className="text-status-added" />
                  ) : run.conclusion === 'failure' ? (
                    <XCircle size={14} className="text-status-deleted" />
                  ) : (
                    <Clock size={14} className="text-status-modified animate-pulse" />
                  )}
                  <div>
                    <div className="text-xs font-medium text-text-primary truncate max-w-[180px]">
                      {run.name}
                    </div>
                    <div className="text-[10px] text-text-muted">
                      #{run.run_number} · {run.head_branch}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  run.conclusion === 'success'
                    ? 'bg-status-added/20 text-status-added'
                    : run.conclusion === 'failure'
                    ? 'bg-status-deleted/20 text-status-deleted'
                    : 'bg-status-modified/20 text-status-modified'
                }`}>
                  {run.conclusion || run.status}
                </span>
              </div>
            ))}
            {workflowRuns.length === 0 && (
              <div className="text-center py-4 text-text-muted text-xs">
                No workflow runs found
              </div>
            )}
          </div>
        </div>

        {/* Environments */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Server size={14} />
              Environments
            </h3>
            <button
              onClick={() => setActiveTab('environments')}
              className="text-xs text-accent-primary hover:text-accent-primary/80"
            >
              Manage
            </button>
          </div>
          <div className="space-y-2">
            {environments.map((env) => {
              const stats = deploymentSummary?.environments.find(
                (e) => e.environment === env.name
              );
              const isProtected = env.protection_rules.length > 0;

              return (
                <div
                  key={env.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <Server size={14} className="text-text-muted" />
                    <div>
                      <div className="text-xs font-medium text-text-primary flex items-center gap-1.5">
                        {env.name}
                        {isProtected && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                            Protected
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-muted">
                        {stats?.total || 0} deployments · {stats?.successful || 0} successful
                      </div>
                    </div>
                  </div>
                  {stats?.latest && (
                    <span className="text-[10px] text-text-muted">
                      {new Date(stats.latest.created_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              );
            })}
            {environments.length === 0 && (
              <div className="text-center py-4 text-text-muted text-xs">
                No environments configured
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Deployments */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Rocket size={14} />
            Recent Deployments
          </h3>
          <button
            onClick={() => setActiveTab('deployments')}
            className="text-xs text-accent-primary hover:text-accent-primary/80"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {recentDeployments.map((envStats) => (
            <div
              key={envStats.environment}
              className="p-3 rounded-lg bg-white/5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-primary">
                  {envStats.environment}
                </span>
                <CheckCircle size={12} className="text-status-added" />
              </div>
              <div className="text-[10px] text-text-muted">
                <div className="truncate">{envStats.latest?.sha.slice(0, 7)}</div>
                <div>{new Date(envStats.latest!.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {recentDeployments.length === 0 && (
            <div className="col-span-3 text-center py-4 text-text-muted text-xs">
              No recent deployments
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
