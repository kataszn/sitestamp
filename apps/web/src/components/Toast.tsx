import React, { createContext, useContext, useState, ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" style={containerStyle}>
        {toasts.map((toast) => (
          <div key={toast.id} className="toast" style={{ ...toastStyle, ...toastTypeStyles[toast.type] }}>
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} style={closeButtonStyle}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const containerStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "24px",
  right: "24px",
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  pointerEvents: "none",
};

const toastStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "12px 16px",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  minWidth: "280px",
  maxWidth: "400px",
  fontSize: "14px",
  fontFamily: "system-ui, sans-serif",
  pointerEvents: "auto",
  animation: "slideIn 0.3s ease-out",
};

const toastTypeStyles: Record<"success" | "error" | "info", React.CSSProperties> = {
  success: { background: "#10b981", color: "white" },
  error: { background: "#ef4444", color: "white" },
  info: { background: "#3b82f6", color: "white" },
};

const closeButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "inherit",
  fontSize: "20px",
  cursor: "pointer",
  lineHeight: 1,
  padding: 0,
  opacity: 0.7,
};