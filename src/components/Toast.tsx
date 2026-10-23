import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div id="toast-container" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(toast => {
        let icon = <Info size={18} color="#60a5fa" />;
        let borderColor = 'rgba(59, 130, 246, 0.4)';
        let bgColor = 'rgba(15, 23, 42, 0.95)';

        if (toast.type === 'success') {
          icon = <CheckCircle size={18} color="#10b981" />;
          borderColor = 'rgba(16, 185, 129, 0.5)';
        } else if (toast.type === 'error') {
          icon = <XCircle size={18} color="#ef4444" />;
          borderColor = 'rgba(239, 68, 68, 0.5)';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle size={18} color="#f59e0b" />;
          borderColor = 'rgba(245, 158, 11, 0.5)';
        }

        return (
          <div
            key={toast.id}
            className={`toast-notification ${toast.type}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderRadius: 8,
              background: bgColor,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              color: '#f8fafc',
              fontSize: 13,
              fontWeight: 500,
              maxWidth: 380,
              animation: 'slideIn 0.25s ease-out'
            }}
          >
            {icon}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
