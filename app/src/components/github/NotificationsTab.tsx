import { useEffect, useState } from 'react';
import { useGitHubStore, Notification } from '@/stores/github';
import {
  Bell,
  RefreshCw,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  GitPullRequest,
  CircleDot,
  MessageSquare,
  AlertCircle,
  Tag,
  GitCommit,
  BellOff,
} from 'lucide-react';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'PullRequest':
      return <GitPullRequest className="w-4 h-4 text-accent" />;
    case 'Issue':
      return <CircleDot className="w-4 h-4 text-success" />;
    case 'Discussion':
      return <MessageSquare className="w-4 h-4 text-info" />;
    case 'Release':
      return <Tag className="w-4 h-4 text-warning" />;
    case 'Commit':
      return <GitCommit className="w-4 h-4 text-text-muted" />;
    case 'SecurityAlert':
      return <AlertCircle className="w-4 h-4 text-danger" />;
    default:
      return <Bell className="w-4 h-4 text-text-muted" />;
  }
}

function getReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    assign: 'Assigned',
    author: 'Author',
    comment: 'Commented',
    ci_activity: 'CI Activity',
    invitation: 'Invited',
    manual: 'Subscribed',
    mention: 'Mentioned',
    review_requested: 'Review Requested',
    security_alert: 'Security Alert',
    state_change: 'State Changed',
    subscribed: 'Watching',
    team_mention: 'Team Mentioned',
  };
  return labels[reason] || reason;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification;
  onMarkRead: () => void;
}) {
  // Build GitHub URL from notification
  const getGitHubUrl = () => {
    const { repository, subject } = notification;
    const baseUrl = repository.html_url;

    if (subject.type === 'PullRequest' && subject.url) {
      const prNumber = subject.url.split('/').pop();
      return `${baseUrl}/pull/${prNumber}`;
    }
    if (subject.type === 'Issue' && subject.url) {
      const issueNumber = subject.url.split('/').pop();
      return `${baseUrl}/issues/${issueNumber}`;
    }
    if (subject.type === 'Release' && subject.url) {
      return `${baseUrl}/releases`;
    }
    if (subject.type === 'Commit' && subject.url) {
      return subject.url.replace('api.github.com/repos', 'github.com').replace('/commits/', '/commit/');
    }
    return baseUrl;
  };

  return (
    <div
      className={`glass-card flex items-start gap-3 p-4 transition-colors ${
        notification.unread
          ? 'border-accent-primary/30'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="mt-0.5">{getNotificationIcon(notification.subject.type)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium text-text-primary leading-tight">
              {notification.subject.title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
              <span>{notification.repository.full_name}</span>
              <span className="px-1.5 py-0.5 rounded bg-surface-lighter">
                {getReasonLabel(notification.reason)}
              </span>
              <span>{formatTimeAgo(notification.updated_at)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {notification.unread && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead();
                }}
                className="p-1.5 rounded hover:bg-success/10 text-text-muted hover:text-success transition-colors"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            <a
              href={getGitHubUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-surface-lighter text-text-muted hover:text-text-secondary transition-colors"
              title="View on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotificationsTab() {
  const {
    notifications,
    notificationsLoading,
    notificationsError,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  } = useGitHubStore();

  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications(showAll);
  }, [fetchNotifications, showAll]);

  const filteredNotifications = filter
    ? notifications.filter((n) => n.subject.type === filter)
    : notifications;

  const unreadCount = notifications.filter((n) => n.unread).length;
  const notificationTypes = [...new Set(notifications.map((n) => n.subject.type))];

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (notificationsError) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted p-4">
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-status-deleted" />
          <p className="text-lg font-medium">Failed to load Notifications</p>
          <p className="text-sm mt-2">{notificationsError}</p>
          <button
            onClick={() => fetchNotifications(showAll)}
            className="mt-4 px-4 py-2 bg-accent-primary text-void rounded-lg hover:shadow-glow-sm transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 overflow-auto">
      {/* Header */}
      <div className="glass-card p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-accent-primary" />
            <h2 className="text-lg font-semibold text-text-primary">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-accent-primary text-void font-medium">
                {unreadCount} unread
              </span>
            )}
            {notificationsLoading && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-text-muted">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded border-white/10 bg-surface/50"
              />
              Show all
            </label>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => fetchNotifications(showAll)}
              disabled={notificationsLoading}
              className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${notificationsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Type filter */}
      {notificationTypes.length > 1 && (
        <div className="glass-card p-2 mb-4">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilter(null)}
              className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${
                !filter
                  ? 'bg-accent-primary text-void'
                  : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              All
            </button>
            {notificationTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filter === type
                    ? 'bg-accent-primary text-void'
                    : 'text-text-secondary hover:bg-white/10 hover:text-text-primary'
                }`}
              >
                {getNotificationIcon(type)}
                {type}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications list */}
      {filteredNotifications.length === 0 && !notificationsLoading ? (
        <div className="flex-1 flex items-center justify-center text-text-muted">
          <div className="glass-card p-8 text-center">
            <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm mt-2">
              {showAll ? "You're all caught up!" : 'No unread notifications'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={() => markNotificationRead(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
