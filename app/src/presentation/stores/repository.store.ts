import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Repository, StatusInfo, CommitInfo, BranchInfo, RemoteInfo, RepositoryEntry } from '@/domain/entities';
import { MAX_RECENT_REPOS } from '@/shared/constants';

interface RepositoryState {
  current: Repository | null;
  status: StatusInfo | null;
  commits: CommitInfo[];
  branches: BranchInfo[];
  remotes: RemoteInfo[];
  loading: boolean;
  error: string | null;

  setRepository: (repo: Repository | null) => void;
  setStatus: (status: StatusInfo | null) => void;
  setCommits: (commits: CommitInfo[]) => void;
  setBranches: (branches: BranchInfo[]) => void;
  setRemotes: (remotes: RemoteInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

interface RecentRepositoriesState {
  repositories: RepositoryEntry[];

  addRepository: (entry: RepositoryEntry) => void;
  removeRepository: (path: string) => void;
  updateRepository: (path: string, updates: Partial<RepositoryEntry>) => void;
  clearRepositories: () => void;
  getRepository: (path: string) => RepositoryEntry | undefined;
}

const initialRepositoryState = {
  current: null,
  status: null,
  commits: [],
  branches: [],
  remotes: [],
  loading: false,
  error: null,
};

export const useRepositoryStore = create<RepositoryState>()((set) => ({
  ...initialRepositoryState,

  setRepository: (repo) => set({ current: repo, error: null }),
  setStatus: (status) => set({ status }),
  setCommits: (commits) => set({ commits }),
  setBranches: (branches) => set({ branches }),
  setRemotes: (remotes) => set({ remotes }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  reset: () => set(initialRepositoryState),
}));

export const useRecentRepositoriesStore = create<RecentRepositoriesState>()(
  persist(
    (set, get) => ({
      repositories: [],

      addRepository: (entry) =>
        set((state) => {
          const filtered = state.repositories.filter((r) => r.path !== entry.path);
          return {
            repositories: [
              { ...entry, lastOpened: Date.now() },
              ...filtered,
            ].slice(0, MAX_RECENT_REPOS),
          };
        }),

      removeRepository: (path) =>
        set((state) => ({
          repositories: state.repositories.filter((r) => r.path !== path),
        })),

      updateRepository: (path, updates) =>
        set((state) => ({
          repositories: state.repositories.map((r) =>
            r.path === path ? { ...r, ...updates } : r
          ),
        })),

      clearRepositories: () => set({ repositories: [] }),

      getRepository: (path) => get().repositories.find((r) => r.path === path),
    }),
    {
      name: 'linuxgit-repositories',
      version: 1,
    }
  )
);

export function useCurrentRepository() {
  return useRepositoryStore((state) => state.current);
}

export function useRepositoryStatus() {
  return useRepositoryStore((state) => state.status);
}

export function useRepositoryCommits() {
  return useRepositoryStore((state) => state.commits);
}

export function useRepositoryBranches() {
  return useRepositoryStore((state) => state.branches);
}

export function useRepositoryRemotes() {
  return useRepositoryStore((state) => state.remotes);
}
