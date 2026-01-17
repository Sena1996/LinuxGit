import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

// Types
export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  badge_url?: string;
}

export interface WorkflowRun {
  id: number;
  name?: string;
  head_branch?: string;
  head_sha: string;
  run_number: number;
  event: string;
  status?: string;
  conclusion?: string;
  workflow_id: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  jobs_url: string;
  logs_url: string;
  run_started_at?: string;
  actor?: {
    login: string;
    avatar_url: string;
  };
}

export interface WorkflowJob {
  id: number;
  run_id: number;
  name: string;
  status: string;
  conclusion?: string;
  started_at?: string;
  completed_at?: string;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  status: string;
  conclusion?: string;
  number: number;
  started_at?: string;
  completed_at?: string;
}

export interface Artifact {
  id: number;
  name: string;
  size_in_bytes: number;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

export interface Release {
  id: number;
  tag_name: string;
  name?: string;
  body?: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at?: string;
  html_url: string;
  tarball_url?: string;
  zipball_url?: string;
  author?: {
    login: string;
    avatar_url: string;
  };
  assets: ReleaseAsset[];
}

export interface ReleaseAsset {
  id: number;
  name: string;
  label?: string;
  content_type: string;
  size: number;
  download_count: number;
  browser_download_url: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  name: string;
  zipball_url: string;
  tarball_url: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface PagesInfo {
  url?: string;
  status?: string;
  cname?: string;
  custom_404: boolean;
  html_url?: string;
  build_type?: string;
  source?: {
    branch: string;
    path: string;
  };
  public: boolean;
  https_enforced?: boolean;
}

export interface PagesBuild {
  url: string;
  status: string;
  error?: { message?: string };
  pusher?: {
    login: string;
    avatar_url: string;
  };
  commit: string;
  duration: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  unread: boolean;
  reason: string;
  updated_at: string;
  last_read_at?: string;
  subject: {
    title: string;
    type: string;
    url?: string;
    latest_comment_url?: string;
  };
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      avatar_url: string;
    };
    html_url: string;
    description?: string;
    private: boolean;
  };
  url: string;
  subscription_url: string;
}

export interface Contributor {
  author?: {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
  };
  total: number;
  weeks: Array<{
    week: number;
    additions: number;
    deletions: number;
    commits: number;
  }>;
}

export interface CommitActivity {
  days: number[];
  total: number;
  week: number;
}

export interface TrafficViews {
  count: number;
  uniques: number;
  views: Array<{
    timestamp: string;
    count: number;
    uniques: number;
  }>;
}

export interface TrafficClones {
  count: number;
  uniques: number;
  clones: Array<{
    timestamp: string;
    count: number;
    uniques: number;
  }>;
}

// Pull Request types
export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  draft: boolean;
  merged: boolean;
  mergeable?: boolean;
  mergeable_state?: string;
  html_url: string;
  diff_url: string;
  patch_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  merged_at?: string;
  head: {
    ref: string;
    sha: string;
    label: string;
  };
  base: {
    ref: string;
    sha: string;
    label: string;
  };
  user: {
    login: string;
    avatar_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  requested_reviewers: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
}

export interface PullRequestReview {
  id: number;
  user: {
    login: string;
    avatar_url: string;
  };
  body?: string;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED';
  html_url: string;
  submitted_at: string;
}

export interface PullRequestComment {
  id: number;
  body: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
  path?: string;
  line?: number;
}

// Issue types
export interface Issue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  state_reason?: 'completed' | 'not_planned' | 'reopened';
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  user: {
    login: string;
    avatar_url: string;
  };
  assignees: Array<{
    login: string;
    avatar_url: string;
  }>;
  labels: Array<{
    id: number;
    name: string;
    color: string;
    description?: string;
  }>;
  milestone?: {
    id: number;
    number: number;
    title: string;
    description?: string;
    state: 'open' | 'closed';
    due_on?: string;
  };
  comments: number;
  locked: boolean;
  pull_request?: { url: string };
}

