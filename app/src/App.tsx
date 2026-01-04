import { useEffect } from 'react';
import { Sidebar, Header, StatusBar, CommandPalette } from '@/components/layout';
import { ChangesView, HistoryView, BranchesView, SettingsView } from '@/views';
import { useUIStore } from '@/stores/ui';

function App() {
  const { currentView, theme, commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('light', !prefersDark);
    } else {
      root.classList.toggle('light', theme === 'light');
    }
  }, [theme]);

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
      case 'settings':
        return <SettingsView />;
      default:
        return <ChangesView />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-void text-text-primary overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main View */}
        <main className="flex-1 overflow-hidden bg-deep">
          {renderView()}
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
