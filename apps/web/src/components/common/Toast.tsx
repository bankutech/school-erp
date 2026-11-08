import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export const emitToast = (message: string, type: ToastType = 'info') => {
  const toast: ToastItem = {
    id: `${Date.now()}-${Math.random()}`,
    message,
    type,
  };
  listeners.forEach((listener) => listener(toast));
};

export const useToast = () => {
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    emitToast(message, type);
  }, []);

  return { showToast };
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler: ToastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : t.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : t.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-slate-800 border-slate-700 text-white';

        const Icon =
          t.type === 'success'
            ? CheckCircle2
            : t.type === 'error'
            ? AlertCircle
            : t.type === 'warning'
            ? AlertTriangle
            : Info;

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-3 rounded-xl border shadow-lg text-xs animate-in slide-in-from-bottom-2 duration-200 ${bg}`}
          >
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-medium leading-relaxed">{t.message}</span>
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="p-1 rounded opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
