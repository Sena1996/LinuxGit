import { cn } from '@/lib/utils';

interface BadgeProps {
  count: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  max?: number;
  showZero?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  count,
  variant = 'primary',
  size = 'sm',
  max = 99,
  showZero = false,
  pulse = false,
  className
}: BadgeProps) {
  if (count === 0 && !showZero) return null;

  const variants = {
    primary: 'bg-accent-primary text-[#0a0a0f]',
    success: 'bg-status-added text-[#0a0a0f]',
    warning: 'bg-status-modified text-[#0a0a0f]',
    danger: 'bg-status-deleted text-white',
    info: 'bg-accent-secondary text-white',
  };

  const sizes = {
    sm: 'min-w-[18px] h-[18px] text-[10px] px-1',
    md: 'min-w-[22px] h-[22px] text-xs px-1.5',
  };

  return (
    <span
      className={cn(
        'absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center font-semibold shadow-lg',
        'border border-black/20',
        variants[variant],
        sizes[size],
        pulse && 'animate-pulse',
        className
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

// Dot indicator for simple status
interface DotIndicatorProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  pulse?: boolean;
  className?: string;
}

export function DotIndicator({
  variant = 'primary',
  pulse = false,
  className
}: DotIndicatorProps) {
  const variants = {
    primary: 'bg-accent-primary',
    success: 'bg-status-added',
    warning: 'bg-status-modified',
    danger: 'bg-status-deleted',
    info: 'bg-accent-secondary',
  };

  return (
    <span
      className={cn(
        'w-2 h-2 rounded-full',
        variants[variant],
        pulse && 'animate-pulse',
        className
      )}
    />
  );
}

// Inline badge for nav items
interface InlineBadgeProps {
  count: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'muted';
  max?: number;
  className?: string;
}

export function InlineBadge({
  count,
  variant = 'primary',
  max = 99,
  className
}: InlineBadgeProps) {
  if (count === 0) return null;

  const variants = {
    primary: 'bg-accent-primary/20 text-accent-primary',
    success: 'bg-status-added/20 text-status-added',
    warning: 'bg-status-modified/20 text-status-modified',
    danger: 'bg-status-deleted/20 text-status-deleted',
    muted: 'bg-white/10 text-text-secondary',
  };

  return (
    <span
      className={cn(
        'ml-auto text-xs px-2 py-0.5 rounded-full font-medium',
        variants[variant],
        className
      )}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}

// Status indicator with icon support
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'pending' | 'running';
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusIndicator({
  status,
  size = 'sm',
  className
}: StatusIndicatorProps) {
  const colors = {
    success: 'bg-status-added',
    warning: 'bg-status-modified',
    error: 'bg-status-deleted',
    pending: 'bg-text-muted',
    running: 'bg-accent-primary',
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'rounded-full',
        colors[status],
        sizes[size],
        status === 'running' && 'animate-pulse',
        className
      )}
    />
  );
}
