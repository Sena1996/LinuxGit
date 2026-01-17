import { invoke } from '@tauri-apps/api/core';
import type {
  Deployment,
  DeploymentStatus,
  DeploymentSummary,
  Environment,
  EnvironmentsResponse,
  EnvironmentSecretsResponse,
  EnvironmentVariablesResponse,
  BranchPolicy,
  BranchPoliciesResponse,
} from '@/domain/entities';

export const deploymentsApi = {
  async listDeployments(
    owner: string,
    repo: string,
    environment?: string,
    perPage?: number,
    page?: number
  ): Promise<Deployment[]> {
    return invoke('github_list_deployments', {
      owner,
      repo,
      environment,
      perPage,
      page,
    });
  },

  async getDeployment(
    owner: string,
    repo: string,
    deploymentId: number
  ): Promise<Deployment> {
    return invoke('github_get_deployment', {
      owner,
      repo,
      deploymentId,
    });
  },

  async createDeployment(
    owner: string,
    repo: string,
    refName: string,
    environment: string,
    options?: {
      description?: string;
      autoMerge?: boolean;
      requiredContexts?: string[];
      transientEnvironment?: boolean;
      productionEnvironment?: boolean;
    }
  ): Promise<Deployment> {
    return invoke('github_create_deployment', {
      owner,
      repo,
      refName,
      environment,
      description: options?.description,
      autoMerge: options?.autoMerge,
      requiredContexts: options?.requiredContexts,
      transientEnvironment: options?.transientEnvironment,
      productionEnvironment: options?.productionEnvironment,
    });
  },

  async deleteDeployment(
    owner: string,
    repo: string,
    deploymentId: number
  ): Promise<void> {
    return invoke('github_delete_deployment', {
      owner,
      repo,
      deploymentId,
    });
  },

  async listDeploymentStatuses(
    owner: string,
    repo: string,
    deploymentId: number,
    perPage?: number
  ): Promise<DeploymentStatus[]> {
    return invoke('github_list_deployment_statuses', {
      owner,
      repo,
      deploymentId,
      perPage,
    });
  },

  async createDeploymentStatus(
    owner: string,
    repo: string,
    deploymentId: number,
    state: string,
    options?: {
      description?: string;
      environmentUrl?: string;
      logUrl?: string;
      autoInactive?: boolean;
    }
  ): Promise<DeploymentStatus> {
    return invoke('github_create_deployment_status', {
      owner,
      repo,
      deploymentId,
      state,
      description: options?.description,
      environmentUrl: options?.environmentUrl,
      logUrl: options?.logUrl,
      autoInactive: options?.autoInactive,
    });
  },

  async getDeploymentSummary(
    owner: string,
    repo: string
  ): Promise<DeploymentSummary> {
    return invoke('github_get_deployment_summary', {
      owner,
      repo,
    });
  },
};

export const environmentsApi = {
  async listEnvironments(
    owner: string,
    repo: string,
    perPage?: number,
    page?: number
  ): Promise<EnvironmentsResponse> {
    return invoke('github_list_environments', {
      owner,
      repo,
      perPage,
      page,
    });
  },

  async getEnvironment(
    owner: string,
    repo: string,
    environmentName: string
  ): Promise<Environment> {
    return invoke('github_get_environment', {
      owner,
      repo,
      environmentName,
    });
  },

  async createEnvironment(
    owner: string,
    repo: string,
    environmentName: string,
    options?: {
      waitTimer?: number;
      preventSelfReview?: boolean;
      reviewers?: Array<{ reviewer_type: string; id: number }>;
      protectedBranches?: boolean;
      customBranchPolicies?: boolean;
    }
  ): Promise<Environment> {
    return invoke('github_create_environment', {
      owner,
      repo,
      environmentName,
      waitTimer: options?.waitTimer,
      preventSelfReview: options?.preventSelfReview,
      reviewers: options?.reviewers,
      protectedBranches: options?.protectedBranches,
      customBranchPolicies: options?.customBranchPolicies,
    });
  },

  async updateEnvironment(
    owner: string,
    repo: string,
    environmentName: string,
    options?: {
      waitTimer?: number;
      preventSelfReview?: boolean;
      reviewers?: Array<{ reviewer_type: string; id: number }>;
      protectedBranches?: boolean;
      customBranchPolicies?: boolean;
    }
  ): Promise<Environment> {
    return invoke('github_update_environment', {
      owner,
      repo,
      environmentName,
      waitTimer: options?.waitTimer,
      preventSelfReview: options?.preventSelfReview,
      reviewers: options?.reviewers,
      protectedBranches: options?.protectedBranches,
      customBranchPolicies: options?.customBranchPolicies,
    });
  },

  async deleteEnvironment(
    owner: string,
    repo: string,
    environmentName: string
  ): Promise<void> {
    return invoke('github_delete_environment', {
      owner,
      repo,
      environmentName,
    });
  },

  async listEnvironmentSecrets(
    owner: string,
    repo: string,
    environmentName: string
  ): Promise<EnvironmentSecretsResponse> {
    return invoke('github_list_environment_secrets', {
      owner,
      repo,
      environmentName,
    });
  },

  async listEnvironmentVariables(
    owner: string,
    repo: string,
    environmentName: string
  ): Promise<EnvironmentVariablesResponse> {
    return invoke('github_list_environment_variables', {
      owner,
      repo,
      environmentName,
    });
  },

  async listBranchPolicies(
    owner: string,
    repo: string,
    environmentName: string
  ): Promise<BranchPoliciesResponse> {
    return invoke('github_list_branch_policies', {
      owner,
      repo,
      environmentName,
    });
  },

  async createBranchPolicy(
    owner: string,
    repo: string,
    environmentName: string,
    name: string,
    policyType?: string
  ): Promise<BranchPolicy> {
    return invoke('github_create_branch_policy', {
      owner,
      repo,
      environmentName,
      name,
      policyType,
    });
  },

  async deleteBranchPolicy(
    owner: string,
    repo: string,
    environmentName: string,
    branchPolicyId: number
  ): Promise<void> {
    return invoke('github_delete_branch_policy', {
      owner,
      repo,
      environmentName,
      branchPolicyId,
    });
  },
};
