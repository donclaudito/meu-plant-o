import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MinusCircle, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';

export default function DiscountsModule({ currentMonth, currentYear, discountTypes = [] }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newDiscount, setNewDiscount] = useState({
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    type: '',
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
        date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        type: '',
        description: '',
        value: 0,
        isPercentage: false
      });
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

  const filteredDiscounts = discounts.filter(d => {
    const date = new Date(d.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  // Calcular total de plantões do mês
  const monthlyShiftsTotal = shifts
    .filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((acc, s) => acc + (Number(s.value) || 0), 0);

  // Calcular descontos aplicados (porcentagem convertida em valor)
  const totalDiscounts = filteredDiscounts.reduce((acc, d) => {
    const isPercentage = d.isPercentage === true;
    if (isPercentage) {
      return acc + (monthlyShiftsTotal * (Number(d.value) || 0) / 100);
    }
    return acc + (Number(d.value) || 0);
  }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert YYYY-MM to YYYY-MM-01 for storage
    const discountData = {
      ...newDiscount,
      date: `${newDiscount.date}-01`
    };
    createDiscountMutation.mutate(discountData);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black flex items-center gap-2">
          <MinusCircle className="text-red-600" /> Descontos
        </h3>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Descontado</p>
          <p className="text-2xl font-black text-red-600">
            R$ {totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {!isFormOpen ? (
        <button
          onClick={() => setIsFormOpen(true)}
          className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border-2 border-dashed border-red-200"
        >
          <Plus size={16} /> Registar Desconto
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-red-50 rounded-2xl border border-red-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês e Ano</label>
              <input
                type="month"
                required
                value={newDiscount.date}
                onChange={e => setNewDiscount({ ...newDiscount, date: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
              <select
                required
                value={newDiscount.type}
                onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value })}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600"
              >
                <option value="">Selecione...</option>
                {discountTypes.length > 0 ? (
                  discountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))
                ) : (
                  <>
                    <option value="IRS">IRS</option>
                    <option value="Segurança Social">Segurança Social</option>
                    <option value="Ordem dos Médicos">Ordem dos Médicos</option>
                    <option value="Outro">Outro</option>
                  </>
                )}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <input
              type="text"
              required
              value={newDiscount.description}
              onChange={e => setNewDiscount({ ...newDiscount, description: e.target.value })}
              placeholder="Ex: IRS Novembro 2024"
              className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Desconto</label>
              <select
                value={newDiscount.isPercentage ? 'percentage' : 'fixed'}
                onChange={e => setNewDiscount({ ...newDiscount, isPercentage: e.target.value === 'percentage' })}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600"
              >
                <option value="fixed">Valor Fixo (R$)</option>
                <option value="percentage">Porcentagem (%)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {newDiscount.isPercentage ? 'Porcentagem (%)' : 'Valor (R$)'}
              </label>
              <input
                type="number"
                required
                value={newDiscount.value}
                onChange={e => setNewDiscount({ ...newDiscount, value: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-red-600"
                min="0"
                step="0.01"
                max={newDiscount.isPercentage ? 100 : undefined}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-red-700 transition-colors"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setNewDiscount({
                  date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                  type: '',
                  description: '',
                  value: 0,
                  isPercentage: false
                });
              }}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {filteredDiscounts.length > 0 && (
        <div className="mt-6 space-y-2">
          {filteredDiscounts.map(discount => (
            <div
              key={discount.id}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <MinusCircle size={18} className="text-red-600" />
                </div>
                <div>
                  <p className="font-black text-slate-900">{discount.description}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <CalendarIcon size={12} /> {new Date(discount.date).toLocaleDateString('pt-BR')} • {discount.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-black text-lg text-red-600">
                  {discount.isPercentage === true ? (
                    <>-{discount.value}% <span className="text-sm opacity-70">(R$ {(monthlyShiftsTotal * discount.value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span></>
                  ) : (
                    <>-R$ {discount.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                  )}
                </p>
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: true, id: discount.id, name: discount.description })}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 size={16} className="text-red-600" />
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