import type {
  Repository,
  StatusInfo,
  CommitInfo,
  BranchInfo,
  FileDiff,
  RemoteInfo,
  TagInfo,
} from '../entities';

export interface IGitRepository {
  open(path: string): Promise<Repository>;
  init(path: string): Promise<Repository>;
  getInfo(): Promise<Repository>;
  clone(url: string, path: string, onProgress?: (progress: number) => void): Promise<Repository>;
}

export interface IGitStatusService {
  getStatus(): Promise<StatusInfo>;
  stageFiles(paths: string[]): Promise<void>;
  unstageFiles(paths: string[]): Promise<void>;
  discardChanges(paths: string[]): Promise<void>;
}

export interface IGitCommitService {
  getCommits(limit?: number, skip?: number): Promise<CommitInfo[]>;
  getCommitDetail(sha: string): Promise<CommitInfo>;
  createCommit(message: string): Promise<CommitInfo>;
  amendCommit(message: string): Promise<CommitInfo>;
  cherryPick(sha: string): Promise<void>;
  revert(sha: string): Promise<void>;
  reset(sha: string, mode: 'soft' | 'mixed' | 'hard'): Promise<void>;
  checkout(sha: string): Promise<void>;
}

export interface IGitBranchService {
  getBranches(): Promise<BranchInfo[]>;
  createBranch(name: string, startPoint?: string): Promise<BranchInfo>;
  deleteBranch(name: string, force?: boolean): Promise<void>;
  checkoutBranch(name: string): Promise<void>;
  mergeBranch(name: string, noFf?: boolean): Promise<void>;
  renameBranch(oldName: string, newName: string): Promise<void>;
}

export interface IGitDiffService {
  getFileDiff(path: string, staged?: boolean): Promise<FileDiff>;
  getCommitDiff(sha: string): Promise<FileDiff[]>;
}

export interface IGitRemoteService {
  getRemotes(): Promise<RemoteInfo[]>;
  addRemote(name: string, url: string): Promise<void>;
  removeRemote(name: string): Promise<void>;
  fetch(remote?: string): Promise<void>;
  fetchAll(): Promise<void>;
  pull(remote?: string, branch?: string): Promise<{ fastForward: boolean; conflicts: boolean }>;
  push(remote?: string, branch?: string, force?: boolean): Promise<void>;
}

export interface IGitTagService {
  getTags(): Promise<TagInfo[]>;
  createTag(name: string, sha: string, message?: string): Promise<TagInfo>;
  deleteTag(name: string): Promise<void>;
}

export interface IGitConfigService {
  getConfig(key: string): Promise<string | null>;
  setConfig(key: string, value: string): Promise<void>;
  getSshKeys(): Promise<string[]>;
}
