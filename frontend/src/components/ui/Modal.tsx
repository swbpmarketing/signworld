import React, { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
  closeOnOverlayClick?: boolean;
  footer?: ReactNode;
  className?: string;
}

/**
 * Standardized modal component using Headless UI Dialog
 *
 * @param isOpen - Whether the modal is open
 * @param onClose - Callback when modal is closed
 * @param title - Optional modal title
 * @param children - Modal content
 * @param size - Modal size: 'sm', 'md', 'lg', 'xl', or 'full'
 * @param showClose - Whether to show close button (default: true)
 * @param closeOnOverlayClick - Whether clicking overlay closes modal (default: true)
 * @param footer - Optional footer content
 * @param className - Additional CSS classes for modal content
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  closeOnOverlayClick = true,
  footer,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[9999]"
        onClose={closeOnOverlayClick ? onClose : () => {}}
        style={{ position: 'fixed', inset: 0 }}
      >
        {/* Backdrop - Full viewport coverage */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="modal-backdrop bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100dvh',
              maxHeight: '100vh',
              minHeight: '100vh',
              margin: 0,
              padding: 0,
              zIndex: 9998,
              transform: 'translateZ(0)',
              WebkitBackfaceVisibility: 'hidden',
              backfaceVisibility: 'hidden'
            } as React.CSSProperties}
          />
        </Transition.Child>

        {/* Modal Container */}
        <div
          className="modal-fullscreen"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            maxHeight: '100vh',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
            overflowY: 'auto',
            zIndex: 9999,
            transform: 'translateZ(0)',
            WebkitBackfaceVisibility: 'hidden',
            backfaceVisibility: 'hidden'
          } as React.CSSProperties}
        >
          <div className="flex items-center justify-center p-4" style={{ minHeight: '100vh' } as React.CSSProperties}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${sizeClasses[size]} transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all ${className}`}
              >
                {/* Header */}
                {(title || showClose) && (
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    {title && (
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {title}
                      </Dialog.Title>
                    )}
                    {showClose && (
                      <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                        aria-label="Close modal"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    {footer}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Modal;
