import React from 'react';
import { useToastStore, Toast } from '../../store/toastStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4">
      {toasts.map((toast: Toast) => {
        let icon = <CheckCircle2 className="toast-icon-success w-5 h-5 shrink-0" />;
        let borderClass = 'border-skyblue';

        if (toast.type === 'error') {
          icon = <AlertCircle className="toast-icon-danger w-5 h-5 shrink-0" />;
          borderClass = 'border-red-500/30';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="toast-icon-warning w-5 h-5 shrink-0" />;
          borderClass = 'border-amber-500/30';
        } else if (toast.type === 'info') {
          icon = <Info className="toast-icon-info w-5 h-5 shrink-0" />;
          borderClass = 'border-blue-500/30';
        }

        return (
          <div
            key={toast.id}
            className={`theme-toast pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border ${borderClass} backdrop-blur-md transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-3`}
          >
            {icon}
            <div className="flex-1">
              {toast.title && (
                <h4 className="font-semibold text-sm">
                  {toast.title}
                </h4>
              )}
              <p className="toast-muted text-xs mt-0.5">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-dismiss p-0.5 rounded transition"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
