export interface GitHubUser {
  id: number;
  login: string;
  avatarUrl: string;
  name?: string;
  email?: string;
  htmlUrl: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  owner: GitHubUser;
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
  openIssues: number;
  closedIssues: number;
  dueOn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  draft: boolean;
  merged: boolean;
  mergeable?: boolean;
  mergeableState?: string;
  htmlUrl: string;
  diffUrl: string;
  patchUrl: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  head: BranchRef;
  base: BranchRef;
  user: GitHubUser;
  assignees: GitHubUser[];
  requestedReviewers: GitHubUser[];
  labels: Label[];
  comments: number;
  reviewComments: number;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface BranchRef {
  ref: string;
  sha: string;
  label: string;
}

export interface PullRequestReview {
  id: number;
  user: GitHubUser;
  body?: string;
  state: ReviewState;
  htmlUrl: string;
  submittedAt: string;
}

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'PENDING' | 'DISMISSED';

export interface PullRequestComment {
  id: number;
  body: string;
  user: GitHubUser;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  path?: string;
  line?: number;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  stateReason?: 'completed' | 'not_planned' | 'reopened';
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  user: GitHubUser;
  assignees: GitHubUser[];
  labels: Label[];
  milestone?: Milestone;
  comments: number;
  locked: boolean;
  pullRequest?: { url: string };
}

export interface IssueComment {
  id: number;
  body: string;
  user: GitHubUser;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
}

export interface Workflow {
  id: number;
  name: string;
  path: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  badgeUrl?: string;
}

export interface WorkflowRun {
  id: number;
  name?: string;
  headBranch?: string;
  headSha: string;
  runNumber: number;
  event: string;
  status?: string;
  conclusion?: string;
  workflowId: number;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  jobsUrl: string;
  logsUrl: string;
  runStartedAt?: string;
  actor?: GitHubUser;
}

export interface WorkflowJob {
  id: number;
  runId: number;
  name: string;
  status: string;
  conclusion?: string;
  startedAt?: string;
  completedAt?: string;
  steps?: WorkflowStep[];
}

export interface WorkflowStep {
  name: string;
  status: string;
  conclusion?: string;
  number: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Artifact {
  id: number;
  name: string;
  sizeInBytes: number;
  archiveDownloadUrl: string;
  expired: boolean;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface Release {
  id: number;
  tagName: string;
  name?: string;
  body?: string;
  draft: boolean;
  prerelease: boolean;
  createdAt: string;
  publishedAt?: string;
  htmlUrl: string;
  tarballUrl?: string;
  zipballUrl?: string;
  author?: GitHubUser;
  assets: ReleaseAsset[];
}

export interface ReleaseAsset {
  id: number;
  name: string;
  label?: string;
  contentType: string;
  size: number;
  downloadCount: number;
  browserDownloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  name: string;
  zipballUrl: string;
  tarballUrl: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface PagesInfo {
  url?: string;
  status?: string;
  cname?: string;
  custom404: boolean;
  htmlUrl?: string;
  buildType?: string;
  source?: PageSource;
  public: boolean;
  httpsEnforced?: boolean;
}

export interface PageSource {
  branch: string;
  path: string;
}

export interface PagesBuild {
  url: string;
  status: string;
  error?: { message?: string };
  pusher?: GitHubUser;
  commit: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  unread: boolean;
  reason: string;
  updatedAt: string;
  lastReadAt?: string;
  subject: NotificationSubject;
  repository: NotificationRepository;
  url: string;
  subscriptionUrl: string;
}

export interface NotificationSubject {
  title: string;
  type: string;
  url?: string;
  latestCommentUrl?: string;
}

export interface NotificationRepository {
  id: number;
  name: string;
  fullName: string;
  owner: GitHubUser;
  htmlUrl: string;
  description?: string;
  private: boolean;
}

export interface Contributor {
  author?: GitHubUser;
  total: number;
  weeks: ContributorWeek[];
}

export interface ContributorWeek {
  week: number;
  additions: number;
  deletions: number;
  commits: number;
}

export interface CommitActivity {
  days: number[];
  total: number;
  week: number;
}

export interface TrafficData {
  count: number;
  uniques: number;
}

export interface TrafficViews extends TrafficData {
  views: TrafficEntry[];
}

export interface TrafficClones extends TrafficData {
  clones: TrafficEntry[];
}

export interface TrafficEntry {
  timestamp: string;
  count: number;
  uniques: number;
}
