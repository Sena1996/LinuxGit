import { create } from 'zustand';
import type {
  Deployment,
  DeploymentStatus,
  DeploymentSummary,
  Environment,
  EnvironmentSecret,
  EnvironmentVariable,
  PipelineHealth,
} from '@/domain/entities';
import { deploymentsApi, environmentsApi } from '@/infrastructure/api';
import { invoke } from '@tauri-apps/api/core';

export type DevOpsTab = 'overview' | 'pipelines' | 'deployments' | 'environments' | 'setup' | 'security';

interface WorkflowRun {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  run_number: number;
  workflow_id: number;
  head_branch: string;
  head_sha: string;
  event: string;
  run_started_at: string;
  html_url: string;
}

interface DevOpsState {
  activeTab: DevOpsTab;
  loading: boolean;
  error: string | null;

  // Pipeline data
  workflowRuns: WorkflowRun[];
  pipelineHealth: PipelineHealth | null;

  // Deployment data
  deployments: Deployment[];
  deploymentSummary: DeploymentSummary | null;
  selectedDeployment: Deployment | null;
  deploymentStatuses: DeploymentStatus[];

  // Environment data
  environments: Environment[];
  selectedEnvironment: Environment | null;
  environmentSecrets: EnvironmentSecret[];
  environmentVariables: EnvironmentVariable[];

  // Actions
  setActiveTab: (tab: DevOpsTab) => void;
  setError: (error: string | null) => void;

  // Pipeline actions
  fetchWorkflowRuns: (owner: string, repo: string) => Promise<void>;
  calculatePipelineHealth: () => void;

  // Deployment actions
  fetchDeployments: (owner: string, repo: string, environment?: string) => Promise<void>;
  fetchDeploymentSummary: (owner: string, repo: string) => Promise<void>;
  fetchDeploymentStatuses: (owner: string, repo: string, deploymentId: number) => Promise<void>;
  createDeployment: (
    owner: string,
    repo: string,
    refName: string,
    environment: string,
    options?: { description?: string; productionEnvironment?: boolean }
  ) => Promise<Deployment>;
  selectDeployment: (deployment: Deployment | null) => void;

  // Environment actions
  fetchEnvironments: (owner: string, repo: string) => Promise<void>;
  fetchEnvironmentDetails: (owner: string, repo: string, environmentName: string) => Promise<void>;
  createEnvironment: (
    owner: string,
    repo: string,
    name: string,
    options?: { waitTimer?: number; protectedBranches?: boolean }
  ) => Promise<Environment>;
  deleteEnvironment: (owner: string, repo: string, environmentName: string) => Promise<void>;
  selectEnvironment: (environment: Environment | null) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  activeTab: 'overview' as DevOpsTab,
  loading: false,
  error: null,
  workflowRuns: [],
  pipelineHealth: null,
  deployments: [],
  deploymentSummary: null,
  selectedDeployment: null,
  deploymentStatuses: [],
  environments: [],
  selectedEnvironment: null,
  environmentSecrets: [],
  environmentVariables: [],
};

