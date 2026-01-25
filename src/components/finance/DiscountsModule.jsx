import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MinusCircle, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import Toast from '@/components/common/Toast';

export default function DiscountsModule({ currentMonth, currentYear }) {
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    description: '',
    value: 0,
    isPercentage: false
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });

  const queryClient = useQueryClient();

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => base44.entities.Discount.list('-date'),
  });

  const createDiscountMutation = useMutation({
    mutationFn: (data) => base44.entities.Discount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setIsFormOpen(false);
      setNewDiscount({
        description: '',
        value: 0,
        isPercentage: false
      });
      setMessage({ text: 'Desconto global registado com sucesso!', type: 'success' });
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: (id) => base44.entities.Discount.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
    },
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-date'),
  });

  // Descontos globais (sem data específica ou com type vazio)
  const globalDiscounts = discounts.filter(d => !d.type || d.type === '');

  // Calcular total de plantões do mês
  const monthlyShiftsTotal = shifts
    .filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((acc, s) => acc + (Number(s.value) || 0), 0);

  // Calcular descontos aplicados (porcentagem convertida em valor)
  const totalDiscounts = globalDiscounts.reduce((acc, d) => {
    const isPercentage = d.isPercentage === true;
    if (isPercentage) {
      return acc + (monthlyShiftsTotal * (Number(d.value) || 0) / 100);
    }
    return acc + (Number(d.value) || 0);
  }, 0);

  const netTotal = monthlyShiftsTotal - totalDiscounts;

  const handleSubmit = (e) => {
    e.preventDefault();
    const discountData = {
      ...newDiscount,
      date: new Date().toISOString().split('T')[0],
      type: '' // Desconto global sem tipo específico
    };
    createDiscountMutation.mutate(discountData);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <Toast message={message?.text} type={message?.type} />
      <div className="mb-6">
        <h3 className="text-xl font-black flex items-center gap-2 mb-4 dark:text-white">
          <MinusCircle className="text-red-600 dark:text-red-500" /> Descontos Globais
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Descontos aplicados automaticamente a todos os plantões do mês
        </p>
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-6 rounded-2xl mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Total Bruto (Plantões):</span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            R$ {monthlyShiftsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        
        {globalDiscounts.length > 0 && (
          <>
            <div className="border-t border-slate-300 dark:border-slate-600 pt-3 space-y-2">
              {globalDiscounts.map((d) => (
                <div key={d.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 dark:text-slate-400">- {d.description}:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {d.isPercentage === true ? (
                      <>-{d.value}% (R$ {(monthlyShiftsTotal * d.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</>
                    ) : (
                      <>-R$ {d.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-slate-400 dark:border-slate-500 pt-3 flex justify-between items-center">
              <span className="text-base font-black text-slate-700 dark:text-slate-200 uppercase">Valor Líquido Total:</span>
              <span className="text-2xl font-black text-green-600 dark:text-green-400">
                R$ {netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
      </div>

      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-red-200 dark:border-red-700"
        >
          <Plus size={16} /> Adicionar Desconto Global
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
            <input
              type="text"
              required
              value={newDiscount.description}
              onChange={e => setNewDiscount({ ...newDiscount, description: e.target.value })}
              placeholder="Ex: Impostos, Sky, Despesas contábeis"
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipo de Desconto</label>
              <select
                value={newDiscount.isPercentage ? 'percentage' : 'fixed'}
                onChange={e => setNewDiscount({ ...newDiscount, isPercentage: e.target.value === 'percentage' })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500"
              >
                <option value="fixed">Valor Fixo (R$)</option>
                <option value="percentage">Porcentagem (%)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                {newDiscount.isPercentage ? 'Porcentagem (%)' : 'Valor (R$)'}
              </label>
              <input
                type="number"
                required
                value={newDiscount.value}
                onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600 dark:focus:ring-red-500"
                min="0"
                step="0.01"
                max={newDiscount.isPercentage ? 100 : undefined}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createDiscountMutation.isPending}
              className="flex-1 py-3 bg-red-600 dark:bg-red-500 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {createDiscountMutation.isPending ? 'A guardar...' : 'Guardar'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setNewDiscount({
                  description: '',
                  value: 0,
                  isPercentage: false
                });
              }}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {globalDiscounts.length > 0 && (
        <div className="mt-6 space-y-2">
          <h4 className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase mb-3">Descontos Registados</h4>
          {globalDiscounts.map(discount => (
            <div
              key={discount.id}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <MinusCircle size={18} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">{discount.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Desconto global aplicado a todos os plantões
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-black text-lg text-red-600 dark:text-red-400">
                  {discount.isPercentage === true ? (
                    <>{discount.value}%</>
                  ) : (
                    <>R$ {discount.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                  )}
                </p>
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: true, id: discount.id, name: discount.description })}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all"
                >
                  <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => deleteDiscountMutation.mutate(deleteConfirmation.id)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}