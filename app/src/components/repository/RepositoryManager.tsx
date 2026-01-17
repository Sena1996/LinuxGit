import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Download,
  Plus,
  FolderOpen,
  GitBranch,
  Trash2,
  Folder,
  Search,
  Loader2,
  AlertCircle,
  Check,
  Github,
  Lock,
  Globe,
  Star,
  GitFork,
  RefreshCw,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repo';
import { useRepositoriesStore, RepositoryEntry } from '@/stores/repositories';
import { useGitHub, GitHubRepo } from '@/hooks/useGitHub';

// Helper function to extract repo name from URL
function getRepoNameFromUrl(repoUrl: string): string {
  const match = repoUrl.match(/\/([^/]+?)(\.git)?$/);
  return match ? match[1] : 'repository';
}

// Clone content component (inline, not modal)
function CloneContent({ onSuccess, initialUrl = '', initialName = '' }: { onSuccess: () => void; initialUrl?: string; initialName?: string }) {
  const { setRepo } = useRepoStore();
  const { addRecentRepository } = useRepositoriesStore();

  const [url, setUrl] = useState(initialUrl);
  const [localPath, setLocalPath] = useState('');
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);

  useEffect(() => {
    async function setDefaultPath() {
      try {
        const home = await homeDir();
        const repoName = initialName || (initialUrl ? getRepoNameFromUrl(initialUrl) : '');
        setLocalPath(`${home}Projects${repoName ? '/' + repoName : ''}`);
      } catch {
        setLocalPath('~/Projects');
      }
    }
    setDefaultPath();
  }, [initialUrl, initialName]);

  // Update URL when initialUrl changes
  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (url) {
      const repoName = getRepoNameFromUrl(url);
      setLocalPath((prev) => {
        const basePath = prev.replace(/\/[^/]*$/, '');
        return `${basePath}/${repoName}`;
      });
    }
  }, [url]);

  const handleBrowse = async () => {
    const selected = await open({ directory: true, title: 'Select Clone Destination' });
    if (selected) {
      const repoName = url ? getRepoNameFromUrl(url) : 'repository';
      setLocalPath(`${selected}/${repoName}`);
    }
  };

  const isValidUrl = (repoUrl: string): boolean => {
    return repoUrl.startsWith('https://') || repoUrl.startsWith('git@') ||
           repoUrl.startsWith('ssh://') || repoUrl.startsWith('git://');
  };

  const handleClone = async () => {
    if (!url || !localPath) return;
    setCloning(true);
    setError(null);
    setProgress({ stage: 'Cloning repository...', percent: 50 });

    try {
      const repoInfo = await invoke<{
        path: string;
        name: string;
        head_branch: string | null;
        head_sha: string | null;
        is_detached: boolean;
      }>('clone_repository', { url, path: localPath });

      setProgress({ stage: 'Complete!', percent: 100 });

      const repo = {
        path: repoInfo.path,
        name: repoInfo.name,
        currentBranch: repoInfo.head_branch || 'main',
        headSha: repoInfo.head_sha || undefined,
        isDetached: repoInfo.is_detached,
      };

      addRecentRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });

      setRepo(repo);
      onSuccess();
    } catch (e) {
      setError(String(e));
      setProgress(null);
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Repository URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/user/repo.git"
          disabled={cloning}
          className={cn(
            'w-full px-4 py-3 rounded-lg bg-elevated border border-white/5',
            'text-text-primary placeholder:text-text-ghost',
            'focus:outline-none focus:border-accent-primary/50',
            'disabled:opacity-50'
          )}
        />
        {url && !isValidUrl(url) && (
          <p className="text-xs text-status-warning flex items-center gap-1">
            <AlertCircle size={12} /> Enter a valid Git URL
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Local Path</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
            disabled={cloning}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg bg-elevated border border-white/5',
              'text-text-primary focus:outline-none focus:border-accent-primary/50',
              'disabled:opacity-50'
            )}
          />
          <button
            onClick={handleBrowse}
            disabled={cloning}
            className="px-4 py-3 rounded-lg bg-elevated hover:bg-hover border border-white/5 text-text-secondary"
          >
            <Folder size={18} />
          </button>
        </div>
      </div>

      {progress && (
        <div className="space-y-2">
          <div className="h-2 rounded-full bg-elevated overflow-hidden">
            <div className="h-full bg-accent-primary transition-all" style={{ width: `${progress.percent}%` }} />
          </div>
          <p className="text-xs text-text-muted">{progress.stage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-status-deleted/10 border border-status-deleted/20">
          <p className="text-sm text-status-deleted flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </p>
        </div>
      )}

      <button
        onClick={handleClone}
        disabled={!url || !localPath || !isValidUrl(url) || cloning}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
          'bg-accent-primary hover:bg-accent-primary/90 text-white font-medium',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {cloning ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {cloning ? 'Cloning...' : 'Clone Repository'}
      </button>
    </div>
  );
}

// Create content component (inline, not modal)
function CreateContent({ onSuccess }: { onSuccess: () => void }) {
  const { setRepo } = useRepoStore();
  const { addRecentRepository } = useRepositoriesStore();

  const [repoName, setRepoName] = useState('');
  const [basePath, setBasePath] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addReadme, setAddReadme] = useState(true);

  useEffect(() => {
    async function setDefaultPath() {
      try {
        const home = await homeDir();
        setBasePath(`${home}Projects`);
      } catch {
        setBasePath('~/Projects');
      }
    }
    setDefaultPath();
  }, []);

  const fullPath = basePath && repoName ? `${basePath}/${repoName}` : '';

  const handleBrowse = async () => {
    const selected = await open({ directory: true, title: 'Select Location' });
    if (selected) setBasePath(selected as string);
  };

  const isValidName = (name: string): boolean => /^[a-zA-Z0-9_-]+$/.test(name);

  const handleCreate = async () => {
    if (!repoName || !basePath) return;
    setCreating(true);
    setError(null);

    try {
      const repoInfo = await invoke<{
        path: string;
        name: string;
        head_branch: string | null;
        head_sha: string | null;
        is_detached: boolean;
      }>('init_repository', { path: fullPath });

      const repo = {
        path: repoInfo.path,
        name: repoInfo.name,
        currentBranch: repoInfo.head_branch || 'main',
        headSha: repoInfo.head_sha || undefined,
        isDetached: repoInfo.is_detached,
      };

      addRecentRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });

      setRepo(repo);
      onSuccess();
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Repository Name</label>
        <input
          type="text"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          placeholder="my-new-project"
          disabled={creating}
          className={cn(
            'w-full px-4 py-3 rounded-lg bg-elevated border border-white/5',
            'text-text-primary placeholder:text-text-ghost',
            'focus:outline-none focus:border-accent-secondary/50',
            'disabled:opacity-50'
          )}
        />
        {repoName && !isValidName(repoName) && (
          <p className="text-xs text-status-warning flex items-center gap-1">
            <AlertCircle size={12} /> Use only letters, numbers, hyphens, and underscores
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-secondary">Location</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={basePath}
            onChange={(e) => setBasePath(e.target.value)}
            disabled={creating}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg bg-elevated border border-white/5',
              'text-text-primary focus:outline-none focus:border-accent-secondary/50',
              'disabled:opacity-50'
            )}
          />
          <button
            onClick={handleBrowse}
            disabled={creating}
            className="px-4 py-3 rounded-lg bg-elevated hover:bg-hover border border-white/5 text-text-secondary"
          >
            <Folder size={18} />
          </button>
        </div>
        {fullPath && (
          <p className="text-xs text-text-muted">
            Will be created at: <span className="text-text-secondary">{fullPath}</span>
          </p>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className={cn(
            'w-5 h-5 rounded flex items-center justify-center border transition-colors',
            addReadme ? 'bg-accent-secondary border-accent-secondary' : 'bg-elevated border-white/10'
          )}
        >
          {addReadme && <Check size={14} className="text-white" />}
        </div>
        <input
          type="checkbox"
          checked={addReadme}
          onChange={(e) => setAddReadme(e.target.checked)}
          className="sr-only"
        />
        <span className="text-sm text-text-secondary">Initialize with README</span>
      </label>

      {error && (
        <div className="p-4 rounded-lg bg-status-deleted/10 border border-status-deleted/20">
          <p className="text-sm text-status-deleted flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </p>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={!repoName || !basePath || !isValidName(repoName) || creating}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
          'bg-accent-secondary hover:bg-accent-secondary/90 text-white font-medium',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
        {creating ? 'Creating...' : 'Create Repository'}
      </button>
    </div>
  );
}

// GitHub repositories content component
function GitHubContent({ onClone }: { onClone: (url: string, name: string) => void }) {
  const { isAuthenticated, user, login, getRepos, authLoading, apiLoading } = useGitHub();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch repos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRepos();
    }
  }, [isAuthenticated]);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedRepos = await getRepos(1, 100);
      setRepos(fetchedRepos);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (repo.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8">
        <div className="glass-card p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#24292e] flex items-center justify-center">
            <Github size={40} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Sign in to GitHub</h3>
          <p className="text-sm text-text-muted mb-6 max-w-sm mx-auto">
            Connect your GitHub account to see your repositories and clone them directly.
          </p>
          <button
            onClick={() => login()}
            disabled={authLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#24292e] hover:bg-[#2f363d] text-white font-medium transition-colors"
          >
            {authLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Github size={18} />
            )}
            Sign in with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Header with user info */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.login} className="w-8 h-8 rounded-full" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#24292e] flex items-center justify-center">
                <Github size={16} className="text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-text-primary">{user?.name || user?.login}</p>
              <p className="text-xs text-text-muted">{repos.length} repositories</p>
            </div>
          </div>
          <button
            onClick={fetchRepos}
            disabled={loading || apiLoading}
            className="p-2 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
            title="Refresh repositories"
          >
            <RefreshCw size={16} className={loading || apiLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your repositories..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-elevated border border-white/5',
              'text-text-primary placeholder:text-text-ghost text-sm',
              'focus:outline-none focus:border-accent-primary/50'
            )}
          />
        </div>
      </div>

      {/* Repository List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading || apiLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-accent-primary" />
            <span className="ml-3 text-text-muted">Loading repositories...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-status-deleted mb-4" />
            <p className="text-text-primary mb-2">Failed to load repositories</p>
            <p className="text-sm text-text-muted mb-4">{error}</p>
            <button
              onClick={fetchRepos}
              className="px-4 py-2 rounded-lg bg-elevated hover:bg-hover text-text-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="p-8 text-center">
            <Folder size={48} className="mx-auto text-text-ghost mb-4" />
            <p className="text-text-muted">
              {searchQuery ? 'No repositories match your search' : 'No repositories found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredRepos.map((repo) => (
              <div
                key={repo.id}
                className="flex items-start gap-4 p-4 hover:bg-elevated transition-colors group"
              >
                <div className="p-2 rounded-lg bg-elevated flex-shrink-0">
                  {repo.private ? (
                    <Lock size={18} className="text-status-warning" />
                  ) : (
                    <Globe size={18} className="text-text-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-text-primary truncate">{repo.name}</p>
                    {repo.private && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-status-warning/10 text-status-warning">
                        Private
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-text-muted mb-2 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-text-ghost">
                    <span className="flex items-center gap-1">
                      <GitBranch size={12} />
                      {repo.default_branch}
                    </span>
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={12} />
                        {repo.stargazers_count}
                      </span>
                    )}
                    {repo.forks_count > 0 && (
                      <span className="flex items-center gap-1">
                        <GitFork size={12} />
                        {repo.forks_count}
                      </span>
                    )}
                    <span>Updated {formatDate(repo.updated_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onClone(repo.clone_url, repo.name)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                    'bg-accent-primary/10 hover:bg-accent-primary/20',
                    'text-accent-primary text-sm font-medium',
                    'opacity-0 group-hover:opacity-100 transition-opacity'
                  )}
                >
                  <Download size={14} />
                  Clone
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RepositoryManagerProps {
  onClose: () => void;
}

type Tab = 'recent' | 'github' | 'clone' | 'create' | 'add';

export function RepositoryManager({ onClose }: RepositoryManagerProps) {
  const { setRepo, setLoading, setError } = useRepoStore();
  const { recentRepositories, removeRecentRepository, addRecentRepository } = useRepositoriesStore();
  const [activeTab, setActiveTab] = useState<Tab>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<RepositoryEntry[]>([]);

  const handleOpenRepository = async (entry: RepositoryEntry) => {
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
      onClose();
    } catch (e) {
      setError(String(e));
      removeRecentRepository(entry.path);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocal = async () => {
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
        onClose();
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleScanForRepos = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Directory to Scan',
      });

      if (selected) {
        setScanning(true);
        const repos = await invoke<Array<{
          path: string;
          name: string;
          head_branch: string | null;
          head_sha: string | null;
          is_detached: boolean;
        }>>('scan_for_repos', { path: selected, maxDepth: 3 });

        setScanResults(repos.map(r => ({
          path: r.path,
          name: r.name,
          lastOpened: 0,
          currentBranch: r.head_branch || undefined,
        })));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setScanning(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  const truncatePath = (path: string, maxLength: number = 45) => {
    if (path.length <= maxLength) return path;
    const parts = path.split('/');
    let result = parts[parts.length - 1];
    for (let i = parts.length - 2; i >= 0 && result.length < maxLength - 3; i--) {
      result = parts[i] + '/' + result;
    }
    return '.../' + result;
  };

  const filteredRepos = recentRepositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [cloneUrl, setCloneUrl] = useState('');
  const [cloneName, setCloneName] = useState('');

  // Handle clone from GitHub repos list
  const handleGitHubClone = (url: string, name: string) => {
    setCloneUrl(url);
    setCloneName(name);
    setActiveTab('clone');
  };

  const tabs = [
    { id: 'recent' as Tab, label: 'Recent', icon: Clock },
    { id: 'github' as Tab, label: 'GitHub', icon: Github },
    { id: 'clone' as Tab, label: 'Clone', icon: Download },
    { id: 'create' as Tab, label: 'Create', icon: Plus },
    { id: 'add' as Tab, label: 'Add Local', icon: FolderOpen },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/60 ">
      <div className="w-full max-w-2xl h-[80vh] modal-card overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-lg font-semibold text-text-primary">Repository Manager</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-white/5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                'border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-accent-primary border-accent-primary'
                  : 'text-text-muted hover:text-text-secondary border-transparent'
              )}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeTab === 'recent' && (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-white/5">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className={cn(
                      'w-full pl-10 pr-4 py-2 rounded-lg',
                      'bg-elevated border border-white/5',
                      'text-text-primary placeholder:text-text-ghost text-sm',
                      'focus:outline-none focus:border-accent-primary/50'
                    )}
                  />
                </div>
              </div>

              {/* Repository List */}
              <div className="flex-1 overflow-y-auto">
                {filteredRepos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="glass-card p-8">
                      <Folder size={48} className="text-text-ghost mb-4 mx-auto" />
                      <p className="text-text-muted mb-2">No recent repositories</p>
                      <p className="text-text-ghost text-sm">
                        Clone, create, or add a local repository to get started
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filteredRepos.map((entry) => (
                      <div
                        key={entry.path}
                        className="flex items-center gap-4 p-4 hover:bg-elevated transition-colors group"
                      >
                        <div className="p-2 rounded-lg bg-elevated">
                          <Folder size={20} className="text-text-muted" />
                        </div>
                        <button
                          onClick={() => handleOpenRepository(entry)}
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
                          {entry.lastOpened > 0 && (
                            <span className="text-xs text-text-ghost">{formatDate(entry.lastOpened)}</span>
                          )}
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
                )}
              </div>
            </div>
          )}

          {activeTab === 'github' && (
            <div className="flex-1 min-h-0 overflow-hidden">
              <GitHubContent onClone={handleGitHubClone} />
            </div>
          )}

          {activeTab === 'clone' && (
            <CloneContent onSuccess={onClose} initialUrl={cloneUrl} initialName={cloneName} />
          )}

          {activeTab === 'create' && (
            <CreateContent onSuccess={onClose} />
          )}

          {activeTab === 'add' && (
            <div className="p-6 space-y-6">
              <div className="glass-card p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-branch-1/10 mb-4">
                  <FolderOpen size={32} className="text-branch-1" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Add Local Repository</h3>
                <p className="text-sm text-text-muted mb-6">
                  Select an existing Git repository from your computer
                </p>
                <button
                  onClick={handleAddLocal}
                  className={cn(
                    'inline-flex items-center gap-2 px-6 py-3 rounded-lg',
                    'bg-branch-1 hover:bg-branch-1/90',
                    'text-white font-medium',
                    'transition-colors duration-200'
                  )}
                >
                  <Folder size={18} />
                  Browse for Repository
                </button>
              </div>

              <div className="glass-card p-6">
                <h4 className="text-sm font-medium text-text-secondary mb-4">Or scan for repositories</h4>
                <button
                  onClick={handleScanForRepos}
                  disabled={scanning}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg',
                    'bg-elevated hover:bg-hover border border-white/5',
                    'text-text-secondary hover:text-text-primary text-sm',
                    'transition-colors duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {scanning ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Scan Directory for Repositories
                    </>
                  )}
                </button>

                {scanResults.length > 0 && (
                  <div className="mt-4 rounded-lg border border-white/5 divide-y divide-white/5">
                    {scanResults.map((entry) => (
                      <button
                        key={entry.path}
                        onClick={() => handleOpenRepository(entry)}
                        className="flex items-center gap-3 w-full p-3 hover:bg-elevated transition-colors text-left"
                      >
                        <Folder size={16} className="text-text-muted" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary truncate">{entry.name}</p>
                          <p className="text-xs text-text-muted truncate">{entry.path}</p>
                        </div>
                        {entry.currentBranch && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-elevated">
                            <GitBranch size={10} className="text-branch-1" />
                            <span className="text-xs text-text-secondary">{entry.currentBranch}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
