import React, { createContext, useState, useCallback, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 5000, action = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration, action }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message, duration, action) => addToast(message, 'success', duration, action), [addToast]);
  const error = useCallback((message, duration, action) => addToast(message, 'error', duration, action), [addToast]);
  const warning = useCallback((message, duration, action) => addToast(message, 'warning', duration, action), [addToast]);
  const info = useCallback((message, duration, action) => addToast(message, 'info', duration, action), [addToast]);

  useEffect(() => {
    window.__TOAST_ERROR__ = error;
  }, [error]);

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500',
    error: 'bg-red-500/10 border-red-500/30 text-red-500',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    info: 'bg-primary/10 border-primary/30 text-primary',
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info, addToast, removeToast }}>
      {children}

      <div role="status" aria-live="polite" className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex flex-col gap-3 sm:max-w-sm sm:w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const Icon = icons[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`glass-card border ${colors[toast.type]} p-4 pointer-events-auto flex items-start gap-3 shadow-lg`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
                  {toast.action && (
                    <a
                      href={toast.action.href}
                      className="mt-2 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
                    >
                      {toast.action.label}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="×"
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
