import React, { useMemo } from 'react';
import { FileText, Stethoscope, Plus, MinusCircle } from 'lucide-react';

export default function DoctorPayslip({ doctorName, shifts, extraIncomes, discounts }) {
  const summary = useMemo(() => {
    // Filtrar shifts do médico (case-insensitive)
    const doctorShifts = shifts.filter(s => 
      (s.doctorName || '').trim().toUpperCase() === doctorName.trim().toUpperCase()
    );
    
    // Filtrar receitas extras do médico (case-insensitive)
    const doctorExtras = extraIncomes.filter(e => 
      (e.doctorName || '').trim().toUpperCase() === doctorName.trim().toUpperCase()
    );
    
    // Total líquido de plantões
    const totalShifts = doctorShifts.reduce((acc, s) => 
      acc + (Number(s.netValue) || Number(s.value) || 0), 0
    );
    
    // Total de receitas extras
    const totalExtras = doctorExtras.reduce((acc, e) => 
      acc + (Number(e.value) || 0), 0
    );
    
    // Total de descontos (aplicado proporcionalmente)
    const totalDiscounts = Number(discounts) || 0;
    
    // Total líquido final
    const netTotal = totalShifts + totalExtras - totalDiscounts;
    
    return {
      doctorShifts,
      doctorExtras,
      totalShifts,
      totalExtras,
      totalDiscounts,
      netTotal
    };
  }, [doctorName, shifts, extraIncomes, discounts]);

  if (!doctorName || doctorName === 'TODOS') {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-8 rounded-[2.5rem] border-2 border-purple-200 dark:border-purple-800 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-purple-600 dark:bg-purple-500 text-white rounded-2xl flex items-center justify-center">
          <FileText size={24} />
        </div>
        <div>
          <h3 className="text-xl font-black text-purple-900 dark:text-purple-200">Holerite - Extrato Detalhado</h3>
          <p className="text-sm text-purple-600 dark:text-purple-400 font-bold flex items-center gap-2">
            <Stethoscope size={16} /> {doctorName}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Plantões */}
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl">
          <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            PLANTÕES ({summary.doctorShifts.length})
          </h4>
          {summary.doctorShifts.length > 0 ? (
            <div className="space-y-2">
              {summary.doctorShifts.map(shift => (
                <div key={shift.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {new Date(shift.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">• {shift.unit} • {shift.type}</span>
                  </div>
                  <span className="font-black text-blue-600 dark:text-blue-400">
                    R$ {(Number(shift.netValue) || Number(shift.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-blue-200 dark:border-blue-800">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">Subtotal Plantões:</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                  R$ {summary.totalShifts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Nenhum plantão registrado</p>
          )}
        </div>

        {/* Receitas Extras */}
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl">
          <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            RECEITAS EXTRAS ({summary.doctorExtras.length})
          </h4>
          {summary.doctorExtras.length > 0 ? (
            <div className="space-y-2">
              {summary.doctorExtras.map(extra => (
                <div key={extra.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {new Date(extra.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2">• {extra.type}</span>
                    {extra.description && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({extra.description})</span>
                    )}
                  </div>
                  <span className="font-black text-green-600 dark:text-green-400">
                    + R$ {(Number(extra.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-3 mt-3 border-t-2 border-green-200 dark:border-green-800">
                <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">Subtotal Extras:</span>
                <span className="text-lg font-black text-green-600 dark:text-green-400">
                  + R$ {summary.totalExtras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">Nenhuma receita extra registrada</p>
          )}
        </div>

        {/* Descontos */}
        {summary.totalDiscounts > 0 && (
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl">
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              DESCONTOS
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">Total Descontos:</span>
              <span className="text-lg font-black text-red-600 dark:text-red-400">
                - R$ {summary.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        {/* Total Líquido Final */}
        <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 p-6 rounded-2xl border-2 border-purple-300 dark:border-purple-700">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">Valor Líquido Total</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Plantões + Extras - Descontos</p>
            </div>
            <span className="text-4xl font-black text-purple-700 dark:text-purple-300">
              R$ {summary.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}