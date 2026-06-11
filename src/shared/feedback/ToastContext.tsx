/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  pushToast: (kind: ToastKind, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_TTL_MS = 5000;

const toastStyles: Record<ToastKind, { container: string; icon: typeof CheckCircle2 }> = {
  success: {
    container: 'border-[rgba(52,211,153,0.35)] text-[var(--color-git-green)] shadow-[0_0_20px_rgba(52,211,153,0.12)]',
    icon: CheckCircle2
  },
  error: {
    container: 'border-[rgba(248,113,113,0.35)] text-[var(--color-git-red)] shadow-[0_0_20px_rgba(248,113,113,0.12)]',
    icon: XCircle
  },
  warning: {
    container: 'border-[rgba(251,191,36,0.35)] text-[var(--color-git-amber)] shadow-[0_0_20px_rgba(251,191,36,0.12)]',
    icon: AlertTriangle
  },
  info: {
    container: 'border-[rgba(56,189,248,0.35)] text-[var(--color-git-blue)] shadow-[0_0_20px_rgba(56,189,248,0.12)]',
    icon: Info
  }
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    const id = nextIdRef.current++;
    setToasts(prev => [...prev, { id, kind, message }]);
    window.setTimeout(() => dismissToast(id), TOAST_TTL_MS);
  }, [dismissToast]);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Pilha de notificações cívicas */}
      <div
        className="fixed bottom-4 right-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map(toast => {
          const { container, icon: Icon } = toastStyles[toast.kind];
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-2.5 rounded-xl border bg-[rgba(8,13,26,0.92)] px-4 py-3 text-xs font-medium backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 ${container}`}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                className="shrink-0 rounded p-0.5 opacity-50 hover:opacity-100 transition-opacity"
                aria-label="Fechar notificação"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>.');
  }

  return context;
}
