import { createContext, useContext, useState, useCallback } from "react";
import styles from "./ToastContext.module.scss";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", message }) => {
      const id = ++idCounter;

      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 1500);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className={styles.container}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              styles.toast,
              t.type === "success"
                ? styles.success
                : t.type === "error"
                ? styles.error
                : styles.info,
            ].join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
