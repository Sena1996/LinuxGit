import { BaseApi } from '../base.api';
import type { IGitHubNotificationService } from '@/domain/interfaces';
import type { Notification } from '@/domain/entities';

export class GitHubNotificationApi extends BaseApi implements IGitHubNotificationService {
  async list(all = false): Promise<Notification[]> {
    return this.invoke<Notification[]>('github_list_notifications', {
      all,
      participating: null,
      since: null,
      before: null,
      perPage: 50,
      page: null,
    });
  }

  async listForRepo(owner: string, repo: string): Promise<Notification[]> {
    return this.invoke<Notification[]>('github_list_repo_notifications', {
      owner,
      repo,
      all: false,
      participating: null,
      since: null,
      before: null,
      perPage: 50,
      page: null,
    });
  }

  async markAllRead(): Promise<void> {
    await this.invoke('github_mark_all_notifications_read', {
      lastReadAt: null,
      read: true,
    });
  }

  async markRepoRead(owner: string, repo: string): Promise<void> {
    await this.invoke('github_mark_repo_notifications_read', {
      owner,
      repo,
      lastReadAt: null,
    });
  }

  async getThread(threadId: string): Promise<Notification> {
    return this.invoke<Notification>('github_get_thread', { threadId });
  }

  async markThreadRead(threadId: string): Promise<void> {
    await this.invoke('github_mark_thread_read', { threadId });
  }

  async markThreadDone(threadId: string): Promise<void> {
    await this.invoke('github_mark_thread_done', { threadId });
  }

  async getUnreadCount(): Promise<number> {
    return this.invoke<number>('github_get_unread_count');
  }
}

export const gitHubNotificationApi = new GitHubNotificationApi();
