export interface DeploymentCreator {
  login: string;
  id: number;
  avatar_url: string;
}

export interface Deployment {
  id: number;
  sha: string;
  ref_name: string;
  task: string;
  environment: string;
  description?: string;
  creator?: DeploymentCreator;
  created_at: string;
  updated_at: string;
  statuses_url: string;
  repository_url: string;
  transient_environment: boolean;
  production_environment: boolean;
}

export interface DeploymentStatus {
  id: number;
  state: DeploymentState;
  description?: string;
  environment?: string;
  environment_url?: string;
  log_url?: string;
  created_at: string;
  updated_at: string;
  creator?: DeploymentCreator;
}

export type DeploymentState =
  | 'error'
  | 'failure'
  | 'inactive'
  | 'in_progress'
  | 'queued'
  | 'pending'
  | 'success';

export interface EnvironmentDeploymentStats {
  environment: string;
  total: number;
  successful: number;
  failed: number;
  pending: number;
  latest?: Deployment;
}

export interface DeploymentSummary {
  total_count: number;
  environments: EnvironmentDeploymentStats[];
}

export interface Environment {
  id: number;
  name: string;
  url: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  protection_rules: ProtectionRule[];
  deployment_branch_policy?: DeploymentBranchPolicy;
}

export interface ProtectionRule {
  id: number;
  rule_type: string;
  wait_timer?: number;
  reviewers?: Reviewer[];
}

export interface Reviewer {
  reviewer_type: string;
  reviewer: ReviewerInfo;
}

export interface ReviewerInfo {
  id: number;
  login?: string;
  name?: string;
  avatar_url?: string;
}

export interface DeploymentBranchPolicy {
  protected_branches: boolean;
  custom_branch_policies: boolean;
}

export interface EnvironmentsResponse {
  total_count: number;
  environments: Environment[];
}

export interface EnvironmentSecret {
  name: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentSecretsResponse {
  total_count: number;
  secrets: EnvironmentSecret[];
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentVariablesResponse {
  total_count: number;
  variables: EnvironmentVariable[];
}

export interface BranchPolicy {
  id: number;
  name: string;
  policy_type?: string;
}

export interface BranchPoliciesResponse {
  total_count: number;
  branch_policies: BranchPolicy[];
}

export interface PipelineHealth {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  failedThisWeek: number;
  queuedRuns: number;
  activeRuns: number;
}

export interface DevOpsOverview {
  pipelineHealth: PipelineHealth;
  deploymentSummary: DeploymentSummary;
  environments: Environment[];
  recentDeployments: Deployment[];
}
