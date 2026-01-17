import { useState, useEffect } from 'react';
import { GitBranch, Download, Plus, Folder, Clock, Trash2, Github, Loader2, Lock, Globe, Star, RefreshCw, FolderOpen, Check } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repo';
import { useRepositoriesStore, RepositoryEntry } from '@/stores/repositories';
import { useGitHub, GitHubRepo } from '@/hooks/useGitHub';
import { CloneDialog } from './CloneDialog';
import { CreateDialog } from './CreateDialog';

export function WelcomeScreen() {
  const { setRepo, setLoading, setError } = useRepoStore();
  const { recentRepositories, removeRecentRepository, addRecentRepository } = useRepositoriesStore();
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [cloneUrl, setCloneUrl] = useState('');

  // GitHub integration
  const { isAuthenticated, user, login, getRepos, authLoading, apiLoading: _apiLoading } = useGitHub();
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoFilter, setRepoFilter] = useState<'all' | 'public' | 'private'>('all');

  // Fetch GitHub repos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchGitHubRepos();
    }
  }, [isAuthenticated]);

  const fetchGitHubRepos = async () => {
    setLoadingRepos(true);
    try {
      const repos = await getRepos(1, 100); // Get all repos
      setGithubRepos(repos);
    } catch (e) {
      console.error('Failed to fetch GitHub repos:', e);
    } finally {
      setLoadingRepos(false);
    }
  };

  // Filter repos based on selection
  const filteredGithubRepos = githubRepos.filter(repo => {
    if (repoFilter === 'all') return true;
    if (repoFilter === 'public') return !repo.private;
    if (repoFilter === 'private') return repo.private;
    return true;
  });

  const handleCloneGitHubRepo = (repo: GitHubRepo) => {
    setCloneUrl(repo.clone_url);
    setShowCloneDialog(true);
  };

  // Check if a GitHub repo exists locally (by matching name in recent repos)
  const findLocalRepo = (repoName: string): RepositoryEntry | undefined => {
    return recentRepositories.find(
      (entry) => entry.name.toLowerCase() === repoName.toLowerCase()
    );
  };

  const handleOpenRepository = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Repository',
      });

      if (selected) {
        setLoading(true);
        const repoInfo = await invoke<{
          path: string;
          name: string;
          head_branch: string | null;
          head_sha: string | null;
          is_detached: boolean;
        }>('open_repository', { path: selected });

        const repo = {
          path: repoInfo.path,
          name: repoInfo.name,
          currentBranch: repoInfo.head_branch || 'main',
          headSha: repoInfo.head_sha || undefined,
          isDetached: repoInfo.is_detached,
        };

        setRepo(repo);
        addRecentRepository({
          path: repo.path,
          name: repo.name,
          lastOpened: Date.now(),
          currentBranch: repo.currentBranch,
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecent = async (entry: RepositoryEntry) => {
    try {
      setLoading(true);
      const repoInfo = await invoke<{
        path: string;
        name: string;
        head_branch: string | null;
        head_sha: string | null;
        is_detached: boolean;
      }>('open_repository', { path: entry.path });

      const repo = {
        path: repoInfo.path,
        name: repoInfo.name,
        currentBranch: repoInfo.head_branch || 'main',
        headSha: repoInfo.head_sha || undefined,
        isDetached: repoInfo.is_detached,
      };

      setRepo(repo);
      addRecentRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });
    } catch (e) {
      setError(String(e));
      // If repo doesn't exist anymore, offer to remove it
      removeRecentRepository(entry.path);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const truncatePath = (path: string, maxLength: number = 40) => {
    if (path.length <= maxLength) return path;
    const parts = path.split('/');
    let result = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0 && result.length < maxLength - 3; i--) {
      result = parts[i] + '/' + result;
    }
    return '.../' + result;
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-void p-8">
      <div className="max-w-2xl w-full">
        {/* Logo and Title */}
        <div className="glass-card p-8 text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent-primary/20 mb-6">
            <GitBranch size={40} className="text-accent-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">LinuxGit</h1>
          <p className="text-text-muted">Modern Git for Linux</p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setShowCloneDialog(true)}
            className={cn(
              'glass-card flex flex-col items-center gap-3 p-6',
              'transition-all duration-200 hover:border-accent-primary/30',
              'group'
            )}
          >
            <div className="p-3 rounded-lg bg-accent-primary/20 group-hover:bg-accent-primary/30 transition-colors">
              <Download size={24} className="text-accent-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Clone</p>
              <p className="text-xs text-text-muted">From URL</p>
            </div>
          </button>

          <button
            onClick={() => setShowCreateDialog(true)}
            className={cn(
              'glass-card flex flex-col items-center gap-3 p-6',
              'transition-all duration-200 hover:border-accent-secondary/30',
              'group'
            )}
          >
            <div className="p-3 rounded-lg bg-accent-secondary/20 group-hover:bg-accent-secondary/30 transition-colors">
              <Plus size={24} className="text-accent-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Create</p>
              <p className="text-xs text-text-muted">New Repo</p>
            </div>
          </button>

          <button
            onClick={handleOpenRepository}
            className={cn(
              'glass-card flex flex-col items-center gap-3 p-6',
              'transition-all duration-200 hover:border-branch-1/30',
              'group'
            )}
          >
            <div className="p-3 rounded-lg bg-branch-1/20 group-hover:bg-branch-1/30 transition-colors">
              <Folder size={24} className="text-branch-1" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Open</p>
              <p className="text-xs text-text-muted">Existing</p>
            </div>
          </button>
        </div>

        {/* GitHub Repositories */}
        <div className="mb-6">
          <div className="glass-card p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github size={16} className="text-accent-primary" />
                <h2 className="text-sm font-medium text-text-primary">GitHub</h2>
                {isAuthenticated && githubRepos.length > 0 && (
                  <span className="text-xs text-text-ghost">({filteredGithubRepos.length})</span>
                )}
              </div>
            {isAuthenticated && (
              <div className="flex items-center gap-2">
                {/* Filter buttons */}
                <div className="flex items-center rounded-lg bg-elevated p-0.5">
                  <button
                    onClick={() => setRepoFilter('all')}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      repoFilter === 'all'
                        ? 'bg-surface text-text-primary'
                        : 'text-text-muted hover:text-text-secondary'
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setRepoFilter('public')}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      repoFilter === 'public'
                        ? 'bg-surface text-text-primary'
                        : 'text-text-muted hover:text-text-secondary'
                    )}
                  >
                    Public
                  </button>
                  <button
                    onClick={() => setRepoFilter('private')}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      repoFilter === 'private'
                        ? 'bg-surface text-text-primary'
                        : 'text-text-muted hover:text-text-secondary'
                    )}
                  >
                    Private
                  </button>
                </div>
                <button
                  onClick={fetchGitHubRepos}
                  disabled={loadingRepos}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
                  title="Refresh"
                >
                  <RefreshCw size={14} className={loadingRepos ? 'animate-spin' : ''} />
                </button>
              </div>
            )}
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="glass-card p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#24292e] flex items-center justify-center">
                <Github size={24} className="text-white" />
              </div>
              <p className="text-sm text-text-muted mb-4">Sign in to see your GitHub repositories</p>
              <button
                onClick={() => login()}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#24292e] hover:bg-[#2f363d] text-white text-sm font-medium transition-colors"
              >
                {authLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Github size={16} />
                )}
                Sign in with GitHub
              </button>
            </div>
          ) : loadingRepos ? (
            <div className="glass-card p-8 text-center">
              <Loader2 size={24} className="animate-spin text-accent-primary mx-auto mb-3" />
              <p className="text-sm text-text-muted">Loading your repositories...</p>
            </div>
          ) : filteredGithubRepos.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <div className="divide-y divide-white/5 max-h-[280px] overflow-y-auto">
                {filteredGithubRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="flex items-center gap-4 p-4 hover:bg-elevated transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-elevated">
                      {repo.private ? (
                        <Lock size={18} className="text-status-warning" />
                      ) : (
                        <Globe size={18} className="text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary truncate">{repo.name}</p>
                        {repo.private && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-status-warning/10 text-status-warning">
                            Private
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-text-muted truncate">{repo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {repo.stargazers_count > 0 && (
                        <div className="flex items-center gap-1 text-text-ghost">
                          <Star size={12} />
                          <span className="text-xs">{repo.stargazers_count}</span>
                        </div>
                      )}
                      {(() => {
                        const localRepo = findLocalRepo(repo.name);
                        if (localRepo) {
                          return (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs text-status-added">
                                <Check size={12} />
                                Local
                              </span>
                              <button
                                onClick={() => handleOpenRecent(localRepo)}
                                className={cn(
                                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                                  'bg-status-added/10 hover:bg-status-added/20',
                                  'text-status-added text-xs font-medium',
                                  'transition-colors'
                                )}
                              >
                                <FolderOpen size={12} />
                                Open
                              </button>
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={() => handleCloneGitHubRepo(repo)}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
                              'bg-accent-primary/10 hover:bg-accent-primary/20',
                              'text-accent-primary text-xs font-medium',
                              'opacity-0 group-hover:opacity-100 transition-opacity'
                            )}
                          >
                            <Download size={12} />
                            Clone
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              {user && (
                <div className="px-4 py-3 bg-elevated/50 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {user.avatar_url && (
                      <img src={user.avatar_url} alt={user.login} className="w-5 h-5 rounded-full" />
                    )}
                    <span className="text-xs text-text-muted">Signed in as @{user.login}</span>
                  </div>
                  <span className="text-xs text-text-ghost">{user.public_repos} repos</span>
                </div>
              )}
            </div>
          ) : githubRepos.length > 0 ? (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-text-muted">No {repoFilter} repositories found</p>
            </div>
          ) : (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-text-muted">No repositories found</p>
            </div>
          )}
        </div>

        {/* Recent Repositories */}
        {recentRepositories.length > 0 && (
          <div>
            <div className="glass-card p-4 mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-accent-primary" />
                <h2 className="text-sm font-medium text-text-primary">Recent Repositories</h2>
              </div>
            </div>
            <div className="glass-card overflow-hidden divide-y divide-white/5">
              {recentRepositories.map((entry) => (
                <div
                  key={entry.path}
                  className="flex items-center gap-4 p-4 hover:bg-elevated transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-elevated">
                    <Folder size={20} className="text-text-muted" />
                  </div>
                  <button
                    onClick={() => handleOpenRecent(entry)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-text-primary">{entry.name}</p>
                    <p className="text-xs text-text-muted">{truncatePath(entry.path)}</p>
                  </button>
                  <div className="flex items-center gap-3">
                    {entry.currentBranch && (
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-elevated">
                        <GitBranch size={12} className="text-branch-1" />
                        <span className="text-xs text-text-secondary">{entry.currentBranch}</span>
                      </div>
                    )}
                    <span className="text-xs text-text-ghost">{formatDate(entry.lastOpened)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecentRepository(entry.path);
                      }}
                      className="p-1.5 rounded hover:bg-status-deleted/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove from recent"
                    >
                      <Trash2 size={14} className="text-status-deleted" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showCloneDialog && (
        <CloneDialog
          onClose={() => {
            setShowCloneDialog(false);
            setCloneUrl('');
          }}
          initialUrl={cloneUrl}
        />
      )}
      {showCreateDialog && (
        <CreateDialog onClose={() => setShowCreateDialog(false)} />
      )}
    </div>
  );
}
