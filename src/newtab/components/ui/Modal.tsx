import { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: ModalSize;
  closable?: boolean;
  showCloseButton?: boolean;
  className?: string;
  contentClassName?: string;
  overlayClassName?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

/**
 * Modal Component
 * Renders a modal dialog with overlay, animations, and accessibility features
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  showCloseButton = true,
  className,
  contentClassName,
  overlayClassName,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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
      if (e.target === e.currentTarget && closable) {
        onClose();
      }
    },
    [closable, onClose]
  );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  // Focus trap - focus modal when opened
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-fade-in',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        ref={modalRef}
        className={cn(
          'relative w-full',
          sizeClasses[size],
          'bg-white dark:bg-gray-800',
          'rounded-2xl shadow-2xl shadow-black/20',
          'max-h-[90vh] overflow-hidden',
          'animate-scale-in',
          className
        )}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-gray-100"
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
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            'overflow-y-auto',
            contentClassName
          )}
          style={{ maxHeight: 'calc(90vh - 80px)' }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Render via portal
  const portalTarget =
    document.getElementById('overlay-root') || document.body;

  return createPortal(modalContent, portalTarget);
}

export default Modal;
