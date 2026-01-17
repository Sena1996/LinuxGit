import { BaseApi } from '../base.api';
import type { IGitHubAuthService, IGitHubUserService } from '@/domain/interfaces';
import type { GitHubUser, GitHubRepo } from '@/domain/entities';

interface RawGitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name?: string;
  email?: string;
  html_url: string;
}

interface RawGitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
  owner: RawGitHubUser;
}

class GitHubMapper {
  static toUser(raw: RawGitHubUser): GitHubUser {
    return {
      id: raw.id,
      login: raw.login,
      avatarUrl: raw.avatar_url,
      name: raw.name,
      email: raw.email,
      htmlUrl: raw.html_url,
    };
  }

  static toRepo(raw: RawGitHubRepo): GitHubRepo {
    return {
      id: raw.id,
      name: raw.name,
      fullName: raw.full_name,
      description: raw.description,
      private: raw.private,
      htmlUrl: raw.html_url,
      cloneUrl: raw.clone_url,
      sshUrl: raw.ssh_url,
      defaultBranch: raw.default_branch,
      owner: GitHubMapper.toUser(raw.owner),
    };
  }
}

export class GitHubAuthApi extends BaseApi implements IGitHubAuthService {
  async login(): Promise<void> {
    await this.invoke('github_login');
  }

  async logout(): Promise<void> {
    await this.invoke('github_logout');
  }

  async getAuthStatus(): Promise<{ authenticated: boolean; user?: GitHubUser }> {
    const status = await this.invoke<{ authenticated: boolean; user?: RawGitHubUser }>('github_auth_status');
    return {
      authenticated: status.authenticated,
      user: status.user ? GitHubMapper.toUser(status.user) : undefined,
    };
  }

  async getToken(): Promise<string | null> {
    return this.invoke<string | null>('github_get_token');
  }
}

export class GitHubUserApi extends BaseApi implements IGitHubUserService {
  async getCurrentUser(): Promise<GitHubUser> {
    const raw = await this.invoke<RawGitHubUser>('github_get_user');
    return GitHubMapper.toUser(raw);
  }

  async getRepos(): Promise<GitHubRepo[]> {
    const raw = await this.invoke<RawGitHubRepo[]>('github_get_repos');
    return raw.map(GitHubMapper.toRepo);
  }
}

export const gitHubAuthApi = new GitHubAuthApi();
export const gitHubUserApi = new GitHubUserApi();
export { GitHubMapper };
