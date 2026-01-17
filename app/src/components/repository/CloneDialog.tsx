import { useState, useEffect } from 'react';
import { X, Folder, Download, Loader2, AlertCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repo';
import { useRepositoriesStore } from '@/stores/repositories';

interface CloneDialogProps {
  onClose: () => void;
  initialUrl?: string;
}

export function CloneDialog({ onClose, initialUrl = '' }: CloneDialogProps) {
  const { setRepo, setLoading: _setLoading } = useRepoStore();
  const { addRecentRepository } = useRepositoriesStore();

  const [url, setUrl] = useState(initialUrl);
  const [localPath, setLocalPath] = useState('');
  const [cloning, setCloning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: string; percent: number } | null>(null);

  // Extract repo name from URL
  const getRepoNameFromUrl = (repoUrl: string): string => {
    const match = repoUrl.match(/\/([^/]+?)(\.git)?$/);
    return match ? match[1] : 'repository';
  };

  // Set default path on mount
  useEffect(() => {
    async function setDefaultPath() {
      try {
        const home = await homeDir();
        const repoName = initialUrl ? getRepoNameFromUrl(initialUrl) : '';
        setLocalPath(`${home}Projects${repoName ? '/' + repoName : ''}`);
      } catch {
        setLocalPath('~/Projects');
      }
    }
    setDefaultPath();
  }, [initialUrl]);

  // Update path when URL changes
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
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Clone Destination',
      });
      if (selected) {
        const repoName = url ? getRepoNameFromUrl(url) : 'repository';
        setLocalPath(`${selected}/${repoName}`);
      }
    } catch (e) {
      console.error('Failed to open directory picker:', e);
    }
  };

  const handleClone = async () => {
    if (!url || !localPath) return;

    setCloning(true);
    setError(null);
    setProgress({ stage: 'Initializing...', percent: 0 });

    try {
      // Simulate progress stages (actual progress would come from backend channel)
      const progressStages = [
        { stage: 'Connecting to remote...', percent: 10 },
        { stage: 'Receiving objects...', percent: 30 },
        { stage: 'Receiving objects...', percent: 60 },
        { stage: 'Resolving deltas...', percent: 80 },
        { stage: 'Checking out files...', percent: 95 },
      ];

      // Start progress simulation
      let stageIndex = 0;
      const progressInterval = setInterval(() => {
        if (stageIndex < progressStages.length) {
          setProgress(progressStages[stageIndex]);
          stageIndex++;
        }
      }, 800);

      const repoInfo = await invoke<{
        path: string;
        name: string;
        head_branch: string | null;
        head_sha: string | null;
        is_detached: boolean;
      }>('clone_repository', { url, path: localPath });

      clearInterval(progressInterval);
      setProgress({ stage: 'Complete!', percent: 100 });

      const repo = {
        path: repoInfo.path,
        name: repoInfo.name,
        currentBranch: repoInfo.head_branch || 'main',
        headSha: repoInfo.head_sha || undefined,
        isDetached: repoInfo.is_detached,
      };

      // Add to recent repositories
      addRecentRepository({
        path: repo.path,
        name: repo.name,
        lastOpened: Date.now(),
        currentBranch: repo.currentBranch,
      });

      // Open the cloned repository
      setRepo(repo);
      onClose();
    } catch (e) {
      setError(String(e));
      setProgress(null);
    } finally {
      setCloning(false);
    }
  };

  const isValidUrl = (repoUrl: string): boolean => {
    return (
      repoUrl.startsWith('https://') ||
      repoUrl.startsWith('git@') ||
      repoUrl.startsWith('ssh://') ||
      repoUrl.startsWith('git://')
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
      <div className="w-full max-w-lg bg-surface rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-primary/10">
              <Download size={18} className="text-accent-primary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Clone Repository</h2>
          </div>
          <button
            onClick={onClose}
            disabled={cloning}
            className="p-1.5 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Repository URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              disabled={cloning}
              className={cn(
                'w-full px-4 py-3 rounded-lg',
                'bg-elevated border border-white/5',
                'text-text-primary placeholder:text-text-ghost',
                'focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/30',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            {url && !isValidUrl(url) && (
              <p className="text-xs text-status-modified flex items-center gap-1">
                <AlertCircle size={12} />
                Enter a valid Git URL (https://, git@, ssh://, or git://)
              </p>
            )}
          </div>

          {/* Local Path Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Local Path</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                disabled={cloning}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg',
                  'bg-elevated border border-white/5',
                  'text-text-primary placeholder:text-text-ghost',
                  'focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/30',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              <button
                onClick={handleBrowse}
                disabled={cloning}
                className={cn(
                  'px-4 py-3 rounded-lg',
                  'bg-elevated hover:bg-hover border border-white/5',
                  'text-text-secondary hover:text-text-primary',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <Folder size={18} />
              </button>
            </div>
          </div>

          {/* Progress */}
          {progress && (
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-elevated overflow-hidden">
                <div
                  className="h-full bg-accent-primary transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-xs text-text-muted">{progress.stage}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-lg bg-status-deleted/10 border border-status-deleted/20">
              <p className="text-sm text-status-deleted flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5 bg-deep">
          <button
            onClick={onClose}
            disabled={cloning}
            className={cn(
              'px-4 py-2 rounded-lg',
              'bg-elevated hover:bg-hover',
              'text-text-secondary hover:text-text-primary text-sm font-medium',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleClone}
            disabled={!url || !localPath || !isValidUrl(url) || cloning}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-accent-primary hover:bg-accent-primary/90',
              'text-white text-sm font-medium',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cloning ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Cloning...
              </>
            ) : (
              <>
                <Download size={16} />
                Clone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
