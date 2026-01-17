export function formatTimeAgo(dateOrTimestamp: Date | string | number): string {
  const date = typeof dateOrTimestamp === 'number'
    ? new Date(dateOrTimestamp * 1000)
    : new Date(dateOrTimestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo ago`;
  return date.toLocaleDateString();
}

export function formatDate(dateOrTimestamp: Date | string | number): string {
  const date = typeof dateOrTimestamp === 'number'
    ? new Date(dateOrTimestamp * 1000)
    : new Date(dateOrTimestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateOrTimestamp: Date | string | number): string {
  const date = typeof dateOrTimestamp === 'number'
    ? new Date(dateOrTimestamp * 1000)
    : new Date(dateOrTimestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function truncatePath(path: string, maxLength = 30): string {
  if (path.length <= maxLength) return path;
  return '...' + path.slice(-maxLength + 3);
}

export function truncateMessage(message: string, maxLength = 72): string {
  const firstLine = message.split('\n')[0];
  if (firstLine.length <= maxLength) return firstLine;
  return firstLine.slice(0, maxLength - 3) + '...';
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}
