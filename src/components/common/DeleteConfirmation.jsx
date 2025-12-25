import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DeleteConfirmation({ isOpen, name, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 dark:bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-sm p-8 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black mb-2 dark:text-white">Eliminar registo?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium">
          Esta ação não pode ser desfeita para: 
          <br/>
          <span className="font-black text-slate-700 dark:text-slate-200">{name}</span>
        </p>
        <div className="flex flex-col gap-2">
          <button 
            onClick={onConfirm} 
            className="w-full py-4 bg-red-500 dark:bg-red-600 text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
          >
            Sim, Eliminar
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}