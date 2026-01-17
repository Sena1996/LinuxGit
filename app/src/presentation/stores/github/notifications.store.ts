import { create } from 'zustand';
import type { Notification } from '@/domain/entities';
import { gitHubNotificationApi } from '@/infrastructure/api';
import { POLL_INTERVAL } from '@/shared/constants';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;

  fetch: (all?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (threadId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  markDone: (threadId: string) => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  items: [],
  unreadCount: 0,
  loading: false,
  error: null,

  fetch: async (all = false) => {
    set({ loading: true, error: null });
    try {
      const items = await gitHubNotificationApi.list(all);
      set({ items, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const unreadCount = await gitHubNotificationApi.getUnreadCount();
      set({ unreadCount });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markRead: async (threadId) => {
    await gitHubNotificationApi.markThreadRead(threadId);
    set((state) => ({
      items: state.items.map((n) =>
        n.id === threadId ? { ...n, unread: false } : n
      ),
    }));
    get().fetchUnreadCount();
  },

  markAllRead: async () => {
    await gitHubNotificationApi.markAllRead();
    set((state) => ({
      items: state.items.map((n) => ({ ...n, unread: false })),
      unreadCount: 0,
    }));
  },

  markDone: async (threadId) => {
    await gitHubNotificationApi.markThreadDone(threadId);
    set((state) => ({
      items: state.items.filter((n) => n.id !== threadId),
    }));
    get().fetchUnreadCount();
  },
}));

let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startNotificationPolling(): void {
  if (pollInterval) return;
  useNotificationsStore.getState().fetchUnreadCount();
  pollInterval = setInterval(() => {
    useNotificationsStore.getState().fetchUnreadCount();
  }, POLL_INTERVAL);
}

export function stopNotificationPolling(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}
