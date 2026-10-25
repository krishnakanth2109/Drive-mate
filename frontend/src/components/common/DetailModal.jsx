import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export function DetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  actions,
  maxWidth = 'max-w-2xl'
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full ${maxWidth} bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]`}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-800 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
                {badge}
              </div>
              {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-4 flex-1">
            {children}
          </div>

          {/* Footer Actions */}
          {actions && (
            <div className="p-4 px-6 border-t border-neutral-800 bg-neutral-950/50 flex flex-wrap items-center justify-end gap-3">
              {actions}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
