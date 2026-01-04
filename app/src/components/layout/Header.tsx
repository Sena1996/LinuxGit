import {
  ArrowDown,
  ArrowUp,
  GitBranch,
  RefreshCw,
  Search,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui';
import { useRepoStore } from '@/stores/repo';

export function Header() {
  const { openCommandPalette } = useUIStore();
  const { repo } = useRepoStore();

  return (
    <header className="h-12 flex items-center justify-between px-4 bg-surface border-b border-white/5">
      {/* Left: Actions */}
      <div className="flex items-center gap-2">
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-accent-primary/10 hover:bg-accent-primary/20',
            'text-accent-primary text-sm font-medium',
            'transition-colors duration-200'
          )}
        >
          <ArrowDown size={16} />
          Pull
        </button>

        <button
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-elevated hover:bg-hover',
            'text-text-secondary hover:text-text-primary text-sm font-medium',
            'transition-colors duration-200'
          )}
        >
          <ArrowUp size={16} />
          Push
        </button>

        <button
          className={cn(
            'p-2 rounded-lg',
            'bg-elevated hover:bg-hover',
            'text-text-secondary hover:text-text-primary',
            'transition-colors duration-200'
          )}
          title="Fetch all remotes"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Center: Search / Command Palette */}
      <button
        onClick={openCommandPalette}
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-lg min-w-[280px]',
          'bg-elevated hover:bg-hover border border-white/5',
          'text-text-muted text-sm',
          'transition-colors duration-200'
        )}
      >
        <Search size={14} />
        <span>Search or type a command...</span>
        <kbd className="ml-auto px-1.5 py-0.5 rounded bg-surface text-xs text-text-ghost">
          ⌘K
        </kbd>
      </button>

      {/* Right: Branch & AI Status */}
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

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-accent-secondary/10">
          <Sparkles size={14} className="text-accent-secondary" />
          <span className="text-xs text-accent-secondary font-medium">AI Ready</span>
        </div>
      </div>
    </header>
  );
}
