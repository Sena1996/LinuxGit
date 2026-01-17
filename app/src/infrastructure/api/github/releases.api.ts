import { BaseApi } from '../base.api';
import type { IGitHubReleaseService, CreateReleaseData, UpdateReleaseData } from '@/domain/interfaces';
import type { Release, ReleaseAsset, Tag } from '@/domain/entities';

export class GitHubReleaseApi extends BaseApi implements IGitHubReleaseService {
  async list(owner: string, repo: string): Promise<Release[]> {
    return this.invoke<Release[]>('github_list_releases', {
      owner,
      repo,
      perPage: 30,
      page: null,
    });
  }

  async get(owner: string, repo: string, releaseId: number): Promise<Release> {
    return this.invoke<Release>('github_get_release', {
      owner,
      repo,
      releaseId,
    });
  }

  async getLatest(owner: string, repo: string): Promise<Release> {
    return this.invoke<Release>('github_get_latest_release', { owner, repo });
  }

  async getByTag(owner: string, repo: string, tag: string): Promise<Release> {
    return this.invoke<Release>('github_get_release_by_tag', {
      owner,
      repo,
      tag,
    });
  }

  async create(owner: string, repo: string, data: CreateReleaseData): Promise<Release> {
    return this.invoke<Release>('github_create_release', {
      owner,
      repo,
      tagName: data.tagName,
      targetCommitish: data.targetCommitish ?? null,
      name: data.name,
      body: data.body,
      draft: data.draft ?? false,
      prerelease: data.prerelease ?? false,
      generateReleaseNotes: data.generateReleaseNotes ?? false,
    });
  }

  async update(owner: string, repo: string, releaseId: number, data: UpdateReleaseData): Promise<Release> {
    return this.invoke<Release>('github_update_release', {
      owner,
      repo,
      releaseId,
      tagName: data.tagName,
      name: data.name,
      body: data.body,
      draft: data.draft,
      prerelease: data.prerelease,
    });
  }

  async delete(owner: string, repo: string, releaseId: number): Promise<void> {
    await this.invoke('github_delete_release', { owner, repo, releaseId });
  }

  async generateNotes(owner: string, repo: string, tagName: string): Promise<string> {
    return this.invoke<string>('github_generate_release_notes', {
      owner,
      repo,
      tagName,
    });
  }

  async listAssets(owner: string, repo: string, releaseId: number): Promise<ReleaseAsset[]> {
    return this.invoke<ReleaseAsset[]>('github_list_release_assets', {
      owner,
      repo,
      releaseId,
    });
  }

  async deleteAsset(owner: string, repo: string, assetId: number): Promise<void> {
    await this.invoke('github_delete_release_asset', {
      owner,
      repo,
      assetId,
    });
  }

  async listTags(owner: string, repo: string): Promise<Tag[]> {
    return this.invoke<Tag[]>('github_list_tags', {
      owner,
      repo,
      perPage: 100,
      page: null,
    });
  }
}

export const gitHubReleaseApi = new GitHubReleaseApi();
