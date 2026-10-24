'use client';

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const bgColors = {
    success: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    error: 'bg-rose-50 text-rose-900 border-rose-300',
    info: 'bg-blue-50 text-blue-900 border-blue-300',
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-start p-4 rounded-xl border shadow-lg ${bgColors[type] || bgColors.info}`}>
        {icons[type] || icons.info}
        <div className="ml-3 flex-1 text-sm font-medium">{message}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 -mr-1 -mt-1 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
