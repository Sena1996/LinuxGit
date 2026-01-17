import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  RefreshCw,
  Search,
  Sparkles,
  Loader2,
  ChevronDown,
  Folder,
  Download,
  Plus,
  FolderOpen,
  Settings,
  Github,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { cn, getModKey } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useRepoStore } from '@/stores/repo';
import { useRepositoriesStore } from '@/stores/repositories';
import { RepositoryManager } from '@/components/repository';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel, Badge } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';

export function Header() {
  const { openCommandPalette, currentView, setView } = useUIStore();
  const { repo, setRepo, setLoading, setError } = useRepoStore();
  const { recentRepositories, addRecentRepository } = useRepositoriesStore();
  const { counts, needsPull, needsPush } = useNotifications();
  const [pulling, setPulling] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [showRepoManager, setShowRepoManager] = useState(false);

  const handleOpenRecent = async (path: string) => {
    try {
      setLoading(true);
      setRepoDropdownOpen(false);
      const repoInfo = await invoke<{
        path: string;
        name: string;
        head_branch: string | null;
        head_sha: string | null;
        is_detached: boolean;
      }>('open_repository', { path });

      const newRepo = {
        path: repoInfo.path,
        name: repoInfo.name,
        currentBranch: repoInfo.head_branch || 'main',
        headSha: repoInfo.head_sha || undefined,
        isDetached: repoInfo.is_detached,
      };

      setRepo(newRepo);
      addRecentRepository({
        path: newRepo.path,
        name: newRepo.name,
        lastOpened: Date.now(),
        currentBranch: newRepo.currentBranch,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocal = async () => {
    try {
      setRepoDropdownOpen(false);
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

        const newRepo = {
          path: repoInfo.path,
          name: repoInfo.name,
          currentBranch: repoInfo.head_branch || 'main',
          headSha: repoInfo.head_sha || undefined,
          isDetached: repoInfo.is_detached,
        };

        setRepo(newRepo);
        addRecentRepository({
          path: newRepo.path,
          name: newRepo.name,
          lastOpened: Date.now(),
          currentBranch: newRepo.currentBranch,
        });
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const truncatePath = (path: string, maxLength: number = 30) => {
    if (path.length <= maxLength) return path;
    return '...' + path.slice(-maxLength + 3);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handlePull = async () => {
    if (!repo) return;
    setPulling(true);
    try {
      const result = await invoke<{ fast_forward: boolean; conflicts: boolean }>('pull_remote');
      if (result.conflicts) {
        showNotification('Pull completed with conflicts', 'error');
      } else if (result.fast_forward) {
        showNotification('Fast-forward pull successful', 'success');
      } else {
        showNotification('Already up to date', 'success');
      }
    } catch (e) {
      showNotification(`Pull failed: ${e}`, 'error');
    } finally {
      setPulling(false);
    }
  };

  const handlePush = async () => {
    if (!repo) return;
    setPushing(true);
    try {
      await invoke('push_remote');
      showNotification('Push successful', 'success');
    } catch (e) {
      showNotification(`Push failed: ${e}`, 'error');
    } finally {
      setPushing(false);
    }
  };

  const handleFetch = async () => {
    if (!repo) return;
    setFetching(true);
    try {
      await invoke('fetch_all_remotes');
      showNotification('Fetch complete', 'success');
    } catch (e) {
      showNotification(`Fetch failed: ${e}`, 'error');
    } finally {
      setFetching(false);
    }
  };

  return (
    <header className="px-3 pt-3 bg-void">
      <div className={cn(
        'h-12 flex items-center justify-between px-4 rounded-xl',
        'bg-elevated',
        'border border-white/[0.1]',
        'shadow-md'
      )}>
      {/* Left: Repository Selector + Actions */}
      <div className="flex items-center gap-3">
        {/* Repository Dropdown */}
        <Dropdown
          open={repoDropdownOpen}
          onOpenChange={setRepoDropdownOpen}
          menuClassName="w-72"
          trigger={
            <button
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                'bg-elevated hover:bg-hover border border-white/5',
                'text-text-primary text-sm font-medium',
                'transition-colors duration-200'
              )}
            >
              <Folder size={16} className="text-accent-primary" />
              <span className="max-w-[150px] truncate">{repo?.name || 'No Repository'}</span>
              <ChevronDown size={14} className={cn('text-text-muted transition-transform', repoDropdownOpen && 'rotate-180')} />
            </button>
          }
        >
          {/* Current Repo */}
          {repo && (
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Folder size={16} className="text-accent-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{repo.name}</p>
                  <p className="text-xs text-text-muted truncate">{truncatePath(repo.path)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Repos */}
          {recentRepositories.filter(r => r.path !== repo?.path).length > 0 && (
            <div className="py-1 border-b border-white/5">
              <DropdownLabel>Recent</DropdownLabel>
              {recentRepositories.filter(r => r.path !== repo?.path).slice(0, 5).map((entry) => (
                <DropdownItem
                  key={entry.path}
                  onClick={() => handleOpenRecent(entry.path)}
                  icon={<Folder size={14} />}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{entry.name}</p>
                    <p className="text-xs text-text-ghost truncate">{truncatePath(entry.path)}</p>
                  </div>
                </DropdownItem>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="py-1">
            <DropdownItem
              onClick={() => { setRepoDropdownOpen(false); setShowRepoManager(true); }}
              icon={<Download size={14} className="text-accent-primary" />}
            >
              Clone Repository
            </DropdownItem>
            <DropdownItem
              onClick={() => { setRepoDropdownOpen(false); setShowRepoManager(true); }}
              icon={<Plus size={14} className="text-accent-secondary" />}
            >
              Create Repository
            </DropdownItem>
            <DropdownItem
              onClick={handleAddLocal}
              icon={<FolderOpen size={14} className="text-branch-1" />}
            >
              Add Local Repository
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              onClick={() => { setRepoDropdownOpen(false); setShowRepoManager(true); }}
              icon={<Settings size={14} />}
            >
              Manage Repositories...
            </DropdownItem>
          </div>
        </Dropdown>

        {/* Divider */}
        <div className="w-px h-6 bg-white/5" />

        {/* Git Actions */}
        <div className="relative">
          <button
            onClick={handlePull}
            disabled={!repo || pulling}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'text-sm font-medium transition-colors duration-200',
              repo
                ? needsPull
                  ? 'bg-status-modified/20 hover:bg-status-modified/30 text-status-modified'
                  : 'bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            )}
          >
            {pulling ? <Loader2 size={16} className="animate-spin" /> : <ArrowDown size={16} />}
            Pull
          </button>
          <Badge count={counts.pullAvailable} variant="warning" />
        </div>

        <div className="relative">
          <button
            onClick={handlePush}
            disabled={!repo || pushing}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'text-sm font-medium transition-colors duration-200',
              repo
                ? needsPush
                  ? 'bg-status-added/20 hover:bg-status-added/30 text-status-added'
                  : 'bg-elevated hover:bg-hover text-text-secondary hover:text-text-primary'
                : 'bg-elevated text-text-muted cursor-not-allowed'
            )}
          >
            {pushing ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
            Push
          </button>
          <Badge count={counts.pushAvailable} variant="success" />
        </div>

        <button
          onClick={handleFetch}
          disabled={!repo || fetching}
          className={cn(
            'p-2 rounded-lg transition-colors duration-200',
            repo
              ? 'bg-elevated hover:bg-hover text-text-secondary hover:text-text-primary'
              : 'bg-elevated text-text-muted cursor-not-allowed'
          )}
          title="Fetch all remotes"
        >
          {fetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {/* Center: Search / Command Palette */}
      <button
        onClick={openCommandPalette}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-lg min-w-[260px]',
          'bg-surface border border-white/[0.08]',
          'text-text-muted text-sm',
          'transition-all duration-200 hover:border-accent-primary/30 hover:bg-hover'
        )}
      >
        <Search size={14} className="text-accent-primary" />
        <span>Search or type a command...</span>
        <kbd className="ml-auto px-1.5 py-0.5 rounded bg-elevated text-xs text-text-ghost">
          {getModKey()}+K
        </kbd>
      </button>

      {/* Right: Branch, GitHub & AI Status */}
      <div className="flex items-center gap-3">
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-elevated hover:bg-hover',
            'text-text-secondary hover:text-text-primary text-sm',
            'transition-colors duration-200'
          )}
        >
          <GitBranch size={14} className="text-branch-1" />
          <span>{repo?.currentBranch || 'main'}</span>
        </button>

        {/* GitHub Button */}
        <div className="relative">
          <button
            onClick={() => setView('github')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'text-sm font-medium transition-colors duration-200',
              currentView === 'github'
                ? 'bg-accent-primary/20 text-accent-primary'
                : counts.gitHubTotal > 0
                  ? 'bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary'
                  : 'bg-elevated hover:bg-hover text-text-secondary hover:text-text-primary'
            )}
            title="GitHub Features"
          >
            <Github size={16} />
            <span className="hidden sm:inline">GitHub</span>
          </button>
          <Badge count={counts.gitHubTotal} variant="primary" />
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent-secondary/10">
          <Sparkles size={14} className="text-accent-secondary" />
          <span className="text-xs text-accent-secondary font-medium">AI Ready</span>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'fixed top-14 right-4 px-4 py-3 z-50 animate-in slide-in-from-top glass-card',
            notification.type === 'success'
              ? 'border-status-added/30 text-status-added'
              : 'border-status-deleted/30 text-status-deleted'
          )}
        >
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      {/* Repository Manager Modal */}
      {showRepoManager && (
        <RepositoryManager onClose={() => setShowRepoManager(false)} />
      )}
      </div>
    </header>
  );
}
