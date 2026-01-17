import { BaseApi } from '../base.api';
import type { IGitHubActionsService } from '@/domain/interfaces';
import type { Workflow, WorkflowRun, WorkflowJob, Artifact } from '@/domain/entities';

export class GitHubActionsApi extends BaseApi implements IGitHubActionsService {
  async listWorkflows(owner: string, repo: string): Promise<Workflow[]> {
    return this.invoke<Workflow[]>('github_list_workflows', { owner, repo });
  }

  async listRuns(owner: string, repo: string, workflowId?: number): Promise<WorkflowRun[]> {
    return this.invoke<WorkflowRun[]>('github_list_workflow_runs', {
      owner,
      repo,
      workflowId: workflowId ?? null,
      branch: null,
      status: null,
      perPage: 30,
    });
  }

  async getRun(owner: string, repo: string, runId: number): Promise<WorkflowRun> {
    return this.invoke<WorkflowRun>('github_get_workflow_run', {
      owner,
      repo,
      runId,
    });
  }

  async getRunJobs(owner: string, repo: string, runId: number): Promise<WorkflowJob[]> {
    return this.invoke<WorkflowJob[]>('github_get_workflow_run_jobs', {
      owner,
      repo,
      runId,
    });
  }

  async getRunLogs(owner: string, repo: string, runId: number): Promise<string> {
    return this.invoke<string>('github_get_workflow_run_logs', {
      owner,
      repo,
      runId,
    });
  }

  async triggerWorkflow(owner: string, repo: string, workflowId: number, ref: string, inputs?: Record<string, string>): Promise<void> {
    await this.invoke('github_trigger_workflow', {
      owner,
      repo,
      workflowId,
      refName: ref,
      inputs: inputs ?? null,
    });
  }

  async cancelRun(owner: string, repo: string, runId: number): Promise<void> {
    await this.invoke('github_cancel_workflow_run', { owner, repo, runId });
  }

  async rerunWorkflow(owner: string, repo: string, runId: number): Promise<void> {
    await this.invoke('github_rerun_workflow', { owner, repo, runId });
  }

  async rerunFailedJobs(owner: string, repo: string, runId: number): Promise<void> {
    await this.invoke('github_rerun_failed_jobs', { owner, repo, runId });
  }

  async listArtifacts(owner: string, repo: string, runId: number): Promise<Artifact[]> {
    return this.invoke<Artifact[]>('github_list_run_artifacts', {
      owner,
      repo,
      runId,
    });
  }

  async deleteArtifact(owner: string, repo: string, artifactId: number): Promise<void> {
    await this.invoke('github_delete_artifact', {
      owner,
      repo,
      artifactId,
    });
  }
}

export const gitHubActionsApi = new GitHubActionsApi();
