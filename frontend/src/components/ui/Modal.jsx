import React, { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, footer }) {
  const backdropRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) {
      document.addEventListener('keydown', handler);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={backdropRef}
      className="modal-backdrop"
      onClick={(e) => { if (e.target === backdropRef.current) onClose?.(); }}
    >
      <div className="bg-surface-container-lowest w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-10 py-7 border-b border-surface-container flex justify-between items-center">
          <h4 className="text-xl font-extrabold text-on-surface tracking-tight">{title}</h4>
          <button
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-10 py-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-10 py-5 bg-surface-container-low/50 flex justify-end space-x-4 border-t border-surface-container">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