export const useDevOpsStore = create<DevOpsState>((set, get) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setError: (error) => set({ error }),

  fetchWorkflowRuns: async (owner, repo) => {
    set({ loading: true, error: null });
    try {
      const runs = await invoke<WorkflowRun[]>('github_list_workflow_runs', {
        owner,
        repo,
        perPage: 50,
      });
      set({ workflowRuns: runs });
      get().calculatePipelineHealth();
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ loading: false });
    }
  },

  calculatePipelineHealth: () => {
    const { workflowRuns } = get();
    if (workflowRuns.length === 0) {
      set({ pipelineHealth: null });
      return;
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedRuns = workflowRuns.filter((r) => r.conclusion !== null);
    const successfulRuns = completedRuns.filter((r) => r.conclusion === 'success');
    const failedThisWeek = workflowRuns.filter(
      (r) =>
        r.conclusion === 'failure' &&
        new Date(r.created_at) >= weekAgo
    ).length;

    const activeRuns = workflowRuns.filter(
      (r) => r.status === 'in_progress'
    ).length;
    const queuedRuns = workflowRuns.filter(
      (r) => r.status === 'queued'
    ).length;

    const durations = completedRuns
      .filter((r) => r.run_started_at)
      .map((r) => {
        const start = new Date(r.run_started_at).getTime();
        const end = new Date(r.updated_at).getTime();
        return (end - start) / 1000;
      });

    const averageDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    set({
      pipelineHealth: {
        totalRuns: workflowRuns.length,
        successRate:
          completedRuns.length > 0
            ? (successfulRuns.length / completedRuns.length) * 100
            : 0,
        averageDuration,
        failedThisWeek,
        activeRuns,
        queuedRuns,
      },
    });
  },

  fetchDeployments: async (owner, repo, environment) => {
    set({ loading: true, error: null });
    try {
      const deployments = await deploymentsApi.listDeployments(
        owner,
        repo,
        environment,
        30
      );
      set({ deployments });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ loading: false });
    }
  },

  fetchDeploymentSummary: async (owner, repo) => {
    set({ loading: true, error: null });
    try {
      const summary = await deploymentsApi.getDeploymentSummary(owner, repo);
      set({ deploymentSummary: summary });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ loading: false });
    }
  },

  fetchDeploymentStatuses: async (owner, repo, deploymentId) => {
    try {
      const statuses = await deploymentsApi.listDeploymentStatuses(
        owner,
        repo,
        deploymentId
      );
      set({ deploymentStatuses: statuses });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  createDeployment: async (owner, repo, refName, environment, options) => {
    set({ loading: true, error: null });
    try {
      const deployment = await deploymentsApi.createDeployment(
        owner,
        repo,
        refName,
        environment,
        options
      );
      const { deployments } = get();
      set({ deployments: [deployment, ...deployments] });
      return deployment;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  selectDeployment: (deployment) => {
    set({ selectedDeployment: deployment, deploymentStatuses: [] });
  },

  fetchEnvironments: async (owner, repo) => {
    set({ loading: true, error: null });
    try {
      const response = await environmentsApi.listEnvironments(owner, repo);
      set({ environments: response.environments });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ loading: false });
    }
  },

  fetchEnvironmentDetails: async (owner, repo, environmentName) => {
    try {
      const [environment, secretsResponse, variablesResponse] = await Promise.all([
        environmentsApi.getEnvironment(owner, repo, environmentName),
        environmentsApi.listEnvironmentSecrets(owner, repo, environmentName).catch(() => ({ secrets: [] })),
        environmentsApi.listEnvironmentVariables(owner, repo, environmentName).catch(() => ({ variables: [] })),
      ]);
      set({
        selectedEnvironment: environment,
        environmentSecrets: secretsResponse.secrets,
        environmentVariables: variablesResponse.variables,
      });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  createEnvironment: async (owner, repo, name, options) => {
    set({ loading: true, error: null });
    try {
      const environment = await environmentsApi.createEnvironment(
        owner,
        repo,
        name,
        options
      );
      const { environments } = get();
      set({ environments: [...environments, environment] });
      return environment;
    } catch (error) {
      set({ error: String(error) });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteEnvironment: async (owner, repo, environmentName) => {
    set({ loading: true, error: null });
    try {
      await environmentsApi.deleteEnvironment(owner, repo, environmentName);
      const { environments } = get();
      set({
        environments: environments.filter((e) => e.name !== environmentName),
        selectedEnvironment: null,
      });
    } catch (error) {
      set({ error: String(error) });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  selectEnvironment: (environment) => {
    set({
      selectedEnvironment: environment,
      environmentSecrets: [],
      environmentVariables: [],
    });
  },

  reset: () => set(initialState),
}));
