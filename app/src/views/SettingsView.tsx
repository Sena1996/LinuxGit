import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, Theme } from '@/stores/ui';

interface SettingSection {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sections: SettingSection[] = [
  { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  { id: 'git', label: 'Git Configuration', icon: <GitBranch size={18} /> },
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

function GitSettings() {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

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
        </div>
      </div>
    </div>
  );
}

function AISettings() {
  const [aiProvider, setAiProvider] = useState<'ollama' | 'openai'>('ollama');
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-text-primary">AI Configuration</h3>

      <div>
        <label className="block text-sm font-medium text-text-secondary mb-3">
          AI Provider
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => setAiProvider('ollama')}
            className={cn(
              'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
              aiProvider === 'ollama'
                ? 'bg-accent-primary/15 border-accent-primary'
                : 'bg-elevated border-transparent hover:border-white/10'
            )}
          >
            <div className="text-left">
              <span className={cn('text-sm font-medium', aiProvider === 'ollama' && 'text-accent-primary')}>
                Ollama (Local)
              </span>
              <p className="text-xs text-text-muted mt-1">
                Run models locally, free, privacy-first
              </p>
            </div>
          </button>
          <button
            onClick={() => setAiProvider('openai')}
            className={cn(
              'flex-1 p-4 rounded-xl border-2 transition-all duration-200',
              aiProvider === 'openai'
                ? 'bg-accent-primary/15 border-accent-primary'
                : 'bg-elevated border-transparent hover:border-white/10'
            )}
          >
            <div className="text-left">
              <span className={cn('text-sm font-medium', aiProvider === 'openai' && 'text-accent-primary')}>
                OpenAI
              </span>
              <p className="text-xs text-text-muted mt-1">
                GPT-4, requires API key
              </p>
            </div>
          </button>
        </div>
      </div>

      {aiProvider === 'openai' && (
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 bg-elevated rounded-lg border border-white/5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary/50"
          />
        </div>
      )}
    </div>
  );
}

function AboutSettings() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary flex items-center justify-center">
          <GitBranch size={40} className="text-white" />
        </div>
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
      case 'ai':
        return <AISettings />;
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
