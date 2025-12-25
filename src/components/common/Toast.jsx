import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-4 z-50 px-6 py-3 rounded-2xl shadow-xl bg-white border border-slate-100 flex items-center gap-3 animate-in slide-in-from-right duration-300">
      {type === 'success' ? (
        <CheckCircle size={18} className="text-green-500" />
      ) : (
        <AlertCircle size={18} className="text-red-500" />
      )}
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
}