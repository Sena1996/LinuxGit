import { useState, useEffect } from 'react';
import { X, Folder, Plus, Loader2, AlertCircle, Check } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir } from '@tauri-apps/api/path';
import { cn } from '@/lib/utils';
import { useRepoStore } from '@/stores/repo';
import { useRepositoriesStore } from '@/stores/repositories';

interface CreateDialogProps {
  onClose: () => void;
}

const GITIGNORE_TEMPLATES = [
  { id: 'none', name: 'None' },
  { id: 'node', name: 'Node' },
  { id: 'python', name: 'Python' },
  { id: 'rust', name: 'Rust' },
  { id: 'go', name: 'Go' },
  { id: 'java', name: 'Java' },
];

export function CreateDialog({ onClose }: CreateDialogProps) {
  const { setRepo, setLoading: _setLoading } = useRepoStore();
  const { addRecentRepository } = useRepositoriesStore();

  const [repoName, setRepoName] = useState('');
  const [basePath, setBasePath] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addReadme, setAddReadme] = useState(true);
  const [addGitignore, setAddGitignore] = useState(false);
  const [gitignoreTemplate, setGitignoreTemplate] = useState('node');

  // Set default path on mount
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
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select Location',
      });
      if (selected) {
        setBasePath(selected as string);
      }
    } catch (e) {
      console.error('Failed to open directory picker:', e);
    }
  };

  const handleCreate = async () => {
    if (!repoName || !basePath) return;

    setCreating(true);
    setError(null);

    try {
      // Initialize the repository
      const repoInfo = await invoke<{
        path: string;
        name: string;
        head_branch: string | null;
        head_sha: string | null;
        is_detached: boolean;
      }>('init_repository', { path: fullPath });

      // Create README.md if selected
      if (addReadme) {
        // Note: Would need a write_file command, for now just init the repo
        // This could be enhanced later
      }

      // Create .gitignore if selected
      if (addGitignore && gitignoreTemplate !== 'none') {
        // Note: Would need a write_file command with template
        // This could be enhanced later
      }

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

      // Open the created repository
      setRepo(repo);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setCreating(false);
    }
  };

  const isValidName = (name: string): boolean => {
    // Basic validation: no special characters except - and _
    return /^[a-zA-Z0-9_-]+$/.test(name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 ">
      <div className="w-full max-w-lg bg-surface rounded-xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-secondary/10">
              <Plus size={18} className="text-accent-secondary" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Create New Repository</h2>
          </div>
          <button
            onClick={onClose}
            disabled={creating}
            className="p-1.5 rounded-lg hover:bg-elevated text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Repository Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Repository Name</label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-new-project"
              disabled={creating}
              className={cn(
                'w-full px-4 py-3 rounded-lg',
                'bg-elevated border border-white/5',
                'text-text-primary placeholder:text-text-ghost',
                'focus:outline-none focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/30',
                'transition-colors duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            />
            {repoName && !isValidName(repoName) && (
              <p className="text-xs text-status-warning flex items-center gap-1">
                <AlertCircle size={12} />
                Use only letters, numbers, hyphens, and underscores
              </p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Location</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={basePath}
                onChange={(e) => setBasePath(e.target.value)}
                disabled={creating}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg',
                  'bg-elevated border border-white/5',
                  'text-text-primary placeholder:text-text-ghost',
                  'focus:outline-none focus:border-accent-secondary/50 focus:ring-1 focus:ring-accent-secondary/30',
                  'transition-colors duration-200',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              <button
                onClick={handleBrowse}
                disabled={creating}
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
            {fullPath && (
              <p className="text-xs text-text-muted">
                Will be created at: <span className="text-text-secondary">{fullPath}</span>
              </p>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-text-secondary">Options</label>

            {/* Initialize with README */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  'w-5 h-5 rounded flex items-center justify-center border transition-colors',
                  addReadme
                    ? 'bg-accent-secondary border-accent-secondary'
                    : 'bg-elevated border-white/10 group-hover:border-white/20'
                )}
              >
                {addReadme && <Check size={14} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={addReadme}
                onChange={(e) => setAddReadme(e.target.checked)}
                className="sr-only"
                disabled={creating}
              />
              <span className="text-sm text-text-secondary">Initialize with README</span>
            </label>

            {/* Add .gitignore */}
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div
                  className={cn(
                    'w-5 h-5 rounded flex items-center justify-center border transition-colors',
                    addGitignore
                      ? 'bg-accent-secondary border-accent-secondary'
                      : 'bg-elevated border-white/10 group-hover:border-white/20'
                  )}
                >
                  {addGitignore && <Check size={14} className="text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={addGitignore}
                  onChange={(e) => setAddGitignore(e.target.checked)}
                  className="sr-only"
                  disabled={creating}
                />
                <span className="text-sm text-text-secondary">Add .gitignore</span>
              </label>

              {addGitignore && (
                <select
                  value={gitignoreTemplate}
                  onChange={(e) => setGitignoreTemplate(e.target.value)}
                  disabled={creating}
                  className={cn(
                    'ml-8 px-3 py-2 rounded-lg',
                    'bg-elevated border border-white/5',
                    'text-text-primary text-sm',
                    'focus:outline-none focus:border-accent-secondary/50',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {GITIGNORE_TEMPLATES.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

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
            disabled={creating}
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
            onClick={handleCreate}
            disabled={!repoName || !basePath || !isValidName(repoName) || creating}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-accent-secondary hover:bg-accent-secondary/90',
              'text-white text-sm font-medium',
              'transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {creating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Create
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
