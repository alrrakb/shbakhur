'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action?: ToastAction;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    action?: ToastAction
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    action?: ToastAction
  ) => {
    const id = ++toastId;

    // Auto-attach "عرض السلة" action for cart addition success messages if none provided
    let finalAction = action;
    if (!finalAction && type === 'success' && (message.includes('سلة') || message.includes('السلة'))) {
      finalAction = {
        label: 'عرض السلة ←',
        href: '/cart',
      };
    }

    setToasts((prev) => [...prev, { id, message, type, action: finalAction }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* ── Bottom-Center Floating Luxury Dynamic Pill (Clean & doesn't block header) ── */}
      <div
        className="fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 pointer-events-none w-full px-4 max-w-md sm:max-w-lg"
        dir="rtl"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className="pointer-events-auto bg-[#141414]/95 backdrop-blur-2xl border border-luxury-gold/50 text-white rounded-2xl p-3 sm:p-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] flex items-center justify-between gap-3 sm:gap-4 w-full ring-1 ring-luxury-gold/30 hover:border-luxury-gold transition-colors"
            >
              {/* Icon & Message */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                    toast.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : toast.type === 'error'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : toast.type === 'warning'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      : 'bg-luxury-gold/20 text-luxury-gold border border-luxury-gold/40'
                  }`}
                >
                  {toast.type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : toast.type === 'error' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-gray-100 leading-snug">
                    {toast.message}
                  </p>
                </div>
              </div>

              {/* Action Button (e.g. عرض السلة) */}
              {toast.action && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {toast.action.href ? (
                    <Link
                      href={toast.action.href}
                      onClick={() => removeToast(toast.id)}
                      className="px-3.5 py-2 bg-gradient-to-r from-luxury-gold via-luxury-gold-light to-luxury-gold text-luxury-black font-extrabold text-xs rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] transition-all flex items-center gap-1 active:scale-95 shadow-md whitespace-nowrap"
                    >
                      <span>{toast.action.label}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        toast.action?.onClick?.();
                        removeToast(toast.id);
                      }}
                      className="px-3.5 py-2 bg-luxury-gold text-luxury-black font-bold text-xs rounded-xl hover:bg-luxury-gold-light transition-all flex items-center gap-1 active:scale-95 shadow-md whitespace-nowrap"
                    >
                      <span>{toast.action.label}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Dismiss Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 text-gray-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
                aria-label="إغلاق الإشعار"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
