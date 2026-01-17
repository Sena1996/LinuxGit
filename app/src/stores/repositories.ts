import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RepositoryEntry {
  path: string;
  name: string;
  lastOpened: number;
  currentBranch?: string;
  remote?: string;
  syncStatus?: {
    ahead: number;
    behind: number;
  };
}

interface RepositoriesState {
  // Persisted
  recentRepositories: RepositoryEntry[];

  // Actions
  addRecentRepository: (repo: RepositoryEntry) => void;
  removeRecentRepository: (path: string) => void;
  updateRepositoryStatus: (path: string, status: Partial<RepositoryEntry>) => void;
  clearRecentRepositories: () => void;
  getRecentRepository: (path: string) => RepositoryEntry | undefined;
}

const MAX_RECENT_REPOS = 10;

export const useRepositoriesStore = create<RepositoriesState>()(
  persist(
    (set, get) => ({
      recentRepositories: [],

      addRecentRepository: (repo) => set((state) => {
        // Remove if already exists, then add to front
        const filtered = state.recentRepositories.filter(r => r.path !== repo.path);
        return {
          recentRepositories: [
            { ...repo, lastOpened: Date.now() },
            ...filtered
          ].slice(0, MAX_RECENT_REPOS)
        };
      }),

      removeRecentRepository: (path) => set((state) => ({
        recentRepositories: state.recentRepositories.filter(r => r.path !== path)
      })),

      updateRepositoryStatus: (path, status) => set((state) => ({
        recentRepositories: state.recentRepositories.map(r =>
          r.path === path ? { ...r, ...status } : r
        )
      })),

      clearRecentRepositories: () => set({ recentRepositories: [] }),

      getRecentRepository: (path) => {
        return get().recentRepositories.find(r => r.path === path);
      },
    }),
    {
      name: 'linuxgit-repositories',
      version: 1,
    }
  )
);
