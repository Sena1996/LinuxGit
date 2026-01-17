import { useState, useRef, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  menuClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface Position {
  top: number;
  left: number;
}

export function Dropdown({
  trigger,
  children,
  align = 'left',
  className,
  menuClassName,
  open: controlledOpen,
  onOpenChange,
}: DropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    } else {
      setInternalOpen(value);
    }
  };

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = menuRef.current?.offsetWidth || 200;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuHeight = menuRef.current?.offsetHeight || 300;

      let top = rect.bottom + 4; // 4px gap
      let left = rect.left;

      // Align horizontally
      if (align === 'right') {
        left = rect.right - menuWidth;
      } else if (align === 'center') {
        left = rect.left + (rect.width - menuWidth) / 2;
      }

      // Prevent overflow on right
      if (left + menuWidth > viewportWidth - 8) {
        left = viewportWidth - menuWidth - 8;
      }

      // Prevent overflow on left
      if (left < 8) {
        left = 8;
      }

      // Prevent overflow on bottom - show above if needed
      if (top + menuHeight > viewportHeight - 8) {
        top = rect.top - menuHeight - 4;
      }

      // Ensure top is not negative
      if (top < 8) {
        top = 8;
      }

      setPosition({ top, left });
    }
  }, [isOpen, align]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('inline-block', className)}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className={cn('dropdown-menu', menuClassName)}
            style={{
              position: 'fixed',
              top: position.top,
              left: position.left,
              zIndex: 9999,
            }}
          >
            {children}
          </div>,
          document.body
        )}
    </>
  );
}

// DropdownItem for consistent menu items
interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  shortcut,
  danger,
  disabled,
  className,
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'dropdown-item w-full flex items-center gap-2 px-3 py-2 text-left text-sm',
        'transition-colors duration-150',
        danger
          ? 'text-status-deleted hover:bg-status-deleted/20'
          : 'text-text-primary hover:bg-hover',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {icon && <span className="text-text-muted">{icon}</span>}
      <span className="flex-1">{children}</span>
      {shortcut && (
        <kbd className="text-xs text-text-ghost bg-surface px-1.5 py-0.5 rounded">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

// DropdownDivider
export function DropdownDivider() {
  return <div className="h-px bg-white/10 my-1" />;
}

// DropdownLabel for section headers
interface DropdownLabelProps {
  children: ReactNode;
}

export function DropdownLabel({ children }: DropdownLabelProps) {
  return (
    <p className="px-3 py-1 text-xs text-text-ghost font-medium">{children}</p>
  );
}
