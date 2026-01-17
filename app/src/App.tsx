import { useEffect } from 'react';
import { Sidebar, Header, StatusBar, CommandPalette } from '@/components/layout';
import { ChangesView, HistoryView, BranchesView, GitHubView, SettingsView } from '@/views';
import { WelcomeScreen } from '@/components/repository';
import { useUIStore } from '@/stores/ui';
import { useRepoStore } from '@/stores/repo';

function App() {
  const { currentView, theme, commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const { repo } = useRepoStore();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : theme === 'dark';

    root.classList.toggle('dark', isDark);
    root.classList.toggle('light', !isDark);

    // Listen for system theme changes when in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.toggle('dark', e.matches);
        root.classList.toggle('light', !e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Disable default browser context menu (Reload, Inspect, etc.)
  // Custom context menus use data-context-menu attribute to opt-in
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Check if target or parent has custom context menu handler
      const target = e.target as HTMLElement;
      const hasCustomMenu = target.closest('[data-context-menu]');

      // Always prevent default browser menu
      e.preventDefault();

      // If no custom menu handler, the event just gets blocked
      // Custom menus handle their own display via React state
      if (!hasCustomMenu) {
        e.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl+Shift+P or Cmd+Shift+P
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }

      // Escape to close command palette
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const renderView = () => {
    switch (currentView) {
      case 'changes':
        return <ChangesView />;
      case 'history':
        return <HistoryView />;
      case 'branches':
        return <BranchesView />;
      case 'github':
        return <GitHubView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ChangesView />;
    }
  };

  // Show welcome screen when no repository is open (unless in settings or github)
  if (!repo && currentView !== 'settings' && currentView !== 'github') {
    return (
      <div className="h-screen flex flex-col bg-void text-text-primary overflow-hidden">
        <Header />
        <WelcomeScreen />
        <StatusBar />
        <CommandPalette />
      </div>
    );
  }

  // Show settings or github without sidebar when no repo is open
  if (!repo && (currentView === 'settings' || currentView === 'github')) {
    return (
      <div className="h-screen flex flex-col bg-void text-text-primary overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden bg-deep">
          {currentView === 'settings' ? <SettingsView /> : <GitHubView />}
        </main>
        <StatusBar />
        <CommandPalette />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-void text-text-primary overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-void">
        {/* Sidebar */}
        <Sidebar />

        {/* Main View */}
        <main className="flex-1 overflow-hidden p-3 pl-2">
          <div className={[
            'h-full rounded-xl overflow-hidden',
            'bg-elevated',
            'border border-white/[0.1]',
            'shadow-lg'
          ].join(' ')}>
            {renderView()}
          </div>
        </main>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Command Palette Modal */}
      <CommandPalette />
    </div>
  );
}

export default App;
