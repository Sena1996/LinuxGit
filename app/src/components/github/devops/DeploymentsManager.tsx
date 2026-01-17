import { useState } from 'react';
import { useDevOpsStore } from '@/presentation/stores';
import { useGitHubStore } from '@/stores/github';
import {
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Filter,
  GitBranch,
  Plus,
  RefreshCw,
} from 'lucide-react';
import type { Deployment } from '@/domain/entities';

type FilterEnvironment = 'all' | string;
type FilterStatus = 'all' | 'success' | 'failure' | 'pending' | 'in_progress';

export function DeploymentsManager() {
  const { owner, repoName } = useGitHubStore();
  const {
    deployments,
    deploymentSummary,
    environments,
    loading,
    fetchDeployments,
    fetchDeploymentStatuses,
    selectDeployment,
    selectedDeployment,
    deploymentStatuses,
    createDeployment,
  } = useDevOpsStore();

  const [filterEnvironment, setFilterEnvironment] = useState<FilterEnvironment>('all');
  const [_filterStatus, _setFilterStatus] = useState<FilterStatus>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    ref: '',
    environment: '',
    description: '',
    productionEnvironment: false,
  });
  const [creating, setCreating] = useState(false);

  const filteredDeployments = deployments.filter((deployment) => {
    if (filterEnvironment !== 'all' && deployment.environment !== filterEnvironment) {
      return false;
    }
    // Status filtering would require fetching statuses for each deployment
    // For now, we'll filter based on available data
    return true;
  });

  const handleSelectDeployment = async (deployment: Deployment) => {
    if (selectedDeployment?.id === deployment.id) {
      selectDeployment(null);
    } else {
      selectDeployment(deployment);
      if (owner && repoName) {
        await fetchDeploymentStatuses(owner, repoName, deployment.id);
      }
    }
  };

  const handleCreateDeployment = async () => {
    if (!owner || !repoName || !createForm.ref || !createForm.environment) return;

    setCreating(true);
    try {
      await createDeployment(owner, repoName, createForm.ref, createForm.environment, {
        description: createForm.description || undefined,
        productionEnvironment: createForm.productionEnvironment,
      });
      setShowCreateModal(false);
      setCreateForm({ ref: '', environment: '', description: '', productionEnvironment: false });
      await fetchDeployments(owner, repoName);
    } catch (error) {
      console.error('Failed to create deployment:', error);
    } finally {
      setCreating(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={14} className="text-status-added" />;
      case 'failure':
      case 'error':
        return <XCircle size={14} className="text-status-deleted" />;
      case 'pending':
      case 'queued':
        return <Clock size={14} className="text-text-muted" />;
      case 'in_progress':
        return <Clock size={14} className="text-status-modified animate-pulse" />;
      default:
        return <AlertTriangle size={14} className="text-status-modified" />;
    }
  };

  const uniqueEnvironments = [...new Set(deployments.map((d) => d.environment))];

  return (
    <div className="h-full flex flex-col">
      {/* Filters and Actions */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-text-muted" />
              <select
                value={filterEnvironment}
                onChange={(e) => setFilterEnvironment(e.target.value)}
                className="bg-bg-tertiary border border-white/10 rounded-md px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              >
                <option value="all">All Environments</option>
                {uniqueEnvironments.map((env) => (
                  <option key={env} value={env}>
                    {env}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs text-text-muted">
              {filteredDeployments.length} deployments
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
          >
            <Plus size={14} />
            New Deployment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {deploymentSummary && (
        <div className="p-3 border-b border-white/5">
          <div className="grid grid-cols-4 gap-2">
            <div className="glass-card p-3">
              <div className="text-xs text-text-muted mb-1">Total</div>
              <div className="text-lg font-bold text-text-primary">
                {deploymentSummary.environments.reduce((sum, env) => sum + env.total, 0)}
              </div>
            </div>
            <div className="glass-card p-3">
              <div className="text-xs text-text-muted mb-1">Successful</div>
              <div className="text-lg font-bold text-status-added">
                {deploymentSummary.environments.reduce((sum, env) => sum + env.successful, 0)}
              </div>
            </div>
            <div className="glass-card p-3">
              <div className="text-xs text-text-muted mb-1">Pending</div>
              <div className="text-lg font-bold text-status-modified">
                {deploymentSummary.environments.reduce((sum, env) => sum + env.pending, 0)}
              </div>
            </div>
            <div className="glass-card p-3">
              <div className="text-xs text-text-muted mb-1">Environments</div>
              <div className="text-lg font-bold text-text-primary">
                {deploymentSummary.environments.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deployments List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {filteredDeployments.map((deployment) => (
          <div key={deployment.id} className="glass-card overflow-hidden">
            {/* Main Row */}
            <div
              className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => handleSelectDeployment(deployment)}
            >
              <Rocket size={16} className="text-accent-primary" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">
                    {deployment.environment}
                  </span>
                  {deployment.production_environment && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-modified/20 text-status-modified">
                      Production
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                  <GitBranch size={10} />
                  <span>{deployment.ref_name}</span>
                  <span>·</span>
                  <span>{deployment.sha.slice(0, 7)}</span>
                  {deployment.description && (
                    <>
                      <span>·</span>
                      <span className="truncate max-w-[200px]">{deployment.description}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">
                  {formatTimeAgo(deployment.created_at)}
                </span>
                {deployment.creator && (
                  <span className="text-xs text-text-muted">
                    by {deployment.creator.login}
                  </span>
                )}
                <ChevronRight
                  size={14}
                  className={`text-text-muted transition-transform ${
                    selectedDeployment?.id === deployment.id ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {selectedDeployment?.id === deployment.id && (
              <div className="px-3 pb-3 pt-0 border-t border-white/5">
                <div className="mt-3 space-y-3">
                  {/* Deployment Statuses */}
                  <div>
                    <h4 className="text-xs font-medium text-text-muted mb-2">
                      Status History
                    </h4>
                    {deploymentStatuses.length > 0 ? (
                      <div className="space-y-1">
                        {deploymentStatuses.map((status) => (
                          <div
                            key={status.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                          >
                            {getStatusIcon(status.state)}
                            <span className="text-xs text-text-primary capitalize">
                              {status.state}
                            </span>
                            {status.description && (
                              <span className="text-xs text-text-muted truncate flex-1">
                                {status.description}
                              </span>
                            )}
                            <span className="text-[10px] text-text-muted">
                              {formatTimeAgo(status.created_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-text-muted py-2">
                        No status updates yet
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {deployment.statuses_url && (
                      <a
                        href={`https://github.com/${owner}/${repoName}/deployments/${deployment.environment}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-white/5 text-text-muted hover:text-text-primary hover:bg-white/10 transition-colors"
                      >
                        <ExternalLink size={12} />
                        View on GitHub
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredDeployments.length === 0 && !loading && (
          <div className="text-center py-8 text-text-muted">
            <Rocket className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No deployments found</p>
            <p className="text-xs mt-1">
              {filterEnvironment !== 'all'
                ? 'Try changing the filter'
                : 'Create a deployment to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Create Deployment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-card w-full max-w-md mx-4 p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Rocket size={18} />
              Create New Deployment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Branch or SHA <span className="text-status-deleted">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.ref}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, ref: e.target.value })
                  }
                  placeholder="main, feature/xyz, or commit SHA"
                  className="w-full bg-bg-tertiary border border-white/10 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Environment <span className="text-status-deleted">*</span>
                </label>
                <select
                  value={createForm.environment}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, environment: e.target.value })
                  }
                  className="w-full bg-bg-tertiary border border-white/10 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                >
                  <option value="">Select environment</option>
                  {environments.map((env) => (
                    <option key={env.id} value={env.name}>
                      {env.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, description: e.target.value })
                  }
                  placeholder="Optional description"
                  className="w-full bg-bg-tertiary border border-white/10 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="production"
                  checked={createForm.productionEnvironment}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      productionEnvironment: e.target.checked,
                    })
                  }
                  className="rounded bg-bg-tertiary border-white/10"
                />
                <label htmlFor="production" className="text-xs text-text-muted">
                  Production environment
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeployment}
                disabled={creating || !createForm.ref || !createForm.environment}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Rocket size={14} />
                    Create Deployment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
