import { BaseApi } from './base.api';
import type {
  IGitRepository,
  IGitStatusService,
  IGitCommitService,
  IGitBranchService,
  IGitDiffService,
  IGitRemoteService,
  IGitTagService,
  IGitConfigService,
} from '@/domain/interfaces';
import type {
  Repository,
  StatusInfo,
  CommitInfo,
  BranchInfo,
  FileDiff,
  RemoteInfo,
  TagInfo,
  FileStatus,
} from '@/domain/entities';

interface RawRepoInfo {
  path: string;
  name: string;
  head_branch: string | null;
  head_sha: string | null;
  is_detached: boolean;
}

interface RawCommitInfo {
  sha: string;
  short_sha: string;
  message: string;
  author_name: string;
  author_email: string;
  timestamp: number;
  parents: string[];
}

interface RawBranchInfo {
  name: string;
  is_head: boolean;
  is_remote: boolean;
  upstream?: string;
  ahead?: number;
  behind?: number;
}

interface RawStatusInfo {
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: FileStatus[];
  conflicted: FileStatus[];
}

interface RawFileDiff {
  path: string;
  hunks: Array<{
    header: string;
    lines: Array<{
      content: string;
      line_type: string;
      old_line_no?: number;
      new_line_no?: number;
    }>;
    old_start: number;
    old_lines: number;
    new_start: number;
    new_lines: number;
  }>;
  old_path?: string;
  binary: boolean;
  additions: number;
  deletions: number;
}

class GitMapper {
  static toRepository(raw: RawRepoInfo): Repository {
    return {
      path: raw.path,
      name: raw.name,
      currentBranch: raw.head_branch || 'main',
      headSha: raw.head_sha || undefined,
      isDetached: raw.is_detached,
      remotes: [],
    };
  }

  static toCommitInfo(raw: RawCommitInfo): CommitInfo {
    return {
      sha: raw.sha,
      shortSha: raw.short_sha,
      message: raw.message,
      author: {
        name: raw.author_name,
        email: raw.author_email,
      },
      timestamp: raw.timestamp,
      parents: raw.parents,
    };
  }

  static toBranchInfo(raw: RawBranchInfo): BranchInfo {
    return {
      name: raw.name,
      isHead: raw.is_head,
      isRemote: raw.is_remote,
      upstream: raw.upstream,
      aheadBehind: raw.ahead !== undefined && raw.behind !== undefined
        ? { ahead: raw.ahead, behind: raw.behind }
        : undefined,
    };
  }

  static toFileDiff(raw: RawFileDiff): FileDiff {
    return {
      path: raw.path,
      oldPath: raw.old_path,
      binary: raw.binary,
      additions: raw.additions,
      deletions: raw.deletions,
      hunks: raw.hunks.map(hunk => ({
        header: hunk.header,
        oldStart: hunk.old_start,
        oldLines: hunk.old_lines,
        newStart: hunk.new_start,
        newLines: hunk.new_lines,
        lines: hunk.lines.map(line => ({
          content: line.content,
          lineType: line.line_type as 'context' | 'addition' | 'deletion' | 'header',
          oldLineNo: line.old_line_no,
          newLineNo: line.new_line_no,
        })),
      })),
    };
  }
}

export class GitRepositoryApi extends BaseApi implements IGitRepository {
  async open(path: string): Promise<Repository> {
    const raw = await this.invoke<RawRepoInfo>('open_repository', { path });
    return GitMapper.toRepository(raw);
  }

  async init(path: string): Promise<Repository> {
    const raw = await this.invoke<RawRepoInfo>('init_repository', { path });
    return GitMapper.toRepository(raw);
  }

  async getInfo(): Promise<Repository> {
    const raw = await this.invoke<RawRepoInfo>('get_repository_info');
    return GitMapper.toRepository(raw);
  }

  async clone(url: string, path: string): Promise<Repository> {
    const raw = await this.invoke<RawRepoInfo>('clone_repository', { url, path });
    return GitMapper.toRepository(raw);
  }
}

export class GitStatusApi extends BaseApi implements IGitStatusService {
  async getStatus(): Promise<StatusInfo> {
    const raw = await this.invoke<RawStatusInfo>('get_status');
    return raw;
  }

  async stageFiles(paths: string[]): Promise<void> {
    await this.invoke('stage_files', { paths });
  }

  async unstageFiles(paths: string[]): Promise<void> {
    await this.invoke('unstage_files', { paths });
  }

  async discardChanges(paths: string[]): Promise<void> {
    await this.invoke('discard_changes', { paths });
  }
}

export class GitCommitApi extends BaseApi implements IGitCommitService {
  async getCommits(limit = 100, skip = 0): Promise<CommitInfo[]> {
    const raw = await this.invoke<RawCommitInfo[]>('get_commits', { limit, skip });
    return raw.map(GitMapper.toCommitInfo);
  }

