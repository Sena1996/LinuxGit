import { BaseApi } from '../base.api';
import type { IGitHubIssueService, CreateIssueData, UpdateIssueData } from '@/domain/interfaces';
import type { Issue, IssueComment, Label, Milestone } from '@/domain/entities';

export class GitHubIssueApi extends BaseApi implements IGitHubIssueService {
  async list(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<Issue[]> {
    const issues = await this.invoke<Issue[]>('github_list_issues', {
      owner,
      repo,
      state,
      sort: 'updated',
      direction: 'desc',
      perPage: 30,
    });
    return issues.filter(i => !i.pullRequest);
  }

  async get(owner: string, repo: string, number: number): Promise<Issue> {
    return this.invoke<Issue>('github_get_issue', {
      owner,
      repo,
      issueNumber: number,
    });
  }

  async create(owner: string, repo: string, data: CreateIssueData): Promise<Issue> {
    return this.invoke<Issue>('github_create_issue', {
      owner,
      repo,
      title: data.title,
      body: data.body ?? null,
      labels: data.labels ?? null,
      assignees: data.assignees ?? null,
      milestone: data.milestone ?? null,
    });
  }

  async update(owner: string, repo: string, number: number, data: UpdateIssueData): Promise<Issue> {
    return this.invoke<Issue>('github_update_issue', {
      owner,
      repo,
      issueNumber: number,
      title: data.title ?? null,
      body: data.body ?? null,
      state: data.state ?? null,
      labels: data.labels ?? null,
      assignees: data.assignees ?? null,
      milestone: data.milestone,
    });
  }

  async getComments(owner: string, repo: string, number: number): Promise<IssueComment[]> {
    return this.invoke<IssueComment[]>('github_list_issue_comments', {
      owner,
      repo,
      issueNumber: number,
      perPage: 100,
    });
  }

  async addComment(owner: string, repo: string, number: number, body: string): Promise<IssueComment> {
    return this.invoke<IssueComment>('github_create_issue_comment', {
      owner,
      repo,
      issueNumber: number,
      body,
    });
  }

  async getLabels(owner: string, repo: string): Promise<Label[]> {
    return this.invoke<Label[]>('github_list_labels', {
      owner,
      repo,
      perPage: 100,
    });
  }

  async getMilestones(owner: string, repo: string): Promise<Milestone[]> {
    return this.invoke<Milestone[]>('github_list_milestones', {
      owner,
      repo,
      state: 'all',
      perPage: 100,
    });
  }

  async addLabels(owner: string, repo: string, number: number, labels: string[]): Promise<void> {
    await this.invoke('github_add_labels_to_issue', {
      owner,
      repo,
      issueNumber: number,
      labels,
    });
  }

  async lock(owner: string, repo: string, number: number): Promise<void> {
    await this.invoke('github_lock_issue', {
      owner,
      repo,
      issueNumber: number,
    });
  }

  async unlock(owner: string, repo: string, number: number): Promise<void> {
    await this.invoke('github_unlock_issue', {
      owner,
      repo,
      issueNumber: number,
    });
  }
}

export const gitHubIssueApi = new GitHubIssueApi();
