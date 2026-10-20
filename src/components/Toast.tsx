'use client';

import React from 'react';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'error' && <AlertCircle size={18} color="#f87171" />}
          {t.type === 'success' && <CheckCircle size={18} color="#4ade80" />}
          {t.type === 'info' && <Info size={18} color="#38bdf8" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
