import { create } from 'zustand';

export interface FileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'conflict';
  staged: boolean;
}

export interface Commit {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  email: string;
  date: string;
  parents: string[];
}

export interface Branch {
  name: string;
  isRemote: boolean;
  isCurrent: boolean;
  upstream?: string;
  ahead: number;
  behind: number;
}

export interface RemoteInfo {
  name: string;
  url: string;
  push_url?: string;
}

export interface RepoInfo {
  path: string;
  name: string;
  currentBranch: string;
  headSha?: string;
  isDetached?: boolean;
  isClean?: boolean;
  remotes?: string[];
}

interface RepoState {
  // Current repository
  repo: RepoInfo | null;
  isLoading: boolean;
  error: string | null;

  // File status
  stagedFiles: FileStatus[];
  unstagedFiles: FileStatus[];
  untrackedFiles: FileStatus[];

  // Commits
  commits: Commit[];
  selectedCommit: Commit | null;

  // Branches
  branches: Branch[];

  // Remotes
  remotes: RemoteInfo[];

  // Actions
  setRepo: (repo: RepoInfo | null) => void;
  clearRepo: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setStatus: (staged: FileStatus[], unstaged: FileStatus[], untracked: FileStatus[]) => void;
  setCommits: (commits: Commit[]) => void;
  selectCommit: (commit: Commit | null) => void;
  setBranches: (branches: Branch[]) => void;
  setRemotes: (remotes: RemoteInfo[]) => void;
}

export const useRepoStore = create<RepoState>((set) => ({
  repo: null,
  isLoading: false,
  error: null,
  stagedFiles: [],
  unstagedFiles: [],
  untrackedFiles: [],
  commits: [],
  selectedCommit: null,
  branches: [],
  remotes: [],

  setRepo: (repo) => set({ repo, error: null }),
  clearRepo: () => set({
    repo: null,
    stagedFiles: [],
    unstagedFiles: [],
    untrackedFiles: [],
    commits: [],
    selectedCommit: null,
    branches: [],
    remotes: [],
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  setStatus: (stagedFiles, unstagedFiles, untrackedFiles) =>
    set({ stagedFiles, unstagedFiles, untrackedFiles }),
  setCommits: (commits) => set({ commits }),
  selectCommit: (selectedCommit) => set({ selectedCommit }),
  setBranches: (branches) => set({ branches }),
  setRemotes: (remotes) => set({ remotes }),
}));
