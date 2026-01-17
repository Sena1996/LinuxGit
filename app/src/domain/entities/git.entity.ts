export interface Author {
  name: string;
  email: string;
}

export interface CommitInfo {
  sha: string;
  shortSha: string;
  message: string;
  author: Author;
  timestamp: number;
  parents: string[];
}

export interface BranchInfo {
  name: string;
  isHead: boolean;
  isRemote: boolean;
  upstream?: string;
  aheadBehind?: {
    ahead: number;
    behind: number;
  };
  lastCommit?: CommitInfo;
}

export interface FileStatus {
  path: string;
  status: FileStatusType;
  staged: boolean;
}

export type FileStatusType =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'untracked'
  | 'ignored'
  | 'conflicted';

export interface StatusInfo {
  staged: FileStatus[];
  unstaged: FileStatus[];
  untracked: FileStatus[];
  conflicted: FileStatus[];
}

export interface DiffLine {
  content: string;
  lineType: 'context' | 'addition' | 'deletion' | 'header';
  oldLineNo?: number;
  newLineNo?: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
}

export interface FileDiff {
  path: string;
  hunks: DiffHunk[];
  oldPath?: string;
  binary: boolean;
  additions: number;
  deletions: number;
}

export interface RemoteInfo {
  name: string;
  url: string;
  fetchUrl?: string;
  pushUrl?: string;
}

export interface TagInfo {
  name: string;
  sha: string;
  message?: string;
  tagger?: Author;
  timestamp?: number;
}

export interface StashEntry {
  index: number;
  message: string;
  sha: string;
  timestamp: number;
}

export interface Repository {
  path: string;
  name: string;
  currentBranch: string;
  headSha?: string;
  isDetached: boolean;
  remotes: RemoteInfo[];
}

export interface RepositoryEntry {
  path: string;
  name: string;
  lastOpened: number;
  currentBranch?: string;
  remote?: string;
  syncStatus?: SyncStatus;
}

export interface SyncStatus {
  ahead: number;
  behind: number;
}
