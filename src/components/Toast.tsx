import { useState, useCallback, createContext, useContext, type ReactNode } from 'react';
import { Check, X, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastContextValue {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-[1rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border backdrop-blur-sm ${
              t.type === 'success' ? 'bg-white/95 border-sage-200 text-sage-600' :
              t.type === 'error' ? 'bg-white/95 border-warm-200 text-warm-500' :
              'bg-white/95 border-cream-200 text-text-secondary'
            }`}
          >
            {t.type === 'success' && <Check size={16} className="shrink-0" />}
            {t.type === 'error' && <X size={16} className="shrink-0" />}
            {t.type === 'info' && <Info size={16} className="shrink-0" />}
            <span className="text-sm font-medium">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="ml-2 p-1 rounded-lg hover:bg-cream-100 cursor-pointer transition-colors shrink-0">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
