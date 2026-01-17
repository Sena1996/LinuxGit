import { BaseApi } from '../base.api';
import type { IGitHubPullRequestService, CreatePullRequestData, UpdatePullRequestData, CreateReviewData, MergeMethod } from '@/domain/interfaces';
import type { PullRequest, PullRequestReview, PullRequestComment } from '@/domain/entities';

export class GitHubPullRequestApi extends BaseApi implements IGitHubPullRequestService {
  async list(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open'): Promise<PullRequest[]> {
    return this.invoke<PullRequest[]>('github_list_pull_requests', {
      owner,
      repo,
      state,
      sort: 'updated',
      direction: 'desc',
      perPage: 30,
    });
  }

  async get(owner: string, repo: string, number: number): Promise<PullRequest> {
    return this.invoke<PullRequest>('github_get_pull_request', {
      owner,
      repo,
      pullNumber: number,
    });
  }

  async create(owner: string, repo: string, data: CreatePullRequestData): Promise<PullRequest> {
    return this.invoke<PullRequest>('github_create_pull_request', {
      owner,
      repo,
      title: data.title,
      body: data.body,
      head: data.head,
      base: data.base,
      draft: data.draft ?? false,
    });
  }

  async update(owner: string, repo: string, number: number, data: UpdatePullRequestData): Promise<PullRequest> {
    return this.invoke<PullRequest>('github_update_pull_request', {
      owner,
      repo,
      pullNumber: number,
      title: data.title,
      body: data.body,
      state: data.state,
    });
  }

  async merge(owner: string, repo: string, number: number, method: MergeMethod = 'merge'): Promise<void> {
    await this.invoke('github_merge_pull_request', {
      owner,
      repo,
      pullNumber: number,
      mergeMethod: method,
    });
  }

  async getReviews(owner: string, repo: string, number: number): Promise<PullRequestReview[]> {
    return this.invoke<PullRequestReview[]>('github_list_pr_reviews', {
      owner,
      repo,
      pullNumber: number,
    });
  }

  async getComments(owner: string, repo: string, number: number): Promise<PullRequestComment[]> {
    return this.invoke<PullRequestComment[]>('github_list_pr_comments', {
      owner,
      repo,
      pullNumber: number,
    });
  }

  async requestReviewers(owner: string, repo: string, number: number, reviewers: string[]): Promise<void> {
    await this.invoke('github_request_reviewers', {
      owner,
      repo,
      pullNumber: number,
      reviewers,
    });
  }

  async createReview(owner: string, repo: string, number: number, data: CreateReviewData): Promise<void> {
    await this.invoke('github_create_review', {
      owner,
      repo,
      pullNumber: number,
      body: data.body,
      event: data.event,
      comments: data.comments,
    });
  }
}

export const gitHubPullRequestApi = new GitHubPullRequestApi();
