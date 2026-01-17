import { useState, useEffect, useCallback } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  GitBranch,
  Key,
  Sparkles,
  Palette,
  Keyboard,
  Info,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  Globe,
  Plus,
  Trash2,
  Link,
  ExternalLink,
  Github,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, Theme } from '@/stores/ui';
import { useAIStore, AiProvider } from '@/stores/ai';
import { useRepoStore } from '@/stores/repo';
import { useGitHub } from '@/hooks/useGitHub';
import { invoke } from '@tauri-apps/api/core';

interface SettingSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingSection[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'git', label: 'Git Configuration', icon: <GitBranch size={18} /> },
  { id: 'remotes', label: 'Remotes', icon: <Globe size={18} /> },
  { id: 'ai', label: 'AI Settings', icon: <Sparkles size={18} /> },
  { id: 'auth', label: 'Authentication', icon: <Key size={18} /> },
  { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: <Keyboard size={18} /> },
  { id: 'about', label: 'About', icon: <Info size={18} /> },
];

function ThemeOption({
  theme,
  currentTheme,
  icon,
  label,
  onSelect,
}: {
  theme: Theme;
  currentTheme: Theme;
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
        currentTheme === theme
          ? 'bg-accent-primary/15 border-2 border-accent-primary'
          : 'bg-elevated border-2 border-transparent hover:border-white/10'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center',
          currentTheme === theme ? 'bg-accent-primary text-void' : 'bg-surface text-text-secondary'
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          'text-sm font-medium',
          currentTheme === theme ? 'text-accent-primary' : 'text-text-secondary'
        )}
      >
        {label}
      </span>
    </button>
  );
}

function AppearanceSettings() {
  const { theme, setTheme } = useUIStore();

  return (
    <div>
      <h3 className="text-lg font-medium text-text-primary mb-4">Theme</h3>
      <div className="grid grid-cols-3 gap-4">
        <ThemeOption
          theme="dark"
          currentTheme={theme}
          icon={<Moon size={24} />}
          label="Dark"
          onSelect={() => setTheme('dark')}
        />
        <ThemeOption
          theme="light"
          currentTheme={theme}
          icon={<Sun size={24} />}
          label="Light"
          onSelect={() => setTheme('light')}
        />
        <ThemeOption
          theme="system"
          currentTheme={theme}
          icon={<Monitor size={24} />}
          label="System"
          onSelect={() => setTheme('system')}
        />
      </div>
    </div>
  );
}

interface GitUserConfig {
  name: string | null;
  email: string | null;
}

