import { create } from 'zustand';
import type { Workflow, WorkflowRun, WorkflowJob, Artifact } from '@/domain/entities';
import { gitHubActionsApi } from '@/infrastructure/api';
import { useGitHubContextStore } from './context.store';

interface ActionsState {
  workflows: Workflow[];
  runs: WorkflowRun[];
  selectedRun: WorkflowRun | null;
  jobs: WorkflowJob[];
  artifacts: Artifact[];
  loading: boolean;
  error: string | null;

  fetchWorkflows: () => Promise<void>;
  fetchRuns: (workflowId?: number) => Promise<void>;
  fetchJobs: (runId: number) => Promise<void>;
  fetchArtifacts: (runId: number) => Promise<void>;
  trigger: (workflowId: number, ref: string, inputs?: Record<string, string>) => Promise<void>;
  cancel: (runId: number) => Promise<void>;
  rerun: (runId: number) => Promise<void>;
  setSelectedRun: (run: WorkflowRun | null) => void;
}

export const useActionsStore = create<ActionsState>()((set, get) => ({
  workflows: [],
  runs: [],
  selectedRun: null,
  jobs: [],
  artifacts: [],
  loading: false,
  error: null,

  fetchWorkflows: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const workflows = await gitHubActionsApi.listWorkflows(owner, repoName);
      set({ workflows, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchRuns: async (workflowId) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const runs = await gitHubActionsApi.listRuns(owner, repoName, workflowId);
      set({ runs, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchJobs: async (runId) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const jobs = await gitHubActionsApi.getRunJobs(owner, repoName, runId);
      set({ jobs });
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  },

  fetchArtifacts: async (runId) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const artifacts = await gitHubActionsApi.listArtifacts(owner, repoName, runId);
      set({ artifacts });
    } catch (error) {
      console.error('Failed to fetch artifacts:', error);
    }
  },

  trigger: async (workflowId, ref, inputs) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubActionsApi.triggerWorkflow(owner, repoName, workflowId, ref, inputs);
    setTimeout(() => get().fetchRuns(), 2000);
  },

  cancel: async (runId) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubActionsApi.cancelRun(owner, repoName, runId);
    get().fetchRuns();
  },

  rerun: async (runId) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubActionsApi.rerunWorkflow(owner, repoName, runId);
    setTimeout(() => get().fetchRuns(), 2000);
  },

  setSelectedRun: (run) =>
    set({ selectedRun: run, jobs: [], artifacts: [] }),
}));
