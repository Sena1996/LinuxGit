import { motion } from 'framer-motion';
import {
  GitBranch,
  History,
  FileCode,
  Settings,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
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
];

export function Sidebar() {
  const { currentView, setView, sidebarCollapsed, toggleSidebar } = useUIStore();
  const { repo } = useRepoStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 60 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full flex flex-col bg-surface border-r border-white/5"
    >
      {/* Repository Info */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
            <FolderGit2 size={18} className="text-accent-primary" />
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden"
            >
              <p className="text-sm font-medium text-text-primary truncate">
                {repo?.name || 'No Repository'}
              </p>
              <p className="text-xs text-text-muted truncate">
                {repo?.currentBranch || 'Open a repository'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'hover:bg-hover',
              currentView === item.id
                ? 'bg-accent-primary/15 text-accent-primary'
                : 'text-text-secondary hover:text-text-primary'
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

      {/* Settings & Collapse */}
      <div className="p-2 border-t border-white/5 space-y-1">
        <button
          onClick={() => setView('settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
            'hover:bg-hover',
            currentView === 'settings'
              ? 'bg-accent-primary/15 text-accent-primary'
              : 'text-text-secondary hover:text-text-primary'
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

        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-hover transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs"
            >
              Collapse
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
