import { motion } from 'framer-motion';
import {
  GitBranch,
  History,
  FileCode,
  Settings,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, View } from '@/stores/ui';
import { useRepoStore } from '@/stores/repo';

interface NavItem {
  id: View;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'changes', label: 'Changes', icon: <FileCode size={20} /> },
  { id: 'history', label: 'History', icon: <History size={20} /> },
  { id: 'branches', label: 'Branches', icon: <GitBranch size={20} /> },
  { id: 'github', label: 'GitHub', icon: <Github size={20} /> },
];

export function Sidebar() {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useUIStore();
  const { repo } = useRepoStore();

  return (
    <div className="h-full p-3 pr-0 relative group/sidebar">
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 60 : 240 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'h-full flex flex-col overflow-hidden',
          'bg-elevated',
          'border border-white/[0.1]',
          'rounded-xl',
          'shadow-lg'
        )}
      >
        {/* Repository Info */}
        <div className="p-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-primary/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-primary/10">
              <FolderGit2 size={20} className="text-accent-primary" />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="overflow-hidden flex-1"
              >
                <p className="text-sm font-semibold text-text-primary truncate">
                  {repo?.name || 'No Repository'}
                </p>
                <p className="text-xs text-text-muted truncate flex items-center gap-1">
                  <GitBranch size={10} />
                  {repo?.currentBranch || 'Open a repository'}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                currentView === item.id
                  ? 'bg-accent-primary/20 text-accent-primary shadow-lg shadow-accent-primary/10 border border-accent-primary/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="p-2 border-t border-white/5">
          <button
            onClick={() => setView('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
              currentView === 'settings'
                ? 'bg-accent-primary/20 text-accent-primary shadow-lg shadow-accent-primary/10 border border-accent-primary/20'
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
            )}
          >
            <Settings size={20} />
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm font-medium"
              >
                Settings
              </motion.span>
            )}
          </button>
        </div>

        {/* Floating Collapse Button - attached to sidebar edge */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 -right-1 z-20',
            'w-6 h-12 rounded-l-lg',
            'flex items-center justify-center',
            'bg-surface hover:bg-hover',
            'border border-r-0 border-white/[0.15]',
            'text-text-secondary hover:text-accent-primary',
            'transition-colors duration-200',
            'shadow-md hover:shadow-lg',
            'opacity-0 group-hover/sidebar:opacity-100'
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </motion.aside>
    </div>
  );
}
