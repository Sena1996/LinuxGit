import { useEffect, useMemo, useRef } from 'react';
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { useRepoStore } from '@/stores/repo';
import { useGitHubStore as useGitHubMainStore } from '@/stores/github';
import { useGitHubStore as useGitHubAuthStore } from '@/hooks/useGitHub';

// Sync Status Types
export interface SyncStatus {
  ahead: number;
  behind: number;
  remote_name: string | null;
  upstream_branch: string | null;
}

// CI Status Types
export interface CIStatus {
  name: string;
  status: 'queued' | 'in_progress' | 'completed' | string;
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | null | string;
  failed: boolean;
  inProgress: boolean;
  url: string;
}

// Notification Counts
export interface NotificationCounts {
  // Git sync
  pullAvailable: number;
  pushAvailable: number;

  // Local changes
  stagedChanges: number;
  unstagedChanges: number;
  totalChanges: number;

  // GitHub
  unreadNotifications: number;
  prReviewRequests: number;
  assignedPRs: number;
  assignedIssues: number;
  failedCIRuns: number;

  // Aggregates
  gitHubTotal: number;
  total: number;
}

// Zustand store for sync status (centralized polling)
interface SyncStatusStore {
  syncStatus: SyncStatus | null;
  syncLoading: boolean;
  lastFetchTime: number;
  subscriberCount: number;
  setSyncStatus: (status: SyncStatus | null) => void;
  setSyncLoading: (loading: boolean) => void;
  setLastFetchTime: (time: number) => void;
  incrementSubscribers: () => void;
  decrementSubscribers: () => void;
}

const useSyncStatusStore = create<SyncStatusStore>((set) => ({
  syncStatus: null,
  syncLoading: false,
  lastFetchTime: 0,
  subscriberCount: 0,
  setSyncStatus: (status) => set({ syncStatus: status }),
  setSyncLoading: (loading) => set({ syncLoading: loading }),
  setLastFetchTime: (time) => set({ lastFetchTime: time }),
  incrementSubscribers: () => set((state) => ({ subscriberCount: state.subscriberCount + 1 })),
  decrementSubscribers: () => set((state) => ({ subscriberCount: Math.max(0, state.subscriberCount - 1) })),
}));

// Global polling interval reference (shared across all hook instances)
let syncPollingInterval: ReturnType<typeof setInterval> | null = null;
let githubPollingInterval: ReturnType<typeof setInterval> | null = null;