  async getCommitDetail(sha: string): Promise<CommitInfo> {
    const raw = await this.invoke<RawCommitInfo>('get_commit_detail', { sha });
    return GitMapper.toCommitInfo(raw);
  }

  async createCommit(message: string): Promise<CommitInfo> {
    const raw = await this.invoke<RawCommitInfo>('create_commit', { message });
    return GitMapper.toCommitInfo(raw);
  }

  async amendCommit(message: string): Promise<CommitInfo> {
    const raw = await this.invoke<RawCommitInfo>('create_commit', { message, amend: true });
    return GitMapper.toCommitInfo(raw);
  }

  async cherryPick(sha: string): Promise<void> {
    await this.invoke('cherry_pick_commit', { sha });
  }

  async revert(sha: string): Promise<void> {
    await this.invoke('revert_commit', { sha });
  }

  async reset(sha: string, mode: 'soft' | 'mixed' | 'hard'): Promise<void> {
    await this.invoke('reset_to_commit', { sha, mode });
  }

  async checkout(sha: string): Promise<void> {
    await this.invoke('checkout_commit', { sha });
  }
}

export class GitBranchApi extends BaseApi implements IGitBranchService {
  async getBranches(): Promise<BranchInfo[]> {
    const raw = await this.invoke<RawBranchInfo[]>('get_branches');
    return raw.map(GitMapper.toBranchInfo);
  }

  async createBranch(name: string, startPoint?: string): Promise<BranchInfo> {
    const raw = await this.invoke<RawBranchInfo>('create_branch', { name, startPoint });
    return GitMapper.toBranchInfo(raw);
  }

  async deleteBranch(name: string, force = false): Promise<void> {
    await this.invoke('delete_branch', { name, force });
  }

  async checkoutBranch(name: string): Promise<void> {
    await this.invoke('checkout_branch', { name });
  }

  async mergeBranch(name: string): Promise<void> {
    await this.invoke('merge_branch', { name });
  }

  async renameBranch(oldName: string, newName: string): Promise<void> {
    await this.invoke('rename_branch', { oldName, newName });
  }
}

export class GitDiffApi extends BaseApi implements IGitDiffService {
  async getFileDiff(path: string, staged = false): Promise<FileDiff> {
    const raw = await this.invoke<RawFileDiff>('get_file_diff', { path, staged });
    return GitMapper.toFileDiff(raw);
  }

  async getCommitDiff(sha: string): Promise<FileDiff[]> {
    const raw = await this.invoke<RawFileDiff[]>('get_commit_diff', { sha });
    return raw.map(GitMapper.toFileDiff);
  }
}

export class GitRemoteApi extends BaseApi implements IGitRemoteService {
  async getRemotes(): Promise<RemoteInfo[]> {
    return this.invoke<RemoteInfo[]>('get_remotes');
  }

  async addRemote(name: string, url: string): Promise<void> {
    await this.invoke('add_remote', { name, url });
  }

  async removeRemote(name: string): Promise<void> {
    await this.invoke('remove_remote', { name });
  }

  async fetch(remote?: string): Promise<void> {
    await this.invoke('fetch_remote', { remote });
  }

  async fetchAll(): Promise<void> {
    await this.invoke('fetch_all_remotes');
  }

  async pull(remote?: string, branch?: string): Promise<{ fastForward: boolean; conflicts: boolean }> {
    const result = await this.invoke<{ fast_forward: boolean; conflicts: boolean }>('pull_remote', { remote, branch });
    return { fastForward: result.fast_forward, conflicts: result.conflicts };
  }

  async push(remote?: string, branch?: string, force = false): Promise<void> {
    await this.invoke('push_remote', { remote, branch, force });
  }
}

export class GitTagApi extends BaseApi implements IGitTagService {
  async getTags(): Promise<TagInfo[]> {
    return this.invoke<TagInfo[]>('get_tags');
  }

  async createTag(name: string, sha: string, message?: string): Promise<TagInfo> {
    return this.invoke<TagInfo>('create_tag', { name, sha, message });
  }

  async deleteTag(name: string): Promise<void> {
    await this.invoke('delete_tag', { name });
  }
}

export class GitConfigApi extends BaseApi implements IGitConfigService {
  async getConfig(key: string): Promise<string | null> {
    return this.invoke<string | null>('get_git_config', { key });
  }

  async setConfig(key: string, value: string): Promise<void> {
    await this.invoke('set_git_config', { key, value });
  }

  async getSshKeys(): Promise<string[]> {
    return this.invoke<string[]>('get_ssh_keys');
  }
}

export const gitRepositoryApi = new GitRepositoryApi();
export const gitStatusApi = new GitStatusApi();
export const gitCommitApi = new GitCommitApi();
export const gitBranchApi = new GitBranchApi();
export const gitDiffApi = new GitDiffApi();
export const gitRemoteApi = new GitRemoteApi();
export const gitTagApi = new GitTagApi();
export const gitConfigApi = new GitConfigApi();