export interface IssueComment {
  id: number;
  body: string;
  user: {
    login: string;
    avatar_url: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
  default?: boolean;
}

export interface Milestone {
  id: number;
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed';
  open_issues: number;
  closed_issues: number;
  due_on?: string;
  created_at: string;
  updated_at: string;
}

export type GitHubTab = 'pull-requests' | 'issues' | 'actions' | 'releases' | 'pages' | 'notifications' | 'insights' | 'devops';

interface GitHubState {
  // Current tab
  activeTab: GitHubTab;
  setActiveTab: (tab: GitHubTab) => void;

  // Repo context (owner/repo extracted from remote URL)
  owner: string | null;
  repoName: string | null;
  setRepoContext: (owner: string, repoName: string) => void;

  // Actions state
  workflows: Workflow[];
  workflowRuns: WorkflowRun[];
  selectedRun: WorkflowRun | null;
  runJobs: WorkflowJob[];
  artifacts: Artifact[];
  actionsLoading: boolean;
  actionsError: string | null;

  // Releases state
  releases: Release[];
  selectedRelease: Release | null;
  tags: Tag[];
  releasesLoading: boolean;
  releasesError: string | null;

  // Pages state
  pagesInfo: PagesInfo | null;
  pagesBuilds: PagesBuild[];
  pagesLoading: boolean;
  pagesError: string | null;

  // Notifications state
  notifications: Notification[];
  unreadCount: number;
  notificationsLoading: boolean;
  notificationsError: string | null;

  // Insights state
  contributors: Contributor[];
  commitActivity: CommitActivity[];
  trafficViews: TrafficViews | null;
  trafficClones: TrafficClones | null;
  languages: Record<string, number>;
  insightsLoading: boolean;
  insightsError: string | null;

  // Pull Requests state
  pullRequests: PullRequest[];
  selectedPR: PullRequest | null;
  prReviews: PullRequestReview[];
  prComments: PullRequestComment[];
  prLoading: boolean;
  prError: string | null;

  // Issues state
  issues: Issue[];
  selectedIssue: Issue | null;
  issueComments: IssueComment[];
  labels: Label[];
  milestones: Milestone[];
  issuesLoading: boolean;
  issuesError: string | null;

  // Actions
  fetchWorkflows: () => Promise<void>;
  fetchWorkflowRuns: (workflowId?: number) => Promise<void>;
  fetchRunJobs: (runId: number) => Promise<void>;
  fetchArtifacts: (runId: number) => Promise<void>;
  triggerWorkflow: (workflowId: number, ref: string, inputs?: Record<string, string>) => Promise<void>;
  cancelRun: (runId: number) => Promise<void>;
  rerunWorkflow: (runId: number) => Promise<void>;

  fetchReleases: () => Promise<void>;
  fetchTags: () => Promise<void>;
  createRelease: (tagName: string, name: string, body: string, draft?: boolean, prerelease?: boolean) => Promise<Release>;
  deleteRelease: (releaseId: number) => Promise<void>;

  fetchPagesInfo: () => Promise<void>;
  fetchPagesBuilds: () => Promise<void>;
  enablePages: (branch: string, path: string) => Promise<void>;
  disablePages: () => Promise<void>;
  requestPagesBuild: () => Promise<void>;

