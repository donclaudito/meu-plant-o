import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-4 z-50 px-6 py-3 rounded-2xl shadow-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center gap-3 animate-in slide-in-from-right duration-300">
      {type === 'success' ? (
        <CheckCircle size={18} className="text-green-500 dark:text-green-400" />
      ) : (
        <AlertCircle size={18} className="text-red-500 dark:text-red-400" />
      )}
      <span className="font-bold text-sm dark:text-white">{message}</span>
    </div>
  );
}