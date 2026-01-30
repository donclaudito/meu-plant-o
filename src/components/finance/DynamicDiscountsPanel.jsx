import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calculator } from 'lucide-react';

export default function DynamicDiscountsPanel({ 
  isApproved, 
  totalBruto, 
  baseDiscounts, 
  onDiscountsChange 
}) {
  const [discounts, setDiscounts] = useState([
    { id: 'imposto', name: 'Impostos (15%)', value: 15, isPercentage: true, fixed: true, editable: true },
    { id: 'contador', name: 'Contador', value: 0, isPercentage: false, fixed: true, editable: true },
    ...baseDiscounts
  ]);

  useEffect(() => {
    onDiscountsChange(discounts);
  }, [discounts]);

  const addCustomDiscount = () => {
    setDiscounts([...discounts, {
      id: `custom_${Date.now()}`,
      name: '',
      value: 0,
      isPercentage: false,
      fixed: false
    }]);
  };

  const updateDiscount = (id, field, value) => {
    setDiscounts(discounts.map(d => 
      d.id === id ? { ...d, [field]: field === 'value' ? Number(value) : value } : d
    ));
  };

  const removeDiscount = (id) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  const totalDiscounts = discounts.reduce((acc, d) => {
    if (d.isPercentage) return acc + (totalBruto * (Number(d.value) / 100));
    return acc + Number(d.value || 0);
  }, 0);

  const netTotal = Math.max(0, totalBruto - totalDiscounts);

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-orange-200 dark:border-orange-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-orange-900 dark:text-orange-200 flex items-center gap-2">
          <Calculator className="text-orange-600 dark:text-orange-400" /> Painel de Descontos ADM
        </h3>
        {isApproved && (
          <button
            onClick={addCustomDiscount}
            className="flex items-center gap-2 bg-orange-600 dark:bg-orange-500 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors shadow-lg"
          >
            <Plus size={16} /> Adicionar Desconto Extra
          </button>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {discounts.map(discount => (
          <div key={discount.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5">
                {isApproved && !discount.fixed ? (
                  <input
                    type="text"
                    value={discount.name}
                    onChange={(e) => updateDiscount(discount.id, 'name', e.target.value)}
                    placeholder="Nome do desconto (ex: Glosa de Material)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold border-2 border-orange-300 dark:border-orange-700 focus:ring-2 focus:ring-orange-600 dark:focus:ring-orange-500"
                  />
                ) : (
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{discount.name}</span>
                )}
              </div>
              <div className="col-span-3">
                {isApproved && discount.editable ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={discount.value}
                      onChange={(e) => updateDiscount(discount.id, 'value', e.target.value)}
                      placeholder="Valor"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 rounded-xl text-sm font-bold border-2 border-orange-300 dark:border-orange-700 focus:ring-2 focus:ring-orange-600 dark:focus:ring-orange-500"
                      step={discount.isPercentage ? "1" : "0.01"}
                    />
                    {discount.isPercentage && <span className="text-sm font-bold text-slate-700 dark:text-slate-300">%</span>}
                  </div>
                ) : (
                  <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                    {discount.isPercentage 
                      ? `${discount.value}%`
                      : `R$ ${(Number(discount.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    }
                  </span>
                )}
              </div>
              <div className="col-span-3 text-right">
                <span className="text-lg font-black text-red-600 dark:text-red-400">
                  - R$ {(discount.isPercentage 
                    ? totalBruto * (Number(discount.value) / 100)
                    : Number(discount.value || 0)
                  ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="col-span-1 text-right">
                {isApproved && !discount.fixed && (
                  <button
                    onClick={() => removeDiscount(discount.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                    title="Remover desconto"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 p-6 rounded-2xl border-2 border-red-300 dark:border-red-700">
          <p className="text-xs font-black text-red-900 dark:text-red-200 uppercase tracking-widest mb-2">Total Descontos</p>
          <p className="text-3xl font-black text-red-700 dark:text-red-300">
            R$ {totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-6 rounded-2xl border-2 border-green-300 dark:border-green-700">
          <p className="text-xs font-black text-green-900 dark:text-green-200 uppercase tracking-widest mb-2">Líquido Total</p>
          <p className="text-3xl font-black text-green-700 dark:text-green-300">
            R$ {netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {!isApproved && (
        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-300 dark:border-amber-700">
          <p className="text-sm text-amber-800 dark:text-amber-300 font-bold text-center">
            🔒 Digite a senha ADM Master para editar os descontos
          </p>
        </div>
      )}
    </div>
  );
}