// Main Notifications Hook
export function useNotifications(options: { pollingInterval?: number } = {}) {
  const { pollingInterval = 30000 } = options;
  const isFirstMount = useRef(true);

  const { repo, stagedFiles, unstagedFiles } = useRepoStore();
  const {
    workflowRuns,
    pullRequests,
    issues,
    unreadCount,
    fetchUnreadCount
  } = useGitHubMainStore();
  const { user, isAuthenticated } = useGitHubAuthStore();

  // Use centralized store for sync status
  const {
    syncStatus,
    syncLoading,
    setSyncStatus,
    setSyncLoading,
    setLastFetchTime,
    incrementSubscribers,
    decrementSubscribers,
  } = useSyncStatusStore();

  // Fetch sync status (centralized)
  const fetchSyncStatus = async () => {
    const currentRepo = useRepoStore.getState().repo;
    if (!currentRepo) {
      setSyncStatus(null);
      return;
    }

    try {
      setSyncLoading(true);
      const status = await invoke<SyncStatus>('get_repo_sync_status');
      setSyncStatus(status);
      setLastFetchTime(Date.now());
    } catch {
      setSyncStatus(null);
    } finally {
      setSyncLoading(false);
    }
  };

  // Manage polling lifecycle - only one polling interval globally
  useEffect(() => {
    if (!repo) {
      // Clear sync status when no repo
      setSyncStatus(null);
      return;
    }

    // Track subscribers
    incrementSubscribers();

    // Start sync polling if not already running
    if (!syncPollingInterval) {
      // Initial fetch
      fetchSyncStatus();

      // Start polling
      syncPollingInterval = setInterval(fetchSyncStatus, pollingInterval);
    } else if (isFirstMount.current) {
      // Component mounted but polling already running - do initial fetch if stale
      const timeSinceLastFetch = Date.now() - useSyncStatusStore.getState().lastFetchTime;
      if (timeSinceLastFetch > pollingInterval) {
        fetchSyncStatus();
      }
    }

    isFirstMount.current = false;

    return () => {
      decrementSubscribers();

      // Stop polling only when no more subscribers
      // Use setTimeout to check after state update
      setTimeout(() => {
        if (useSyncStatusStore.getState().subscriberCount === 0 && syncPollingInterval) {
          clearInterval(syncPollingInterval);
          syncPollingInterval = null;
        }
      }, 0);
    };
  }, [repo, pollingInterval]);

  // GitHub notifications polling (separate, also centralized)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Start GitHub polling if not already running
    if (!githubPollingInterval) {
      fetchUnreadCount();
      githubPollingInterval = setInterval(fetchUnreadCount, 60000);
    }

    return () => {
      // Check if this is the last authenticated subscriber
      setTimeout(() => {
        const authStore = useGitHubAuthStore.getState();
        if (!authStore.isAuthenticated && githubPollingInterval) {
          clearInterval(githubPollingInterval);
          githubPollingInterval = null;
        }
      }, 0);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  // Compute PR review requests (PRs where current user is requested reviewer)
  const prReviewRequests = useMemo(() => {
    if (!user || !pullRequests) return 0;
    return pullRequests.filter(pr =>
      pr.state === 'open' &&
      pr.requested_reviewers?.some(r => r.login === user.login)
    ).length;
  }, [pullRequests, user]);

  // Compute assigned PRs
  const assignedPRs = useMemo(() => {
    if (!user || !pullRequests) return 0;
    return pullRequests.filter(pr =>
      pr.state === 'open' &&
      pr.assignees?.some(a => a.login === user.login)
    ).length;
  }, [pullRequests, user]);

  // Compute assigned issues
  const assignedIssues = useMemo(() => {
    if (!user || !issues) return 0;
    return issues.filter(issue =>
      issue.state === 'open' &&
      !issue.pull_request && // Exclude PRs
      issue.assignees?.some(a => a.login === user.login)
    ).length;
  }, [issues, user]);

  // Compute failed CI runs (latest run per workflow)
  const failedCIRuns = useMemo(() => {
    if (!workflowRuns) return 0;

    // Group by workflow and get latest
    const latestByWorkflow = new Map<number, typeof workflowRuns[0]>();
    for (const run of workflowRuns) {
      const existing = latestByWorkflow.get(run.workflow_id);
      if (!existing || new Date(run.created_at) > new Date(existing.created_at)) {
        latestByWorkflow.set(run.workflow_id, run);
      }
    }

    return Array.from(latestByWorkflow.values()).filter(
      run => run.conclusion === 'failure'
    ).length;
  }, [workflowRuns]);

  // Latest CI status
  const latestCIStatus = useMemo((): CIStatus | null => {
    if (!workflowRuns || workflowRuns.length === 0) return null;

    const latest = workflowRuns[0];
    return {
      name: latest.name || 'Workflow',
      status: latest.status || 'unknown',
      conclusion: latest.conclusion || null,
      failed: latest.conclusion === 'failure',
      inProgress: latest.status === 'in_progress' || latest.status === 'queued',
      url: latest.html_url,
    };
  }, [workflowRuns]);

  // Aggregate counts
  const counts = useMemo((): NotificationCounts => {
    const pullAvailable = syncStatus?.behind ?? 0;
    const pushAvailable = syncStatus?.ahead ?? 0;
    const stagedChanges = stagedFiles.length;
    const unstagedChanges = unstagedFiles.length;
    const totalChanges = stagedChanges + unstagedChanges;
    const unreadNotifications = unreadCount;

    const gitHubTotal = unreadNotifications + prReviewRequests + assignedPRs + assignedIssues + failedCIRuns;
    const total = pullAvailable + pushAvailable + totalChanges + gitHubTotal;

    return {
      pullAvailable,
      pushAvailable,
      stagedChanges,
      unstagedChanges,
      totalChanges,
      unreadNotifications,
      prReviewRequests,
      assignedPRs,
      assignedIssues,
      failedCIRuns,
      gitHubTotal,
      total,
    };
  }, [syncStatus, stagedFiles, unstagedFiles, unreadCount, prReviewRequests, assignedPRs, assignedIssues, failedCIRuns]);

  return {
    // Sync status
    syncStatus,
    syncLoading,
    refetchSync: fetchSyncStatus,
    hasRemote: syncStatus?.remote_name != null,
    needsPull: (syncStatus?.behind ?? 0) > 0,
    needsPush: (syncStatus?.ahead ?? 0) > 0,
    isInSync: syncStatus != null && syncStatus.ahead === 0 && syncStatus.behind === 0,

    // CI status
    latestCIStatus,

    // All counts
    counts,

    // Convenience booleans
    hasNotifications: counts.total > 0,
    hasGitHubNotifications: counts.gitHubTotal > 0,
    hasLocalChanges: counts.totalChanges > 0,
  };
}

// Simpler hook for just sync status (uses same centralized store)
export function useSyncStatus(options: { interval?: number; enabled?: boolean } = {}) {
  const { interval = 30000, enabled = true } = options;

  // Just use the main hook with the same interval
  const notifications = useNotifications({ pollingInterval: interval });

  // Return only sync-related data
  return {
    syncStatus: enabled ? notifications.syncStatus : null,
    loading: notifications.syncLoading,
    refetch: notifications.refetchSync,
    hasRemote: enabled ? notifications.hasRemote : false,
    needsPull: enabled ? notifications.needsPull : false,
    needsPush: enabled ? notifications.needsPush : false,
    isInSync: enabled ? notifications.isInSync : false,
  };
}
