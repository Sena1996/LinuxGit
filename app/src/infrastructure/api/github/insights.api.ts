import { BaseApi } from '../base.api';
import type { IGitHubInsightsService } from '@/domain/interfaces';
import type { Contributor, CommitActivity, TrafficViews, TrafficClones } from '@/domain/entities';

export class GitHubInsightsApi extends BaseApi implements IGitHubInsightsService {
  private retryCount = 0;
  private readonly maxRetries = 3;
  private readonly retryDelay = 3000;

  async getContributors(owner: string, repo: string): Promise<Contributor[]> {
    return this.withRetry(() =>
      this.invoke<Contributor[]>('github_get_contributors', { owner, repo })
    );
  }

  async getCommitActivity(owner: string, repo: string): Promise<CommitActivity[]> {
    return this.withRetry(() =>
      this.invoke<CommitActivity[]>('github_get_commit_activity', { owner, repo })
    );
  }

  async getTrafficViews(owner: string, repo: string): Promise<TrafficViews> {
    return this.invoke<TrafficViews>('github_get_traffic_views', { owner, repo });
  }

  async getTrafficClones(owner: string, repo: string): Promise<TrafficClones> {
    return this.invoke<TrafficClones>('github_get_traffic_clones', { owner, repo });
  }

  async getLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const result = await this.invoke<{ 0: Record<string, number> }>('github_get_languages', {
      owner,
      repo,
    });
    return result[0] || {};
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      this.retryCount = 0;
      return await fn();
    } catch (error) {
      const errorStr = String(error);
      if (errorStr.includes('being computed') && this.retryCount < this.maxRetries) {
        this.retryCount++;
        await this.delay(this.retryDelay);
        return this.withRetry(fn);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const gitHubInsightsApi = new GitHubInsightsApi();
