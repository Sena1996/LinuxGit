import { BaseApi } from '../base.api';
import type { IGitHubPagesService, UpdatePagesData } from '@/domain/interfaces';
import type { PagesInfo, PagesBuild } from '@/domain/entities';

export class GitHubPagesApi extends BaseApi implements IGitHubPagesService {
  async getInfo(owner: string, repo: string): Promise<PagesInfo | null> {
    try {
      return await this.invoke<PagesInfo>('github_get_pages_info', { owner, repo });
    } catch (error) {
      const errorMsg = String(error);
      if (errorMsg.includes('not enabled')) {
        return null;
      }
      throw error;
    }
  }

  async enable(owner: string, repo: string, branch: string, path: string): Promise<PagesInfo> {
    return this.invoke<PagesInfo>('github_enable_pages', {
      owner,
      repo,
      branch,
      path,
    });
  }

  async update(owner: string, repo: string, data: UpdatePagesData): Promise<PagesInfo> {
    return this.invoke<PagesInfo>('github_update_pages', {
      owner,
      repo,
      ...data,
    });
  }

  async disable(owner: string, repo: string): Promise<void> {
    await this.invoke('github_disable_pages', { owner, repo });
  }

  async listBuilds(owner: string, repo: string): Promise<PagesBuild[]> {
    return this.invoke<PagesBuild[]>('github_list_pages_builds', {
      owner,
      repo,
      perPage: 20,
      page: null,
    });
  }

  async getLatestBuild(owner: string, repo: string): Promise<PagesBuild> {
    return this.invoke<PagesBuild>('github_get_latest_pages_build', { owner, repo });
  }

  async requestBuild(owner: string, repo: string): Promise<void> {
    await this.invoke('github_request_pages_build', { owner, repo });
  }
}

export const gitHubPagesApi = new GitHubPagesApi();
