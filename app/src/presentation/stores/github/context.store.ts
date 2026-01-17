import { create } from 'zustand';
import type { GitHubTab, GitHubUser } from '@/domain/entities';
import { parseGitHubUrl } from '@/shared/utils';

interface GitHubContextState {
  authenticated: boolean;
  user: GitHubUser | null;
  owner: string | null;
  repoName: string | null;
  activeTab: GitHubTab;

  setAuthenticated: (authenticated: boolean, user?: GitHubUser | null) => void;
  setRepoContext: (owner: string, repoName: string) => void;
  clearRepoContext: () => void;
  setActiveTab: (tab: GitHubTab) => void;
  extractFromRemoteUrl: (url: string) => boolean;
}

export const useGitHubContextStore = create<GitHubContextState>()((set) => ({
  authenticated: false,
  user: null,
  owner: null,
  repoName: null,
  activeTab: 'pull-requests',

  setAuthenticated: (authenticated, user = null) =>
    set({ authenticated, user: authenticated ? user : null }),

  setRepoContext: (owner, repoName) =>
    set({ owner, repoName }),

  clearRepoContext: () =>
    set({ owner: null, repoName: null }),

  setActiveTab: (tab) =>
    set({ activeTab: tab }),

  extractFromRemoteUrl: (url) => {
    const parsed = parseGitHubUrl(url);
    if (parsed) {
      set({ owner: parsed.owner, repoName: parsed.repo });
      return true;
    }
    return false;
  },
}));

export function useGitHubOwner() {
  return useGitHubContextStore((state) => state.owner);
}

export function useGitHubRepoName() {
  return useGitHubContextStore((state) => state.repoName);
}
