import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info
};

const STYLES = {
  success: 'bg-neutral-900 border-emerald-500/40 text-white shadow-emerald-500/10',
  warning: 'bg-neutral-900 border-amber-500/40 text-white shadow-amber-500/10',
  error: 'bg-neutral-900 border-red-500/40 text-white shadow-red-500/10',
  info: 'bg-neutral-900 border-cyan-500/40 text-white shadow-cyan-500/10'
};

const ICON_COLORS = {
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  error: 'text-red-400',
  info: 'text-cyan-400'
};

export function NotificationToast({
  message,
  title,
  type = 'success',
  onClose
}) {
  if (!message) return null;

  const Icon = ICONS[type] || ICONS.info;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 max-w-md border rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md ${STYLES[type]}`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${ICON_COLORS[type]}`} />
        <div className="flex-1 pr-2">
          {title && <h4 className="text-sm font-bold text-white mb-0.5">{title}</h4>}
          <p className="text-xs text-neutral-300 leading-relaxed">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
