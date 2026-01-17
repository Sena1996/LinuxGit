import { useCallback, useEffect } from 'react';
import { useGitHubContextStore, useNotificationsStore, startNotificationPolling, stopNotificationPolling } from '../stores';
import { gitHubAuthApi, gitHubUserApi } from '@/infrastructure/api';

export function useGitHubAuth() {
  const store = useGitHubContextStore();

  const checkStatus = useCallback(async () => {
    try {
      const status = await gitHubAuthApi.getAuthStatus();
      store.setAuthenticated(status.authenticated, status.user);
      return status;
    } catch (error) {
      store.setAuthenticated(false);
      throw error;
    }
  }, [store]);

  const login = useCallback(async () => {
    await gitHubAuthApi.login();
    await checkStatus();
    startNotificationPolling();
  }, [checkStatus]);

  const logout = useCallback(async () => {
    await gitHubAuthApi.logout();
    store.setAuthenticated(false);
    stopNotificationPolling();
  }, [store]);

  useEffect(() => {
    checkStatus().then((status) => {
      if (status.authenticated) {
        startNotificationPolling();
      }
    });
    return () => stopNotificationPolling();
  }, [checkStatus]);

  return {
    authenticated: store.authenticated,
    user: store.user,
    login,
    logout,
    checkStatus,
  };
}

export function useGitHubRepos() {
  const fetch = useCallback(async () => {
    return gitHubUserApi.getRepos();
  }, []);

  return { fetch };
}

export function useGitHubContext() {
  const store = useGitHubContextStore();

  return {
    owner: store.owner,
    repoName: store.repoName,
    activeTab: store.activeTab,
    setRepoContext: store.setRepoContext,
    clearRepoContext: store.clearRepoContext,
    setActiveTab: store.setActiveTab,
    extractFromRemoteUrl: store.extractFromRemoteUrl,
  };
}

export function useGitHubNotifications() {
  const store = useNotificationsStore();

  return {
    notifications: store.items,
    unreadCount: store.unreadCount,
    loading: store.loading,
    error: store.error,
    fetch: store.fetch,
    fetchUnreadCount: store.fetchUnreadCount,
    markRead: store.markRead,
    markAllRead: store.markAllRead,
    markDone: store.markDone,
  };
}
