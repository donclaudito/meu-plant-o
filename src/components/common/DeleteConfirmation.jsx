import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DeleteConfirmation({ isOpen, name, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 text-center animate-in zoom-in-95">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-black mb-2">Eliminar registo?</h3>
        <p className="text-sm text-slate-500 mb-6 font-medium">
          Esta ação não pode ser desfeita para: 
          <br/>
          <span className="font-black text-slate-700">{name}</span>
        </p>
        <div className="flex flex-col gap-2">
          <button 
            onClick={onConfirm} 
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 transition-colors"
          >
            Sim, Eliminar
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs hover:bg-slate-200 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}