function GitSettings() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await invoke<GitUserConfig>('get_git_config');
        setUserName(config.name || '');
        setUserEmail(config.email || '');
      } catch (e) {
        console.error('Failed to load git config:', e);
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await invoke('set_git_config', {
        name: userName || null,
        email: userEmail || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-text-primary">Git Configuration</h3>
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
          <span className="ml-3 text-text-muted">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-text-primary">Git Configuration</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            User Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your Name"
            className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
          />
          <p className="text-xs text-text-ghost mt-1">
            This name will appear in your commits
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            User Email
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
          />
          <p className="text-xs text-text-ghost mt-1">
            This email will be associated with your commits
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-status-deleted/10 text-status-deleted text-sm">
            <XCircle size={16} />
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'bg-accent-primary text-void hover:shadow-glow-sm'
            )}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : saved ? (
              <CheckCircle size={14} />
            ) : null}
            {saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Remote info type from backend
interface RemoteInfo {
  name: string;
  url: string;
  push_url: string | null;
}

function RemotesSettings() {
  const { repo } = useRepoStore();
  const [remotes, setRemotes] = useState<RemoteInfo[]>([]);
  const [loading, setLoading] = useState(!!repo);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRemoteName, setNewRemoteName] = useState('');
  const [newRemoteUrl, setNewRemoteUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadRemotes = useCallback(async () => {
    if (!repo) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<RemoteInfo[]>('get_remotes');
      setRemotes(data);
    } catch (e) {
      console.error('Failed to load remotes:', e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [repo]);

  useEffect(() => {
    loadRemotes();
  }, [loadRemotes]);

  const handleAddRemote = async () => {
    if (!newRemoteName.trim() || !newRemoteUrl.trim()) return;

    setAdding(true);
    try {
      await invoke('add_remote', { name: newRemoteName.trim(), url: newRemoteUrl.trim() });
      showNotification(`Remote '${newRemoteName}' added`, 'success');
      setNewRemoteName('');
      setNewRemoteUrl('');
      setShowAddForm(false);
      await loadRemotes();
    } catch (e) {
      showNotification(`Failed to add remote: ${e}`, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRemote = async (name: string) => {
    setDeleting(name);
    try {
      await invoke('remove_remote', { name });
      showNotification(`Remote '${name}' removed`, 'success');
      await loadRemotes();
    } catch (e) {
      showNotification(`Failed to remove remote: ${e}`, 'error');
    } finally {
      setDeleting(null);
    }
  };

  if (!repo) {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-text-primary">Remotes</h3>
        <div className="text-center py-12">
          <Globe size={48} className="mx-auto text-text-ghost mb-4" />
          <p className="text-text-muted">No repository open</p>
          <p className="text-sm text-text-ghost mt-1">Open a repository to manage remotes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-text-primary">Remotes</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            showAddForm
              ? 'bg-status-deleted/10 text-status-deleted hover:bg-status-deleted/20'
              : 'bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20'
          )}
        >
          {showAddForm ? (
            <>
              <XCircle size={16} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Remote
            </>
          )}
        </button>
      </div>

      {/* Add Remote Form */}
      {showAddForm && (
        <div className="glass-card p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Remote Name
            </label>
            <input
              type="text"
              value={newRemoteName}
              onChange={(e) => setNewRemoteName(e.target.value)}
              placeholder="origin"
              className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Remote URL
            </label>
            <input
              type="text"
              value={newRemoteUrl}
              onChange={(e) => setNewRemoteUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRemote();
                if (e.key === 'Escape') setShowAddForm(false);
              }}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddRemote}
              disabled={adding || !newRemoteName.trim() || !newRemoteUrl.trim()}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                newRemoteName.trim() && newRemoteUrl.trim()
                  ? 'bg-accent-primary text-void hover:shadow-glow-sm'
                  : 'bg-elevated text-text-muted cursor-not-allowed'
              )}
            >
              {adding && <Loader2 size={14} className="animate-spin" />}
              Add Remote
            </button>
          </div>
        </div>
      )}

      {/* Remote List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-accent-primary" />
          <span className="ml-3 text-text-muted">Loading remotes...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <XCircle size={48} className="mx-auto text-status-deleted mb-4" />
          <p className="text-text-primary font-medium">Failed to load remotes</p>
          <p className="text-sm text-text-muted mt-1">{error}</p>
          <button
            onClick={loadRemotes}
            className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-elevated hover:bg-hover text-text-secondary text-sm mx-auto transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : remotes.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <Link size={48} className="mx-auto text-text-ghost mb-4" />
          <p className="text-text-muted">No remotes configured</p>
          <p className="text-sm text-text-ghost mt-1">Add a remote to push and pull changes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {remotes.map((remote) => (
            <div
              key={remote.name}
              className="glass-card p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-accent-primary flex-shrink-0" />
                  <span className="font-medium text-text-primary">{remote.name}</span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-text-ghost flex-shrink-0">fetch:</span>
                    <code className="text-text-secondary truncate">{remote.url}</code>
                  </div>
                  {remote.push_url && remote.push_url !== remote.url && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-text-ghost flex-shrink-0">push:</span>
                      <code className="text-text-secondary truncate">{remote.push_url}</code>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {remote.url.includes('github.com') && (
                  <a
                    href={remote.url.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-hover text-text-muted hover:text-text-primary transition-colors"
                    title="Open in browser"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => handleRemoveRemote(remote.name)}
                  disabled={deleting === remote.name}
                  className="p-2 rounded-lg hover:bg-status-deleted/20 text-text-muted hover:text-status-deleted transition-colors"
                  title="Remove remote"
                >
                  {deleting === remote.name ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom',
            notification.type === 'success'
              ? 'bg-status-added/90 text-white'
              : 'bg-status-deleted/90 text-white'
          )}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}

function AISettings() {
  const {
    provider,
    ollamaModel,
    openaiModel,
    openaiApiKey,
    ollamaAvailable,
    ollamaModels,
    openaiKeyValid,
    loading,
    setProvider,
    setOllamaModel,
    setOpenaiModel,
    setOpenaiApiKey,
    checkOllamaStatus,
    validateOpenaiKey,
  } = useAIStore();

  const [localApiKey, setLocalApiKey] = useState(openaiApiKey || '');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Check Ollama status on mount
  useEffect(() => {
    checkOllamaStatus();
  }, [checkOllamaStatus]);

  // Sync local API key with store
  useEffect(() => {
    setLocalApiKey(openaiApiKey || '');
  }, [openaiApiKey]);

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    if (newProvider === 'ollama') {
      checkOllamaStatus();
    }
  };

  const handleApiKeyBlur = () => {
    if (localApiKey !== openaiApiKey) {
      setOpenaiApiKey(localApiKey);
    }
  };

  const handleValidateKey = async () => {
    if (localApiKey !== openaiApiKey) {
      setOpenaiApiKey(localApiKey);
    }
    await validateOpenaiKey();
  };

  const openaiModels = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-text-primary">AI Configuration</h3>

      {/* Provider Selection */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          AI Provider
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => handleProviderChange('ollama')}
            className={cn(
              'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
              provider === 'ollama'
                ? 'bg-accent-primary/15 border-accent-primary'
                : 'bg-elevated border-transparent hover:border-white/10'
            )}
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', provider === 'ollama' && 'text-accent-primary')}>
                  Ollama (Local)
                </span>
                {provider === 'ollama' && (
                  <span className="flex items-center gap-1">
                    {loading ? (
                      <Loader2 size={12} className="animate-spin text-text-muted" />
                    ) : ollamaAvailable ? (
                      <CheckCircle size={12} className="text-status-added" />
                    ) : (
                      <XCircle size={12} className="text-status-deleted" />
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                Run models locally, free, privacy-first
              </p>
            </div>
          </button>
          <button
            onClick={() => handleProviderChange('openai')}
            className={cn(
              'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
              provider === 'openai'
                ? 'bg-accent-primary/15 border-accent-primary'
                : 'bg-elevated border-transparent hover:border-white/10'
            )}
          >
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', provider === 'openai' && 'text-accent-primary')}>
                  OpenAI
                </span>
                {provider === 'openai' && openaiKeyValid !== null && (
                  <span className="flex items-center gap-1">
                    {openaiKeyValid ? (
                      <CheckCircle size={12} className="text-status-added" />
                    ) : (
                      <XCircle size={12} className="text-status-deleted" />
                    )}
                  </span>
                )}
              </div>
              <p className="text-xs text-text-muted mt-1">
                GPT-4, requires API key
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Ollama Settings */}
      {provider === 'ollama' && (
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-elevated">
            <div className="flex items-center gap-2">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-text-muted" />
              ) : ollamaAvailable ? (
                <>
                  <CheckCircle size={16} className="text-status-added" />
                  <span className="text-sm text-status-added">Ollama is running</span>
                </>
              ) : (
                <>
                  <XCircle size={16} className="text-status-deleted" />
                  <span className="text-sm text-status-deleted">Ollama not available</span>
                </>
              )}
            </div>
            <button
              onClick={checkOllamaStatus}
              disabled={loading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-hover text-text-secondary text-xs transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Model
            </label>
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                disabled={!ollamaAvailable || ollamaModels.length === 0}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-left transition-colors',
                  ollamaAvailable ? 'hover:border-accent-primary/50' : 'opacity-50 cursor-not-allowed'
                )}
              >
                <span className={ollamaModel ? 'text-text-primary' : 'text-text-muted'}>
                  {ollamaModel || 'Select a model'}
                </span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>

              {modelDropdownOpen && ollamaModels.length > 0 && (
                <div className="dropdown-inline top-full left-0 right-0 mt-1 p-1 max-h-48 overflow-y-auto">
                  {ollamaModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setOllamaModel(model);
                        setModelDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-hover transition-colors',
                        model === ollamaModel ? 'text-accent-primary bg-accent-primary/10' : 'text-text-primary'
                      )}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {!ollamaAvailable && (
              <p className="text-xs text-text-muted mt-1.5">
                Start Ollama with `ollama serve` to see available models
              </p>
            )}
          </div>
        </div>
      )}

      {/* OpenAI Settings */}
      {provider === 'openai' && (
        <div className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                onBlur={handleApiKeyBlur}
                placeholder="sk-..."
                className="flex-1 px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
              />
              <button
                onClick={handleValidateKey}
                disabled={loading || !localApiKey}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  localApiKey
                    ? 'bg-accent-primary/10 hover:bg-accent-primary/20 text-accent-primary'
                    : 'bg-elevated text-text-muted cursor-not-allowed'
                )}
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : 'Validate'}
              </button>
            </div>
            {openaiKeyValid !== null && (
              <p className={cn('text-xs mt-1.5', openaiKeyValid ? 'text-status-added' : 'text-status-deleted')}>
                {openaiKeyValid ? 'API key is valid' : 'Invalid API key'}
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Model
            </label>
            <div className="relative">
              <button
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-left hover:border-accent-primary/50 transition-colors"
              >
                <span className="text-text-primary">{openaiModel}</span>
                <ChevronDown size={16} className="text-text-muted" />
              </button>

              {modelDropdownOpen && (
                <div className="dropdown-inline top-full left-0 right-0 mt-1 p-1">
                  {openaiModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => {
                        setOpenaiModel(model);
                        setModelDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-sm text-left rounded-lg hover:bg-hover transition-colors',
                        model === openaiModel ? 'text-accent-primary bg-accent-primary/10' : 'text-text-primary'
                      )}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SSH Key info type from backend
interface SshKeyInfo {
  key_type: string;
  path: string;
  exists: boolean;
}

function AuthSettings() {
  const [sshKeys, setSshKeys] = useState<SshKeyInfo[]>([]);
  const [sshLoading, setSshLoading] = useState(true);

  // GitHub auth
  const {
    isAuthenticated,
    user,
    login,
    logout,
    authLoading,
    authError
  } = useGitHub();
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSshKeys() {
      try {
        const keys = await invoke<SshKeyInfo[]>('get_ssh_keys');
        setSshKeys(keys);
      } catch (e) {
        console.error('Failed to load SSH keys:', e);
      } finally {
        setSshLoading(false);
      }
    }
    loadSshKeys();
  }, []);

  const handleGitHubLogin = async () => {
    setLoginError(null);
    try {
      await login();
    } catch (e) {
      setLoginError(String(e));
    }
  };

  const handleGitHubLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout failed:', e);
    }
  };

  const existingKeys = sshKeys.filter(k => k.exists);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-text-primary">Authentication</h3>

      {/* GitHub Account */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">GitHub Account</h4>
        <p className="text-xs text-text-muted mb-4">
          Sign in with GitHub to access private repositories and use HTTPS authentication.
        </p>

        {isAuthenticated && user ? (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-12 h-12 rounded-full border-2 border-accent-primary/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                    <Github size={24} className="text-accent-primary" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-text-primary">{user.name || user.login}</p>
                    <CheckCircle size={14} className="text-status-added" />
                  </div>
                  <p className="text-sm text-text-muted">@{user.login}</p>
                  {user.email && (
                    <p className="text-xs text-text-ghost">{user.email}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleGitHubLogout}
                disabled={authLoading}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-status-deleted/10 hover:bg-status-deleted/20 text-status-deleted text-sm font-medium transition-colors"
              >
                {authLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <LogOut size={14} />
                )}
                Sign Out
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4 text-xs text-text-muted">
              <span>{user.public_repos} public repos</span>
              <span>{user.followers} followers</span>
              <span>{user.following} following</span>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#24292e] flex items-center justify-center">
                <Github size={32} className="text-white" />
              </div>
              <p className="text-text-secondary mb-4">
                Connect your GitHub account to LinuxGit
              </p>
              <button
                onClick={handleGitHubLogin}
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
              {(loginError || authError) && (
                <div className="mt-4 p-3 rounded-lg bg-status-deleted/10 text-status-deleted text-sm">
                  <XCircle size={14} className="inline mr-2" />
                  {loginError || authError}
                </div>
              )}
              <p className="text-xs text-text-ghost mt-4">
                This will open GitHub in your browser for authorization
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SSH Keys */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">SSH Keys</h4>
        <p className="text-xs text-text-muted mb-4">
          SSH keys are used to authenticate with remote repositories without entering your password.
        </p>

        {sshLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-accent-primary" />
            <span className="ml-2 text-text-muted text-sm">Checking SSH keys...</span>
          </div>
        ) : existingKeys.length === 0 ? (
          <div className="glass-card p-6 text-center">
            <Key size={32} className="mx-auto text-text-ghost mb-3" />
            <p className="text-text-muted">No SSH keys found</p>
            <p className="text-xs text-text-ghost mt-1">
              Generate an SSH key with: <code className="bg-surface px-1 rounded">ssh-keygen -t ed25519</code>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {existingKeys.map((key) => (
              <div
                key={key.path}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-status-added/10">
                    <Key size={18} className="text-status-added" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{key.key_type}</p>
                    <p className="text-xs text-text-muted font-mono">{key.path}</p>
                  </div>
                </div>
                <CheckCircle size={18} className="text-status-added" />
              </div>
            ))}
          </div>
        )}

        {/* All key types status */}
        {!sshLoading && existingKeys.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-elevated">
            <p className="text-xs text-text-muted mb-2">All key types:</p>
            <div className="flex flex-wrap gap-2">
              {sshKeys.map((key) => (
                <span
                  key={key.key_type}
                  className={cn(
                    'px-2 py-1 rounded text-xs',
                    key.exists
                      ? 'bg-status-added/10 text-status-added'
                      : 'bg-surface text-text-ghost'
                  )}
                >
                  {key.key_type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* GPG Keys (placeholder for future) */}
      <div>
        <h4 className="text-sm font-medium text-text-secondary mb-3">GPG Signing</h4>
        <div className="glass-card p-4">
          <p className="text-sm text-text-muted">
            GPG key signing for commits is not yet configured.
          </p>
          <p className="text-xs text-text-ghost mt-1">
            Coming soon: Sign your commits with GPG keys
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutSettings() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <img
          src="/icon.png"
          alt="LinuxGit"
          className="w-20 h-20 mx-auto mb-4 rounded-2xl"
        />
        <h2 className="text-2xl font-bold text-text-primary">LinuxGit</h2>
        <p className="text-sm text-text-muted mt-1">Version 0.1.0</p>
      </div>

      <div className="glass-card p-4 text-center">
        <p className="text-sm text-text-secondary">
          A modern, AI-enabled Git desktop application for Linux.
        </p>
        <p className="text-xs text-text-muted mt-2">
          Built with Tauri, React, and Rust
        </p>
        <p className="text-sm font-bold text-text-secondary mt-3">
          🦁 SENA1996
        </p>
      </div>

      <div className="text-center text-xs text-text-muted">
        <p>Made with ❤️ for the Linux community</p>
        <p className="mt-1">MIT License</p>
      </div>
    </div>
  );
}

export function SettingsView() {
  const [activeSection, setActiveSection] = useState('appearance');

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return <AppearanceSettings />;
      case 'git':
        return <GitSettings />;
      case 'remotes':
        return <RemotesSettings />;
      case 'ai':
        return <AISettings />;
      case 'auth':
        return <AuthSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return (
          <div className="text-center py-12 text-text-muted">
            <p>Coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Navigation */}
      <div className="w-60 border-r border-white/5 p-3">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider px-3 mb-3">
          Settings
        </h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                activeSection === section.id
                  ? 'bg-accent-primary/15 text-accent-primary'
                  : 'text-text-secondary hover:bg-hover hover:text-text-primary'
              )}
            >
              {section.icon}
              <span className="text-sm">{section.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {renderContent()}
      </div>
    </div>
  );
}
