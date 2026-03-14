'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
  /** Dialog title */
  title?: string;
  /** Dialog content */
  children: React.ReactNode;
  /** Footer content with action buttons */
  footer?: React.ReactNode;
  /** Whether to close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Maximum width of the dialog */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Whether to prevent body scroll when open */
  preventScroll?: boolean;
  /** Additional className for the dialog */
  className?: string;
}

/**
 * Consistent dialog/modal component using native HTML dialog element.
 * Provides accessible modal functionality with smooth animations.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  closeOnOverlayClick = true,
  showCloseButton = true,
  size = 'md',
  preventScroll = true,
  className = '',
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Handle escape key and close on overlay click
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  // Handle prevent scroll
  useEffect(() => {
    if (open && preventScroll) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open, preventScroll]);

  // Handle click on overlay (backdrop)
  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || !closeOnOverlayClick) return;

    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      handleClose();
    }
  };

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  return (
    <dialog
      ref={dialogRef}
      className={`
        ${sizeStyles[size]}
        w-full p-0
        bg-white dark:bg-gray-800
        rounded-xl shadow-xl
        backdrop:bg-black/50 backdrop:animate-fadeIn
        animate-dialogEnter
        ${className}
      `}
      onClick={handleDialogClick}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
    >
      {/* Header */}
      {(title || showCloseButton) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          )}
          {showCloseButton && (
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Close dialog"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
          {footer}
        </div>
      )}
    </dialog>
  );
}

export default Dialog;
