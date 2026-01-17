export type Theme = 'dark' | 'light' | 'system';

export type ViewType =
  | 'changes'
  | 'history'
  | 'branches'
  | 'stashes'
  | 'settings'
  | 'github';

export type GitHubTab =
  | 'pull-requests'
  | 'issues'
  | 'actions'
  | 'releases'
  | 'pages'
  | 'notifications'
  | 'insights';

export interface SidebarState {
  expanded: boolean;
  width: number;
}

export interface CommandPaletteState {
  open: boolean;
  query: string;
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ModalState {
  open: boolean;
  component?: string;
  props?: Record<string, unknown>;
}
