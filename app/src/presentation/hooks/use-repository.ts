import { useCallback } from 'react';
import { useRepositoryStore, useRecentRepositoriesStore } from '../stores';
import { gitRepositoryApi, gitStatusApi, gitCommitApi, gitBranchApi, gitRemoteApi } from '@/infrastructure/api';

export function useRepository() {
  const store = useRepositoryStore();
  const recentStore = useRecentRepositoriesStore();

  const open = useCallback(async (path: string) => {
    store.setLoading(true);
    try {
      const repo = await gitRepositoryApi.open(path);
      store.setRepository(repo);
      recentStore.addRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });
      return repo;
    } catch (error) {
      store.setError(String(error));
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store, recentStore]);

  const init = useCallback(async (path: string) => {
    store.setLoading(true);
    try {
      const repo = await gitRepositoryApi.init(path);
      store.setRepository(repo);
      recentStore.addRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });
      return repo;
    } catch (error) {
      store.setError(String(error));
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store, recentStore]);

  const clone = useCallback(async (url: string, path: string) => {
    store.setLoading(true);
    try {
      const repo = await gitRepositoryApi.clone(url, path);
      store.setRepository(repo);
      recentStore.addRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });
      return repo;
    } catch (error) {
      store.setError(String(error));
      throw error;
    } finally {
      store.setLoading(false);
    }
  }, [store, recentStore]);

  return {
    repository: store.current,
    loading: store.loading,
    error: store.error,
    open,
    init,
    clone,
    reset: store.reset,
  };
}

export function useStatus() {
  const store = useRepositoryStore();

  const fetch = useCallback(async () => {
    try {
      const status = await gitStatusApi.getStatus();
      store.setStatus(status);
      return status;
    } catch (error) {
      store.setError(String(error));
      throw error;
    }
  }, [store]);

  const stage = useCallback(async (paths: string[]) => {
    await gitStatusApi.stageFiles(paths);
    await fetch();
  }, [fetch]);

  const unstage = useCallback(async (paths: string[]) => {
    await gitStatusApi.unstageFiles(paths);
    await fetch();
  }, [fetch]);

  const discard = useCallback(async (paths: string[]) => {
    await gitStatusApi.discardChanges(paths);
    await fetch();
  }, [fetch]);

  return {
    status: store.status,
    fetch,
    stage,
    unstage,
    discard,
  };
}

export function useCommits() {
  const store = useRepositoryStore();

  const fetch = useCallback(async (limit = 100, skip = 0) => {
    try {
      const commits = await gitCommitApi.getCommits(limit, skip);
      store.setCommits(commits);
      return commits;
    } catch (error) {
      store.setError(String(error));
      throw error;
    }
  }, [store]);

  const create = useCallback(async (message: string) => {
    const commit = await gitCommitApi.createCommit(message);
    await fetch();
    return commit;
  }, [fetch]);

  const cherryPick = useCallback(async (sha: string) => {
    await gitCommitApi.cherryPick(sha);
    await fetch();
  }, [fetch]);

  const revert = useCallback(async (sha: string) => {
    await gitCommitApi.revert(sha);
    await fetch();
  }, [fetch]);

  const reset = useCallback(async (sha: string, mode: 'soft' | 'mixed' | 'hard') => {
    await gitCommitApi.reset(sha, mode);
    await fetch();
  }, [fetch]);

  return {
    commits: store.commits,
    fetch,
    create,
    cherryPick,
    revert,
    reset,
  };
}

export function useBranches() {
  const store = useRepositoryStore();

  const fetch = useCallback(async () => {
    try {
      const branches = await gitBranchApi.getBranches();
      store.setBranches(branches);
      return branches;
    } catch (error) {
      store.setError(String(error));
      throw error;
    }
  }, [store]);

  const create = useCallback(async (name: string, startPoint?: string) => {
    const branch = await gitBranchApi.createBranch(name, startPoint);
    await fetch();
    return branch;
  }, [fetch]);

  const checkout = useCallback(async (name: string) => {
    await gitBranchApi.checkoutBranch(name);
    await fetch();
  }, [fetch]);

  const remove = useCallback(async (name: string, force = false) => {
    await gitBranchApi.deleteBranch(name, force);
    await fetch();
  }, [fetch]);

  const merge = useCallback(async (name: string) => {
    await gitBranchApi.mergeBranch(name);
    await fetch();
  }, [fetch]);

  return {
    branches: store.branches,
    fetch,
    create,
    checkout,
    remove,
    merge,
  };
}

export function useRemotes() {
  const store = useRepositoryStore();

  const fetch = useCallback(async () => {
    try {
      const remotes = await gitRemoteApi.getRemotes();
      store.setRemotes(remotes);
      return remotes;
    } catch (error) {
      store.setError(String(error));
      throw error;
    }
  }, [store]);

  const add = useCallback(async (name: string, url: string) => {
    await gitRemoteApi.addRemote(name, url);
    await fetch();
  }, [fetch]);

  const remove = useCallback(async (name: string) => {
    await gitRemoteApi.removeRemote(name);
    await fetch();
  }, [fetch]);

  const pull = useCallback(async (remote?: string, branch?: string) => {
    const result = await gitRemoteApi.pull(remote, branch);
    return result;
  }, []);

  const push = useCallback(async (remote?: string, branch?: string, force = false) => {
    await gitRemoteApi.push(remote, branch, force);
  }, []);

  const fetchRemote = useCallback(async (remote?: string) => {
    await gitRemoteApi.fetch(remote);
  }, []);

  const fetchAll = useCallback(async () => {
    await gitRemoteApi.fetchAll();
  }, []);

  return {
    remotes: store.remotes,
    fetch,
    add,
    remove,
    pull,
    push,
    fetchRemote,
    fetchAll,
  };
}
