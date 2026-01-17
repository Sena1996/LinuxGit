import { create } from 'zustand';
import type { Release, Tag } from '@/domain/entities';
import { gitHubReleaseApi } from '@/infrastructure/api';
import { useGitHubContextStore } from './context.store';

interface ReleasesState {
  items: Release[];
  selected: Release | null;
  tags: Tag[];
  loading: boolean;
  error: string | null;

  fetch: () => Promise<void>;
  fetchTags: () => Promise<void>;
  create: (tagName: string, name: string, body: string, draft?: boolean, prerelease?: boolean) => Promise<Release>;
  delete: (releaseId: number) => Promise<void>;
  setSelected: (release: Release | null) => void;
}

export const useReleasesStore = create<ReleasesState>()((set, get) => ({
  items: [],
  selected: null,
  tags: [],
  loading: false,
  error: null,

  fetch: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    set({ loading: true, error: null });
    try {
      const items = await gitHubReleaseApi.list(owner, repoName);
      set({ items, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchTags: async () => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    try {
      const tags = await gitHubReleaseApi.listTags(owner, repoName);
      set({ tags });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  create: async (tagName, name, body, draft = false, prerelease = false) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) throw new Error('No repository context');

    const release = await gitHubReleaseApi.create(owner, repoName, {
      tagName,
      name,
      body,
      draft,
      prerelease,
    });

    get().fetch();
    return release;
  },

  delete: async (releaseId) => {
    const { owner, repoName } = useGitHubContextStore.getState();
    if (!owner || !repoName) return;

    await gitHubReleaseApi.delete(owner, repoName, releaseId);
    get().fetch();
  },

  setSelected: (release) =>
    set({ selected: release }),
}));
