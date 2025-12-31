import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div 
      className="fixed top-20 z-[100] px-6 py-3 rounded-2xl shadow-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-in slide-in-from-top duration-300 max-w-[90vw]"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
    >
      {type === 'success' ? (
        <CheckCircle size={18} className="text-green-500 dark:text-green-400 flex-shrink-0" />
      ) : (
        <AlertCircle size={18} className="text-red-500 dark:text-red-400 flex-shrink-0" />
      )}
      <span className="font-bold text-sm dark:text-white">{message}</span>
    </div>
  );
}