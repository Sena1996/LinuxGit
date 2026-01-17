import { create } from 'zustand';
import type { PagesInfo, PagesBuild } from '@/domain/entities';
import { gitHubPagesApi } from '@/infrastructure/api';
import { useGitHubContextStore } from './context.store';

interface PagesState {
  info: PagesInfo | null;
  builds: PagesBuild[];
  loading: boolean;
  error: string | null;

  fetchInfo: () => Promise<void>;
  fetchBuilds: () => Promise<void>;
  enable: (branch: string, path: string) => Promise<void>;
  disable: () => Promise<void>;
  requestBuild: () => Promise<void>;
}

export const usePagesStore = create<PagesState>()((set, get) => ({
  info: null,
  builds: [],
  loading: false,
  error: null,

  fetchInfo: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const info = await gitHubPagesApi.getInfo(owner, repoName);
      set({ info, loading: false });
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('not enabled')) {
        set({ info: null, loading: false, error: null });
      } else {
        set({ error: errorMsg, loading: false });
      }
    }
  },

  fetchBuilds: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const builds = await gitHubPagesApi.listBuilds(owner, repoName);
      set({ builds });
    } catch (error) {
      console.error('Failed to fetch builds:', error);
    }
  },

  enable: async (branch, path) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true });
    try {
      const info = await gitHubPagesApi.enable(owner, repoName, branch, path);
      set({ info, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  disable: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubPagesApi.disable(owner, repoName);
    set({ info: null });
  },

  requestBuild: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubPagesApi.requestBuild(owner, repoName);
    get().fetchBuilds();
  },
}));
