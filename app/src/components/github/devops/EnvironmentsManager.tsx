import { useState } from 'react';
import { useDevOpsStore } from '@/presentation/stores';
import { useGitHubStore } from '@/stores/github';
import {
  Server,
  Shield,
  Clock,
  GitBranch,
  Plus,
  Trash2,
  Settings,
  ChevronRight,
  Key,
  Variable,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Users,
} from 'lucide-react';
import type { Environment } from '@/domain/entities';

export function EnvironmentsManager() {
  const { owner, repoName } = useGitHubStore();
  const {
    environments,
    selectedEnvironment,
    environmentSecrets,
    environmentVariables,
    loading,
    fetchEnvironments,
    fetchEnvironmentDetails,
    createEnvironment,
    deleteEnvironment,
    selectEnvironment,
  } = useDevOpsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Environment | null>(null);
  const [createForm, setCreateForm] = useState({
    name: '',
    waitTimer: 0,
    protectedBranches: false,
  });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSelectEnvironment = async (env: Environment) => {
    if (selectedEnvironment?.id === env.id) {
      selectEnvironment(null);
    } else {
      selectEnvironment(env);
      if (owner && repoName) {
        await fetchEnvironmentDetails(owner, repoName, env.name);
      }
    }
  };

  const handleCreateEnvironment = async () => {
    if (!owner || !repoName || !createForm.name) return;

    setCreating(true);
    try {
      await createEnvironment(owner, repoName, createForm.name, {
        waitTimer: createForm.waitTimer > 0 ? createForm.waitTimer : undefined,
        protectedBranches: createForm.protectedBranches,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', waitTimer: 0, protectedBranches: false });
      await fetchEnvironments(owner, repoName);
    } catch (error) {
      console.error('Failed to create environment:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEnvironment = async () => {
    if (!owner || !repoName || !showDeleteConfirm) return;

    setDeleting(true);
    try {
      await deleteEnvironment(owner, repoName, showDeleteConfirm.name);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete environment:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getProtectionRuleIcon = (type: string) => {
    switch (type) {
      case 'required_reviewers':
        return <Users size={12} className="text-accent-primary" />;
      case 'wait_timer':
        return <Clock size={12} className="text-status-modified" />;
      case 'branch_policy':
        return <GitBranch size={12} className="text-status-added" />;
      default:
        return <Shield size={12} className="text-text-muted" />;
    }
  };

  const formatProtectionRule = (rule: any) => {
    switch (rule.rule_type) {
      case 'required_reviewers':
        return `${rule.reviewers?.length || 0} required reviewers`;
      case 'wait_timer':
        return `${rule.wait_timer} minute wait`;
      case 'branch_policy':
        return 'Branch restrictions';
      default:
        return rule.rule_type;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={14} className="text-text-muted" />
            <span className="text-sm text-text-primary font-medium">
              {environments.length} Environments
            </span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30 transition-colors"
          >
            <Plus size={14} />
            New Environment
          </button>
        </div>
      </div>

      {/* Environments List */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {environments.map((env) => {
          const isProtected = env.protection_rules.length > 0;
          const isSelected = selectedEnvironment?.id === env.id;

          return (
            <div key={env.id} className="glass-card overflow-hidden">
              {/* Main Row */}
              <div
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleSelectEnvironment(env)}
              >
                <Server size={16} className="text-accent-primary" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-text-primary">
                      {env.name}
                    </span>
                    {isProtected && (
                      <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary">
                        <Shield size={10} />
                        Protected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    {env.protection_rules.length > 0 ? (
                      <>
                        {env.protection_rules.slice(0, 2).map((rule, i) => (
                          <span key={i} className="flex items-center gap-1">
                            {getProtectionRuleIcon(rule.rule_type)}
                            {formatProtectionRule(rule)}
                          </span>
                        ))}
                        {env.protection_rules.length > 2 && (
                          <span>+{env.protection_rules.length - 2} more</span>
                        )}
                      </>
                    ) : (
                      <span>No protection rules</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(env);
                    }}
                    className="p-1.5 rounded-md text-text-muted hover:text-status-deleted hover:bg-status-deleted/10 transition-colors"
                    title="Delete environment"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight
                    size={14}
                    className={`text-text-muted transition-transform ${
                      isSelected ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <div className="px-3 pb-3 pt-0 border-t border-white/5">
                  <div className="mt-3 space-y-4">
                    {/* Protection Rules */}
                    <div>
                      <h4 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                        <Shield size={12} />
                        Protection Rules
                      </h4>
                      {env.protection_rules.length > 0 ? (
                        <div className="space-y-1">
                          {env.protection_rules.map((rule, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
                            >
                              {getProtectionRuleIcon(rule.rule_type)}
                              <span className="text-xs text-text-primary">
                                {formatProtectionRule(rule)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted py-2">
                          No protection rules configured
                        </div>
                      )}
                    </div>

                    {/* Secrets */}
                    <div>
                      <h4 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                        <Key size={12} />
                        Secrets ({environmentSecrets.length})
                      </h4>
                      {environmentSecrets.length > 0 ? (
                        <div className="space-y-1">
                          {environmentSecrets.map((secret) => (
                            <div
                              key={secret.name}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                            >
                              <span className="text-xs text-text-primary font-mono">
                                {secret.name}
                              </span>
                              <span className="text-[10px] text-text-muted">
                                Updated {new Date(secret.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted py-2">
                          No secrets configured
                        </div>
                      )}
                    </div>

                    {/* Variables */}
                    <div>
                      <h4 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                        <Variable size={12} />
                        Variables ({environmentVariables.length})
                      </h4>
                      {environmentVariables.length > 0 ? (
                        <div className="space-y-1">
                          {environmentVariables.map((variable) => (
                            <div
                              key={variable.name}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                            >
                              <span className="text-xs text-text-primary font-mono">
                                {variable.name}
                              </span>
                              <span className="text-xs text-text-muted font-mono truncate max-w-[200px]">
                                {variable.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-text-muted py-2">
                          No variables configured
                        </div>
                      )}
                    </div>

                    {/* Branch Policy */}
                    {env.deployment_branch_policy && (
                      <div>
                        <h4 className="text-xs font-medium text-text-muted mb-2 flex items-center gap-1.5">
                          <GitBranch size={12} />
                          Deployment Branch Policy
                        </h4>
                        <div className="p-2 rounded-lg bg-white/5">
                          <div className="flex items-center gap-2 text-xs text-text-primary">
                            {env.deployment_branch_policy.protected_branches ? (
                              <>
                                <CheckCircle size={12} className="text-status-added" />
                                Only protected branches
                              </>
                            ) : env.deployment_branch_policy.custom_branch_policies ? (
                              <>
                                <Settings size={12} className="text-accent-primary" />
                                Custom branch policies
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={12} className="text-status-modified" />
                                No branch restrictions
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {environments.length === 0 && !loading && (
          <div className="text-center py-8 text-text-muted">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No environments configured</p>
            <p className="text-xs mt-1">
              Create an environment to manage deployments
            </p>
          </div>
        )}
      </div>

      {/* Create Environment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-card w-full max-w-md mx-4 p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Server size={18} />
              Create New Environment
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Environment Name <span className="text-status-deleted">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="production, staging, development..."
                  className="w-full bg-bg-tertiary border border-white/10 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1">
                  Wait Timer (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  max="43200"
                  value={createForm.waitTimer}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      waitTimer: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className="w-full bg-bg-tertiary border border-white/10 rounded-md px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
                <p className="text-[10px] text-text-muted mt-1">
                  Amount of time to delay a job after the job is initially triggered
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="protectedBranches"
                  checked={createForm.protectedBranches}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      protectedBranches: e.target.checked,
                    })
                  }
                  className="rounded bg-bg-tertiary border-white/10"
                />
                <label htmlFor="protectedBranches" className="text-xs text-text-muted">
                  Only allow protected branches to deploy
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
                onClick={handleCreateEnvironment}
                disabled={creating || !createForm.name}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    Create Environment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="modal-card w-full max-w-md mx-4 p-4">
            <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
              <AlertTriangle size={18} className="text-status-deleted" />
              Delete Environment
            </h3>
            <p className="text-sm text-text-muted mb-4">
              Are you sure you want to delete the environment{' '}
              <span className="font-medium text-text-primary">
                {showDeleteConfirm.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEnvironment}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-status-deleted text-white hover:bg-status-deleted/90 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Delete
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
