import { create } from 'zustand';
import type { Contributor, CommitActivity, TrafficViews, TrafficClones } from '@/domain/entities';
import { gitHubInsightsApi } from '@/infrastructure/api';
import { useGitHubContextStore } from './context.store';
import { RETRY_DELAY } from '@/shared/constants';

interface InsightsState {
  contributors: Contributor[];
  commitActivity: CommitActivity[];
  trafficViews: TrafficViews | null;
  trafficClones: TrafficClones | null;
  languages: Record<string, number>;
  loading: boolean;
  error: string | null;
  computing: boolean;

  fetchAll: () => Promise<void>;
  fetchContributors: () => Promise<void>;
  fetchCommitActivity: () => Promise<void>;
  fetchTrafficViews: () => Promise<void>;
  fetchTrafficClones: () => Promise<void>;
  fetchLanguages: () => Promise<void>;
}

export const useInsightsStore = create<InsightsState>()((set, get) => ({
  contributors: [],
  commitActivity: [],
  trafficViews: null,
  trafficClones: null,
  languages: {},
  loading: false,
  error: null,
  computing: false,

  fetchAll: async () => {
    const state = get();
    await Promise.all([
      state.fetchContributors(),
      state.fetchCommitActivity(),
      state.fetchTrafficViews(),
      state.fetchTrafficClones(),
      state.fetchLanguages(),
    ]);
  },

  fetchContributors: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const contributors = await gitHubInsightsApi.getContributors(owner, repoName);
      set({ contributors, loading: false, computing: false });
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes('being computed')) {
        set({ computing: true, loading: true });
        setTimeout(() => get().fetchContributors(), RETRY_DELAY);
        return;
      }
      set({ error: errorStr, loading: false, computing: false });
    }
  },

  fetchCommitActivity: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const commitActivity = await gitHubInsightsApi.getCommitActivity(owner, repoName);
      set({ commitActivity });
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes('being computed')) {
        setTimeout(() => get().fetchCommitActivity(), RETRY_DELAY);
        return;
      }
      console.error('Failed to fetch commit activity:', error);
    }
  },

  fetchTrafficViews: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const trafficViews = await gitHubInsightsApi.getTrafficViews(owner, repoName);
      set({ trafficViews });
    } catch (error) {
      console.error('Failed to fetch traffic views:', error);
    }
  },

  fetchTrafficClones: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const trafficClones = await gitHubInsightsApi.getTrafficClones(owner, repoName);
      set({ trafficClones });
    } catch (error) {
      console.error('Failed to fetch traffic clones:', error);
    }
  },

  fetchLanguages: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const languages = await gitHubInsightsApi.getLanguages(owner, repoName);
      set({ languages });
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  },
}));