  fetchNotifications: (all?: boolean) => Promise<void>;
  markNotificationRead: (threadId: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;

  fetchContributors: () => Promise<void>;
  fetchCommitActivity: () => Promise<void>;
  fetchTrafficViews: () => Promise<void>;
  fetchTrafficClones: () => Promise<void>;
  fetchLanguages: () => Promise<void>;

  // Pull Request actions
  fetchPullRequests: (state?: 'open' | 'closed' | 'all') => Promise<void>;
  fetchPullRequest: (prNumber: number) => Promise<void>;
  fetchPRReviews: (prNumber: number) => Promise<void>;
  fetchPRComments: (prNumber: number) => Promise<void>;
  createPullRequest: (title: string, body: string, head: string, base: string, draft?: boolean) => Promise<PullRequest>;
  mergePullRequest: (prNumber: number, mergeMethod?: 'merge' | 'squash' | 'rebase') => Promise<void>;
  closePullRequest: (prNumber: number) => Promise<void>;
  requestReview: (prNumber: number, reviewers: string[]) => Promise<void>;
  setSelectedPR: (pr: PullRequest | null) => void;

  // Issue actions
  fetchIssues: (state?: 'open' | 'closed' | 'all') => Promise<void>;
  fetchIssue: (issueNumber: number) => Promise<void>;
  fetchIssueComments: (issueNumber: number) => Promise<void>;
  fetchLabels: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  createIssue: (title: string, body?: string, labels?: string[], assignees?: string[], milestone?: number) => Promise<Issue>;
  updateIssue: (issueNumber: number, updates: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[]; assignees?: string[]; milestone?: number | null }) => Promise<void>;
  closeIssue: (issueNumber: number) => Promise<void>;
  addIssueComment: (issueNumber: number, body: string) => Promise<void>;
  setSelectedIssue: (issue: Issue | null) => void;
}

export const useGitHubStore = create<GitHubState>((set, get) => ({
  // Initial state
  activeTab: 'pull-requests',
  setActiveTab: (tab) => set({ activeTab: tab }),

  owner: null,
  repoName: null,
  setRepoContext: (owner, repoName) => set({ owner, repoName }),

  workflows: [],
  workflowRuns: [],
  selectedRun: null,
  runJobs: [],
  artifacts: [],
  actionsLoading: false,
  actionsError: null,

  releases: [],
  selectedRelease: null,
  tags: [],
  releasesLoading: false,
  releasesError: null,

  pagesInfo: null,
  pagesBuilds: [],
  pagesLoading: false,
  pagesError: null,

  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,
  notificationsError: null,

  contributors: [],
  commitActivity: [],
  trafficViews: null,
  trafficClones: null,
  languages: {},
  insightsLoading: false,
  insightsError: null,

  pullRequests: [],
  selectedPR: null,
  prReviews: [],
  prComments: [],
  prLoading: false,
  prError: null,

  issues: [],
  selectedIssue: null,
  issueComments: [],
  labels: [],
  milestones: [],
  issuesLoading: false,
  issuesError: null,

  // Actions implementations
  fetchWorkflows: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ actionsLoading: true, actionsError: null });
    try {
      const workflows = await invoke<Workflow[]>('github_list_workflows', { owner, repo: repoName });
      set({ workflows, actionsLoading: false });
    } catch (error) {
      set({ actionsError: String(error), actionsLoading: false });
    }
  },

