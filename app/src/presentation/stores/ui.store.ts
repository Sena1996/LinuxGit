import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Theme, ViewType } from '@/domain/entities';

interface UIState {
  theme: Theme;
  currentView: ViewType;
  sidebarExpanded: boolean;
  commandPaletteOpen: boolean;

  setTheme: (theme: Theme) => void;
  setView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      currentView: 'changes',
      sidebarExpanded: true,
      commandPaletteOpen: false,

      setTheme: (theme) => set({ theme }),
      setView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
    }),
    {
      name: 'linuxgit-ui',
      version: 1,
      partialize: (state) => ({
        theme: state.theme,
        sidebarExpanded: state.sidebarExpanded,
      }),
    }
  )
);
