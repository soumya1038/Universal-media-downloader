import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget && onCancel) onCancel(); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.15 }}
          className="glass-card w-full max-w-md p-6 space-y-5 shadow-2xl"
          style={{ background: 'var(--surface-container)' }}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: isDanger ? 'var(--error-soft)' : 'var(--primary-container)',
                color: isDanger ? 'var(--error)' : 'var(--primary)',
              }}
            >
              <span className="material-symbols-outlined text-xl">
                {isDanger ? 'warning' : 'help_outline'}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--on-surface)' }}>{title}</h3>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{message}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="btn-ghost text-xs py-2 px-4"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={isDanger ? 'btn-danger text-xs py-2 px-4' : 'btn-primary text-xs py-2 px-4'}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
