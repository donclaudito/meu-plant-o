import React, { useState, useEffect } from 'react';
import { MinusCircle, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DiscountTypes({ user, showToast }) {
  const [discountTypes, setDiscountTypes] = useState([]);
  const [newType, setNewType] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    if (user?.discountTypes) {
      setDiscountTypes(user.discountTypes);
    } else {
      setDiscountTypes(['IRS', 'Segurança Social', 'Ordem dos Médicos']);
    }
  }, [user]);

  const updateTypesMutation = useMutation({
    mutationFn: async (types) => {
      await base44.auth.updateMe({ discountTypes: types });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showToast?.('Tipos de desconto atualizados!');
    },
  });

  const handleAddType = (e) => {
    e.preventDefault();
    if (newType.trim() && !discountTypes.includes(newType.trim())) {
      const updated = [...discountTypes, newType.trim()];
      setDiscountTypes(updated);
      updateTypesMutation.mutate(updated);
      setNewType('');
    }
  };

  const handleRemoveType = (typeToRemove) => {
    const updated = discountTypes.filter(t => t !== typeToRemove);
    setDiscountTypes(updated);
    updateTypesMutation.mutate(updated);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
        <MinusCircle className="text-red-600 dark:text-red-500" /> Tipos de Desconto
      </h3>

      <form onSubmit={handleAddType} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Ex: Seguro de Saúde"
            className="flex-1 px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {discountTypes.map((type, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group"
          >
            <span className="font-bold text-slate-900">{type}</span>
            <button
              onClick={() => handleRemoveType(type)}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-xl transition-all"
            >
              <X size={14} className="text-red-600" />
            </button>
          </div>
        ))}
      </div>

      {discountTypes.length === 0 && (
        <p className="text-center text-slate-400 py-8 text-sm">
          Nenhum tipo de desconto configurado
        </p>
      )}
    </div>
  );
}