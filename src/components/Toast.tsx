"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "pending" | "success" | "error" | "info";

type Toast = {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  href?: string;
};

type ToastContextValue = {
  push: (t: Omit<Toast, "id">) => number;
  update: (id: number, patch: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { ...t, id }]);
      if (t.kind === "success" || t.kind === "info") {
        setTimeout(() => dismiss(id), 6000);
      }
      return id;
    },
    [dismiss]
  );

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
      );
      if (patch.kind === "success" || patch.kind === "info") {
        setTimeout(() => dismiss(id), 6000);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push, update, dismiss }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <div className="toast-bar" />
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-msg">{t.message}</div>}
              {t.href && (
                <a
                  className="toast-link"
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction
                </a>
              )}
            </div>
            <button
              className="toast-x"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
