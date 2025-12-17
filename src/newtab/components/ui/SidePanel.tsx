import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closable?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
}

/**
 * SidePanel Component
 * Right-side slide-out panel with backdrop and animations
 * Allows live preview of background content
 */
export function SidePanel({
  isOpen,
  onClose,
  title,
  children,
  closable = true,
  showCloseButton = true,
  className,
  contentClassName,
  overlayClassName,
}: SidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closable) {
        onClose();
      }
    },
    [closable, onClose]
  );

  // Handle overlay click to close
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Check if click is outside the panel
      if (closable && panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [closable, onClose]
  );

  // Save previous focus and lock body scroll when panel opens
  useEffect(() => {
    if (isOpen) {
      // Save current focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown);

        // Restore focus when panel closes
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  // Focus panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const panelContent = (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'animate-fade-in',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sidepanel-title' : undefined}
    >
      {/* Backdrop - semi-transparent to show background */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Side Panel */}
      <div
        ref={panelRef}
        className={cn(
          'absolute right-0 top-0 h-screen w-[480px]',
          'bg-white dark:bg-gray-800',
          'shadow-2xl shadow-black/30',
          'overflow-hidden',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2
                id="sidepanel-title"
                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {title}
              </h2>
            )}
            {showCloseButton && closable && (
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  !title && 'absolute top-4 right-4'
                )}
                aria-label="Close panel"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'overflow-y-auto h-full pb-20',
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render via portal
  const portalTarget =
    document.getElementById('overlay-root') || document.body;

  return createPortal(panelContent, portalTarget);
}

export default SidePanel;
