import type {
  GitHubUser,
  GitHubRepo,
  PullRequest,
  PullRequestReview,
  PullRequestComment,
  Issue,
  IssueComment,
  Label,
  Milestone,
  Workflow,
  WorkflowRun,
  WorkflowJob,
  Artifact,
  Release,
  ReleaseAsset,
  Tag,
  PagesInfo,
  PagesBuild,
  Notification,
  Contributor,
  CommitActivity,
  TrafficViews,
  TrafficClones,
} from '../entities';

export interface IGitHubAuthService {
  login(): Promise<void>;
  logout(): Promise<void>;
  getAuthStatus(): Promise<{ authenticated: boolean; user?: GitHubUser }>;
  getToken(): Promise<string | null>;
}

export interface IGitHubUserService {
  getCurrentUser(): Promise<GitHubUser>;
  getRepos(): Promise<GitHubRepo[]>;
}

export interface IGitHubPullRequestService {
  list(owner: string, repo: string, state?: 'open' | 'closed' | 'all'): Promise<PullRequest[]>;
  get(owner: string, repo: string, number: number): Promise<PullRequest>;
  create(owner: string, repo: string, data: CreatePullRequestData): Promise<PullRequest>;
  update(owner: string, repo: string, number: number, data: UpdatePullRequestData): Promise<PullRequest>;
  merge(owner: string, repo: string, number: number, method?: MergeMethod): Promise<void>;
  getReviews(owner: string, repo: string, number: number): Promise<PullRequestReview[]>;
  getComments(owner: string, repo: string, number: number): Promise<PullRequestComment[]>;
  requestReviewers(owner: string, repo: string, number: number, reviewers: string[]): Promise<void>;
  createReview(owner: string, repo: string, number: number, data: CreateReviewData): Promise<void>;
}

export interface IGitHubIssueService {
  list(owner: string, repo: string, state?: 'open' | 'closed' | 'all'): Promise<Issue[]>;
  get(owner: string, repo: string, number: number): Promise<Issue>;
  create(owner: string, repo: string, data: CreateIssueData): Promise<Issue>;
  update(owner: string, repo: string, number: number, data: UpdateIssueData): Promise<Issue>;
  getComments(owner: string, repo: string, number: number): Promise<IssueComment[]>;
  addComment(owner: string, repo: string, number: number, body: string): Promise<IssueComment>;
  getLabels(owner: string, repo: string): Promise<Label[]>;
  getMilestones(owner: string, repo: string): Promise<Milestone[]>;
  addLabels(owner: string, repo: string, number: number, labels: string[]): Promise<void>;
  lock(owner: string, repo: string, number: number): Promise<void>;
  unlock(owner: string, repo: string, number: number): Promise<void>;
}

export interface IGitHubActionsService {
  listWorkflows(owner: string, repo: string): Promise<Workflow[]>;
  listRuns(owner: string, repo: string, workflowId?: number): Promise<WorkflowRun[]>;
  getRun(owner: string, repo: string, runId: number): Promise<WorkflowRun>;
  getRunJobs(owner: string, repo: string, runId: number): Promise<WorkflowJob[]>;
  getRunLogs(owner: string, repo: string, runId: number): Promise<string>;
  triggerWorkflow(owner: string, repo: string, workflowId: number, ref: string, inputs?: Record<string, string>): Promise<void>;
  cancelRun(owner: string, repo: string, runId: number): Promise<void>;
  rerunWorkflow(owner: string, repo: string, runId: number): Promise<void>;
  rerunFailedJobs(owner: string, repo: string, runId: number): Promise<void>;
  listArtifacts(owner: string, repo: string, runId: number): Promise<Artifact[]>;
  deleteArtifact(owner: string, repo: string, artifactId: number): Promise<void>;
}

export interface IGitHubReleaseService {
  list(owner: string, repo: string): Promise<Release[]>;
  get(owner: string, repo: string, releaseId: number): Promise<Release>;
  getLatest(owner: string, repo: string): Promise<Release>;
  getByTag(owner: string, repo: string, tag: string): Promise<Release>;
  create(owner: string, repo: string, data: CreateReleaseData): Promise<Release>;
  update(owner: string, repo: string, releaseId: number, data: UpdateReleaseData): Promise<Release>;
  delete(owner: string, repo: string, releaseId: number): Promise<void>;
  generateNotes(owner: string, repo: string, tagName: string): Promise<string>;
  listAssets(owner: string, repo: string, releaseId: number): Promise<ReleaseAsset[]>;
  deleteAsset(owner: string, repo: string, assetId: number): Promise<void>;
  listTags(owner: string, repo: string): Promise<Tag[]>;
}

export interface IGitHubPagesService {
  getInfo(owner: string, repo: string): Promise<PagesInfo | null>;
  enable(owner: string, repo: string, branch: string, path: string): Promise<PagesInfo>;
  update(owner: string, repo: string, data: UpdatePagesData): Promise<PagesInfo>;
  disable(owner: string, repo: string): Promise<void>;
  listBuilds(owner: string, repo: string): Promise<PagesBuild[]>;
  getLatestBuild(owner: string, repo: string): Promise<PagesBuild>;
  requestBuild(owner: string, repo: string): Promise<void>;
}

export interface IGitHubNotificationService {
  list(all?: boolean): Promise<Notification[]>;
  listForRepo(owner: string, repo: string): Promise<Notification[]>;
  markAllRead(): Promise<void>;
  markRepoRead(owner: string, repo: string): Promise<void>;
  getThread(threadId: string): Promise<Notification>;
  markThreadRead(threadId: string): Promise<void>;
  markThreadDone(threadId: string): Promise<void>;
  getUnreadCount(): Promise<number>;
}

export interface IGitHubInsightsService {
  getContributors(owner: string, repo: string): Promise<Contributor[]>;
  getCommitActivity(owner: string, repo: string): Promise<CommitActivity[]>;
  getTrafficViews(owner: string, repo: string): Promise<TrafficViews>;
  getTrafficClones(owner: string, repo: string): Promise<TrafficClones>;
  getLanguages(owner: string, repo: string): Promise<Record<string, number>>;
}

export type MergeMethod = 'merge' | 'squash' | 'rebase';

export interface CreatePullRequestData {
  title: string;
  body?: string;
  head: string;
  base: string;
  draft?: boolean;
}

export interface UpdatePullRequestData {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
}

export interface CreateReviewData {
  body?: string;
  event: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  comments?: Array<{ path: string; line: number; body: string }>;
}

export interface CreateIssueData {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface UpdateIssueData {
  title?: string;
  body?: string;
  state?: 'open' | 'closed';
  labels?: string[];
  assignees?: string[];
  milestone?: number | null;
}

export interface CreateReleaseData {
  tagName: string;
  targetCommitish?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  generateReleaseNotes?: boolean;
}

export interface UpdateReleaseData {
  tagName?: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
}

export interface UpdatePagesData {
  cname?: string;
  httpsEnforced?: boolean;
  buildType?: string;
  source?: { branch: string; path: string };
}
