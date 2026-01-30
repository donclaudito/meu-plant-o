import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MinusCircle, Plus, Trash2, Calendar as CalendarIcon } from 'lucide-react';

import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import Toast from '@/components/common/Toast';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function DiscountsModule({ currentMonth, currentYear }) {
  const [message, setMessage] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('TODOS');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [newDiscount, setNewDiscount] = useState({
    description: '',
    value: 0,
    isPercentage: false
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });

  useEffect(() => {
    setSelectedMonth(currentMonth);
    setSelectedYear(currentYear);
  }, [currentMonth, currentYear]);

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

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.list('name'),
  });

  // Descontos globais (sem data específica ou com type vazio) - Deduplicados
  const globalDiscounts = discounts
    .filter(d => !d.type || d.type === '')
    .reduce((acc, discount) => {
      const normalizedName = (discount.description || '').trim().toLowerCase();
      // Manter apenas a primeira ocorrência de cada desconto
      if (!acc.some(d => (d.description || '').trim().toLowerCase() === normalizedName)) {
        acc.push(discount);
      }
      return acc;
    }, []);

  // Calcular total de plantões do mês (com filtro de médico)
  const monthlyShiftsTotal = shifts
    .filter(s => {
      const shiftDate = new Date(s.date + 'T00:00:00');
      const isInMonth = shiftDate.getMonth() === selectedMonth && shiftDate.getFullYear() === selectedYear;
      const matchesDoctor = selectedDoctor === 'TODOS' || 
        (s.doctorName && s.doctorName.trim().toUpperCase() === selectedDoctor.trim().toUpperCase());
      return isInMonth && matchesDoctor;
    })
    .reduce((acc, s) => acc + (Number(s.grossValue || s.value) || 0), 0);

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
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Descontos aplicados automaticamente a todos os plantões do mês e ano selecionados.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Filtro por Mês */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Mês
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white text-slate-900 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Ano */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Ano
            </label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white text-slate-900 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
              min="2000"
              max="2100"
            />
          </div>

          {/* Filtro por Médico */}
          <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Filtrar por Médico
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-3 bg-white text-slate-900 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              <option value="TODOS">Todos os Médicos</option>
              {Array.from(new Set(doctors.map(d => d.name.trim().toLowerCase()))).sort().map(normalizedName => {
                const doctor = doctors.find(d => d.name.trim().toLowerCase() === normalizedName);
                const titleCaseName = normalizedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                return <option key={normalizedName} value={titleCaseName}>{titleCaseName}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 p-6 rounded-2xl mb-6 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-slate-900 dark:text-white">Total Bruto (Plantões):</span>
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