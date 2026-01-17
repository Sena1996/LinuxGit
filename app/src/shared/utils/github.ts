export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+)(\.git)?/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = url.match(/https?:\/\/github\.com\/([^/]+)\/([^/.]+)(\.git)?/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return null;
}

export function isGitHubUrl(url: string): boolean {
  return url.includes('github.com');
}

export function buildGitHubRepoUrl(owner: string, repo: string): string {
  return `https://github.com/${owner}/${repo}`;
}

export function buildGitHubCloneUrl(owner: string, repo: string, useSsh = false): string {
  if (useSsh) {
    return `git@github.com:${owner}/${repo}.git`;
  }
  return `https://github.com/${owner}/${repo}.git`;
}

export function buildGitHubPrUrl(owner: string, repo: string, number: number): string {
  return `https://github.com/${owner}/${repo}/pull/${number}`;
}

export function buildGitHubIssueUrl(owner: string, repo: string, number: number): string {
  return `https://github.com/${owner}/${repo}/issues/${number}`;
}

export function buildGitHubActionsUrl(owner: string, repo: string, runId?: number): string {
  const base = `https://github.com/${owner}/${repo}/actions`;
  return runId ? `${base}/runs/${runId}` : base;
}
