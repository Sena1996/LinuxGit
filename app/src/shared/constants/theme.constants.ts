export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: 'bg-blue-500',
  JavaScript: 'bg-yellow-400',
  Rust: 'bg-orange-500',
  Python: 'bg-green-500',
  Go: 'bg-cyan-400',
  Java: 'bg-red-500',
  'C++': 'bg-pink-500',
  C: 'bg-gray-500',
  Ruby: 'bg-red-400',
  PHP: 'bg-purple-500',
  Swift: 'bg-orange-400',
  Kotlin: 'bg-purple-400',
  Scala: 'bg-red-600',
  Shell: 'bg-green-600',
  HTML: 'bg-orange-600',
  CSS: 'bg-blue-400',
};

export const BRANCH_COLORS = [
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(142, 71%, 45%)',
  'hsl(47, 96%, 53%)',
  'hsl(338, 100%, 48%)',
  'hsl(24, 100%, 50%)',
  'hsl(168, 76%, 42%)',
  'hsl(291, 64%, 42%)',
];

export const STATUS_COLORS = {
  added: 'text-status-added',
  modified: 'text-status-modified',
  deleted: 'text-status-deleted',
  renamed: 'text-status-renamed',
  copied: 'text-status-renamed',
  untracked: 'text-status-untracked',
  ignored: 'text-text-muted',
  conflicted: 'text-status-deleted',
};

export const WORKFLOW_STATUS_COLORS = {
  completed: 'bg-status-added',
  in_progress: 'bg-status-modified',
  queued: 'bg-text-muted',
  failure: 'bg-status-deleted',
  cancelled: 'bg-text-muted',
  success: 'bg-status-added',
  neutral: 'bg-text-muted',
  skipped: 'bg-text-muted',
};
