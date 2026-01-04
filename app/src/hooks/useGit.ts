import { invoke } from '@tauri-apps/api/core';
import { useState, useCallback } from 'react';
import { useRepoStore } from '@/stores/repo';

// Helper to safely extract error message
function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
}

// Types matching the Rust backend
export interface RepoInfo {
  path: string;
  name: string;
  is_bare: boolean;
  head_branch: string | null;
  head_sha: string | null;
  is_detached: boolean;
}

export interface FileStatus {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'conflict';
  staged: boolean;
  old_path: string | null;
}

export interface StatusInfo {
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: FileStatus[];
  conflicts: FileStatus[];
}

export interface CommitInfo {
  sha: string;
  short_sha: string;
  message: string;
  author: string;
  email: string;
  date: string;
  timestamp: number;
  parents: string[];
}

export interface BranchInfo {
  name: string;
  is_remote: boolean;
  is_current: boolean;
  upstream: string | null;
  ahead: number;
  behind: number;
}

export interface DiffLine {
  line_type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  old_line: number | null;
  new_line: number | null;
}

export interface DiffHunk {
  header: string;
  old_start: number;
  old_lines: number;
  new_start: number;
  new_lines: number;
  lines: DiffLine[];
}

export interface FileDiff {
  path: string;
  old_path: string | null;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'conflict';
  hunks: DiffHunk[];
  is_binary: boolean;
  additions: number;
  deletions: number;
}

// Hook for repository operations
export function useRepository() {
  const { setRepo, clearRepo } = useRepoStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openRepository = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const info = await invoke<RepoInfo>('open_repository', { path });
      setRepo({
        path: info.path,
        name: info.name,
        currentBranch: info.head_branch || 'HEAD',
        headSha: info.head_sha || undefined,
        isDetached: info.is_detached,
      });
      return info;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setRepo]);

  const initRepository = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const info = await invoke<RepoInfo>('init_repository', { path });
      setRepo({
        path: info.path,
        name: info.name,
        currentBranch: info.head_branch || 'main',
        headSha: info.head_sha || undefined,
        isDetached: info.is_detached,
      });
      return info;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setRepo]);

  const closeRepository = useCallback(() => {
    clearRepo();
  }, [clearRepo]);

  return { openRepository, initRepository, closeRepository, loading, error };
}

// Hook for file status operations
export function useStatus() {
  const { setStatus } = useRepoStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<StatusInfo>('get_status');
      setStatus(status.staged, status.unstaged, status.untracked);
      return status;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setStatus]);

  const stageFiles = useCallback(async (paths: string[]) => {
    try {
      await invoke('stage_files', { paths });
      await refreshStatus();
    } catch (e) {
      throw e;
    }
  }, [refreshStatus]);

  const unstageFiles = useCallback(async (paths: string[]) => {
    try {
      await invoke('unstage_files', { paths });
      await refreshStatus();
    } catch (e) {
      throw e;
    }
  }, [refreshStatus]);

  const discardChanges = useCallback(async (paths: string[]) => {
    try {
      await invoke('discard_changes', { paths });
      await refreshStatus();
    } catch (e) {
      throw e;
    }
  }, [refreshStatus]);

  return { refreshStatus, stageFiles, unstageFiles, discardChanges, loading, error };
}

// Hook for commit operations
export function useCommits() {
  const { setCommits } = useRepoStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommits = useCallback(async (limit = 100, skip = 0) => {
    setLoading(true);
    setError(null);
    try {
      const commits = await invoke<CommitInfo[]>('get_commits', { limit, skip });
      setCommits(commits.map(c => ({
        sha: c.sha,
        shortSha: c.short_sha,
        message: c.message,
        author: c.author,
        email: c.email,
        date: c.date,
        parents: c.parents,
      })));
      return commits;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setCommits]);

  const createCommit = useCallback(async (message: string) => {
    try {
      const commit = await invoke<CommitInfo>('create_commit', { message });
      await fetchCommits(); // Refresh list
      return commit;
    } catch (e) {
      throw e;
    }
  }, [fetchCommits]);

  const getCommitDetail = useCallback(async (sha: string) => {
    try {
      return await invoke<CommitInfo>('get_commit_detail', { sha });
    } catch (e) {
      throw e;
    }
  }, []);

  return { fetchCommits, createCommit, getCommitDetail, loading, error };
}

// Hook for branch operations
export function useBranches() {
  const { setBranches } = useRepoStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const branches = await invoke<BranchInfo[]>('get_branches');
      setBranches(branches.map(b => ({
        name: b.name,
        isRemote: b.is_remote,
        isCurrent: b.is_current,
        upstream: b.upstream || undefined,
        ahead: b.ahead,
        behind: b.behind,
      })));
      return branches;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [setBranches]);

  const createBranch = useCallback(async (name: string, fromSha?: string) => {
    try {
      const branch = await invoke<BranchInfo>('create_branch', { name, fromSha });
      await fetchBranches();
      return branch;
    } catch (e) {
      throw e;
    }
  }, [fetchBranches]);

  const checkoutBranch = useCallback(async (name: string) => {
    try {
      await invoke('checkout_branch', { name });
      await fetchBranches();
    } catch (e) {
      throw e;
    }
  }, [fetchBranches]);

  const deleteBranch = useCallback(async (name: string, force = false) => {
    try {
      await invoke('delete_branch', { name, force });
      await fetchBranches();
    } catch (e) {
      throw e;
    }
  }, [fetchBranches]);

  const mergeBranch = useCallback(async (name: string) => {
    try {
      await invoke('merge_branch', { name });
      await fetchBranches();
    } catch (e) {
      throw e;
    }
  }, [fetchBranches]);

  return { fetchBranches, createBranch, checkoutBranch, deleteBranch, mergeBranch, loading, error };
}

// Hook for diff operations
export function useDiff() {
  const [diff, setDiff] = useState<FileDiff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFileDiff = useCallback(async (path: string, staged: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const fileDiff = await invoke<FileDiff>('get_file_diff', { path, staged });
      setDiff(fileDiff);
      return fileDiff;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { diff, getFileDiff, loading, error };
}

// Hook for AI operations
export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCommitMessage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const message = await invoke<string>('generate_commit_message');
      return message;
    } catch (e) {
      const msg = getErrorMessage(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateCommitMessage, loading, error };
}