  fetchWorkflowRuns: async (workflowId) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ actionsLoading: true, actionsError: null });
    try {
      const workflowRuns = await invoke<WorkflowRun[]>('github_list_workflow_runs', {
        owner,
        repo: repoName,
        workflowId: workflowId || null,
        branch: null,
        status: null,
        perPage: 30,
      });
      set({ workflowRuns, actionsLoading: false });
    } catch (error) {
      set({ actionsError: String(error), actionsLoading: false });
    }
  },

  fetchRunJobs: async (runId) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const runJobs = await invoke<WorkflowJob[]>('github_get_workflow_run_jobs', {
        owner,
        repo: repoName,
        runId,
      });
      set({ runJobs });
    } catch (error) {
      console.error('Failed to fetch run jobs:', error);
    }
  },

  fetchArtifacts: async (runId) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const artifacts = await invoke<Artifact[]>('github_list_run_artifacts', {
        owner,
        repo: repoName,
        runId,
      });
      set({ artifacts });
    } catch (error) {
      console.error('Failed to fetch artifacts:', error);
    }
  },

  triggerWorkflow: async (workflowId, ref, inputs) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_trigger_workflow', {
      owner,
      repo: repoName,
      workflowId,
      refName: ref,
      inputs: inputs || null,
    });
    // Refresh runs after trigger
    setTimeout(() => get().fetchWorkflowRuns(), 2000);
  },

  cancelRun: async (runId) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_cancel_workflow_run', { owner, repo: repoName, runId });
    get().fetchWorkflowRuns();
  },

  rerunWorkflow: async (runId) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_rerun_workflow', { owner, repo: repoName, runId });
    setTimeout(() => get().fetchWorkflowRuns(), 2000);
  },

  fetchReleases: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ releasesLoading: true, releasesError: null });
    try {
      const releases = await invoke<Release[]>('github_list_releases', {
        owner,
        repo: repoName,
        perPage: 30,
        page: null,
      });
      set({ releases, releasesLoading: false });
    } catch (error) {
      set({ releasesError: String(error), releasesLoading: false });
    }
  },

  fetchTags: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const tags = await invoke<Tag[]>('github_list_tags', {
        owner,
        repo: repoName,
        perPage: 100,
        page: null,
      });
      set({ tags });
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  },

  createRelease: async (tagName, name, body, draft = false, prerelease = false) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) throw new Error('No repository context');

    const release = await invoke<Release>('github_create_release', {
      owner,
      repo: repoName,
      tagName,
      targetCommitish: null,
      name,
      body,
      draft,
      prerelease,
      generateReleaseNotes: false,
    });

    get().fetchReleases();
    return release;
  },

  deleteRelease: async (releaseId) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_delete_release', { owner, repo: repoName, releaseId });
    get().fetchReleases();
  },

  fetchPagesInfo: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ pagesLoading: true, pagesError: null });
    try {
      const pagesInfo = await invoke<PagesInfo>('github_get_pages_info', { owner, repo: repoName });
      set({ pagesInfo, pagesLoading: false });
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('not enabled')) {
        set({ pagesInfo: null, pagesLoading: false, pagesError: null });
      } else {
        set({ pagesError: errorMsg, pagesLoading: false });
      }
    }
  },

  fetchPagesBuilds: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const pagesBuilds = await invoke<PagesBuild[]>('github_list_pages_builds', {
        owner,
        repo: repoName,
        perPage: 20,
        page: null,
      });
      set({ pagesBuilds });
    } catch (error) {
      console.error('Failed to fetch pages builds:', error);
    }
  },

  enablePages: async (branch, path) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ pagesLoading: true });
    try {
      const pagesInfo = await invoke<PagesInfo>('github_enable_pages', {
        owner,
        repo: repoName,
        branch,
        path,
      });
      set({ pagesInfo, pagesLoading: false });
    } catch (error) {
      set({ pagesError: String(error), pagesLoading: false });
    }
  },

  disablePages: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_disable_pages', { owner, repo: repoName });
    set({ pagesInfo: null });
  },

  requestPagesBuild: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_request_pages_build', { owner, repo: repoName });
    get().fetchPagesBuilds();
  },

  fetchNotifications: async (all = false) => {
    set({ notificationsLoading: true, notificationsError: null });
    try {
      const notifications = await invoke<Notification[]>('github_list_notifications', {
        all,
        participating: null,
        since: null,
        before: null,
        perPage: 50,
        page: null,
      });
      set({ notifications, notificationsLoading: false });
    } catch (error) {
      set({ notificationsError: String(error), notificationsLoading: false });
    }
  },

  markNotificationRead: async (threadId) => {
    await invoke('github_mark_thread_read', { threadId });
    const { notifications } = get();
    set({
      notifications: notifications.map((n) =>
        n.id === threadId ? { ...n, unread: false } : n
      ),
    });
    get().fetchUnreadCount();
  },

  markAllNotificationsRead: async () => {
    await invoke('github_mark_all_notifications_read', {
      lastReadAt: null,
      read: true,
    });
    const { notifications } = get();
    set({
      notifications: notifications.map((n) => ({ ...n, unread: false })),
      unreadCount: 0,
    });
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await invoke<number>('github_get_unread_count');
      set({ unreadCount });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  fetchContributors: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ insightsLoading: true, insightsError: null });
    try {
      const contributors = await invoke<Contributor[]>('github_get_contributors', {
        owner,
        repo: repoName,
      });
      set({ contributors, insightsLoading: false });
    } catch (error) {
      const errorStr = String(error);
      // GitHub returns 202 when stats are being computed - auto-retry after delay
      if (errorStr.includes('being computed')) {
        setTimeout(() => get().fetchContributors(), 3000);
        // Don't set error, just keep loading state
        return;
      }
      set({ insightsError: errorStr, insightsLoading: false });
    }
  },

  fetchCommitActivity: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const commitActivity = await invoke<CommitActivity[]>('github_get_commit_activity', {
        owner,
        repo: repoName,
      });
      set({ commitActivity });
    } catch (error) {
      const errorStr = String(error);
      // GitHub returns 202 when stats are being computed - auto-retry after delay
      if (errorStr.includes('being computed')) {
        setTimeout(() => get().fetchCommitActivity(), 3000);
        return;
      }
      console.error('Failed to fetch commit activity:', error);
    }
  },

  fetchTrafficViews: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const trafficViews = await invoke<TrafficViews>('github_get_traffic_views', {
        owner,
        repo: repoName,
      });
      set({ trafficViews });
    } catch (error) {
      console.error('Failed to fetch traffic views:', error);
    }
  },

  fetchTrafficClones: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const trafficClones = await invoke<TrafficClones>('github_get_traffic_clones', {
        owner,
        repo: repoName,
      });
      set({ trafficClones });
    } catch (error) {
      console.error('Failed to fetch traffic clones:', error);
    }
  },

  fetchLanguages: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const result = await invoke<{ 0: Record<string, number> }>('github_get_languages', {
        owner,
        repo: repoName,
      });
      set({ languages: result[0] || {} });
    } catch (error) {
      console.error('Failed to fetch languages:', error);
    }
  },

  // Pull Request implementations
  fetchPullRequests: async (state = 'open') => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ prLoading: true, prError: null });
    try {
      const pullRequests = await invoke<PullRequest[]>('github_list_pull_requests', {
        owner,
        repo: repoName,
        state,
        sort: 'updated',
        direction: 'desc',
        perPage: 30,
      });
      set({ pullRequests, prLoading: false });
    } catch (error) {
      set({ prError: String(error), prLoading: false });
    }
  },

  fetchPullRequest: async (prNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const pr = await invoke<PullRequest>('github_get_pull_request', {
        owner,
        repo: repoName,
        pullNumber: prNumber,
      });
      set({ selectedPR: pr });
    } catch (error) {
      console.error('Failed to fetch PR:', error);
    }
  },

  fetchPRReviews: async (prNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const prReviews = await invoke<PullRequestReview[]>('github_list_pr_reviews', {
        owner,
        repo: repoName,
        pullNumber: prNumber,
      });
      set({ prReviews });
    } catch (error) {
      console.error('Failed to fetch PR reviews:', error);
    }
  },

  fetchPRComments: async (prNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const prComments = await invoke<PullRequestComment[]>('github_list_pr_comments', {
        owner,
        repo: repoName,
        pullNumber: prNumber,
      });
      set({ prComments });
    } catch (error) {
      console.error('Failed to fetch PR comments:', error);
    }
  },

  createPullRequest: async (title, body, head, base, draft = false) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) throw new Error('No repository context');

    const pr = await invoke<PullRequest>('github_create_pull_request', {
      owner,
      repo: repoName,
      title,
      body,
      head,
      base,
      draft,
    });

    get().fetchPullRequests();
    return pr;
  },

  mergePullRequest: async (prNumber, mergeMethod = 'merge') => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_merge_pull_request', {
      owner,
      repo: repoName,
      pullNumber: prNumber,
      mergeMethod,
    });

    get().fetchPullRequests();
  },

  closePullRequest: async (prNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_update_pull_request', {
      owner,
      repo: repoName,
      pullNumber: prNumber,
      state: 'closed',
    });

    get().fetchPullRequests();
  },

  requestReview: async (prNumber, reviewers) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_request_reviewers', {
      owner,
      repo: repoName,
      pullNumber: prNumber,
      reviewers,
    });

    get().fetchPullRequest(prNumber);
  },

  setSelectedPR: (pr) => set({ selectedPR: pr, prReviews: [], prComments: [] }),

  // Issue implementations
  fetchIssues: async (state = 'open') => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    set({ issuesLoading: true, issuesError: null });
    try {
      const issues = await invoke<Issue[]>('github_list_issues', {
        owner,
        repo: repoName,
        state,
        sort: 'updated',
        direction: 'desc',
        perPage: 30,
      });
      // Filter out pull requests (GitHub API returns PRs in issues endpoint)
      set({ issues: issues.filter(i => !i.pull_request), issuesLoading: false });
    } catch (error) {
      set({ issuesError: String(error), issuesLoading: false });
    }
  },

  fetchIssue: async (issueNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const issue = await invoke<Issue>('github_get_issue', {
        owner,
        repo: repoName,
        issueNumber,
      });
      set({ selectedIssue: issue });
    } catch (error) {
      console.error('Failed to fetch issue:', error);
    }
  },

  fetchIssueComments: async (issueNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const issueComments = await invoke<IssueComment[]>('github_list_issue_comments', {
        owner,
        repo: repoName,
        issueNumber,
        perPage: 100,
      });
      set({ issueComments });
    } catch (error) {
      console.error('Failed to fetch issue comments:', error);
    }
  },

  fetchLabels: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const labels = await invoke<Label[]>('github_list_labels', {
        owner,
        repo: repoName,
        perPage: 100,
      });
      set({ labels });
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    }
  },

  fetchMilestones: async () => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    try {
      const milestones = await invoke<Milestone[]>('github_list_milestones', {
        owner,
        repo: repoName,
        state: 'all',
        perPage: 100,
      });
      set({ milestones });
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  },

  createIssue: async (title, body, labels, assignees, milestone) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) throw new Error('No repository context');

    const issue = await invoke<Issue>('github_create_issue', {
      owner,
      repo: repoName,
      title,
      body: body || null,
      labels: labels || null,
      assignees: assignees || null,
      milestone: milestone || null,
    });

    get().fetchIssues();
    return issue;
  },

  updateIssue: async (issueNumber, updates) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_update_issue', {
      owner,
      repo: repoName,
      issueNumber,
      title: updates.title || null,
      body: updates.body || null,
      state: updates.state || null,
      labels: updates.labels || null,
      assignees: updates.assignees || null,
      milestone: updates.milestone,
    });

    get().fetchIssues();
    get().fetchIssue(issueNumber);
  },

  closeIssue: async (issueNumber) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_update_issue', {
      owner,
      repo: repoName,
      issueNumber,
      state: 'closed',
    });

    get().fetchIssues();
  },

  addIssueComment: async (issueNumber, body) => {
    const { owner, repoName } = get();
    if (!owner || !repoName) return;

    await invoke('github_create_issue_comment', {
      owner,
      repo: repoName,
      issueNumber,
      body,
    });

    get().fetchIssueComments(issueNumber);
  },

  setSelectedIssue: (issue) => set({ selectedIssue: issue, issueComments: [] }),
}));

// Helper to extract owner/repo from remote URL
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Handle SSH URLs: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+)(\.git)?/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  // Handle HTTPS URLs: https://github.com/owner/repo.git
  const httpsMatch = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/.]+)(\.git)?/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}
