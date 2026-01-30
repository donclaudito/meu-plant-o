import React, { useMemo, useState } from 'react';
import { FileText, Stethoscope, ChevronDown, ChevronUp, Award } from 'lucide-react';

export default function DoctorPayslip({ doctorName, shifts, extraIncomes, discounts, doctorDiscount, doctorDiscountReason, currentMonth, currentYear, filters }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const normalizeDoctorName = (name) => {
    if (!name) return '';
    return name.trim().toUpperCase().replace(/^DR\.\s*/i, '').replace(/^DRA\.\s*/i, '');
  };
  
  const summary = useMemo(() => {
    // Filtrar shifts do médico (normalizado - sem prefixo)
    const normalizedFilterName = normalizeDoctorName(doctorName);
    const doctorShifts = shifts.filter(s => 
      normalizeDoctorName(s.doctorName) === normalizedFilterName
    );
    
    // Filtrar receitas extras do médico (normalizado - sem prefixo)
    const doctorExtras = extraIncomes.filter(e => 
      normalizeDoctorName(e.doctorName) === normalizedFilterName
    );
    
    // Total líquido de plantões
    const totalShifts = doctorShifts.reduce((acc, s) => 
      acc + (Number(s.netValue) || Number(s.value) || 0), 0
    );
    
    // Total de receitas extras
    const totalExtras = doctorExtras.reduce((acc, e) => 
      acc + (Number(e.value) || 0), 0
    );
    
    // Total de descontos (aplicado proporcionalmente) - SÓ SE HOUVER FATURAMENTO
    const totalDiscounts = (totalShifts + totalExtras > 0) ? (Number(discounts) || 0) : 0;

    // Desconto personalizado do médico
    const personalDiscount = Number(doctorDiscount) || 0;

    // Total líquido final - NÃO NEGATIVO
    const netTotal = Math.max(0, totalShifts + totalExtras - totalDiscounts - personalDiscount);
    
    return {
      doctorShifts,
      doctorExtras,
      totalShifts,
      totalExtras,
      totalDiscounts,
      personalDiscount,
      netTotal
      };
      }, [doctorName, shifts, extraIncomes, discounts, doctorDiscount]);

  if (!doctorName || doctorName === 'TODOS') {
    return null;
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Obter o médico completo da lista para ter acesso ao CRM
  const doctor = shifts.find(s => s.doctorName?.toUpperCase() === doctorName.toUpperCase());

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 p-8 rounded-[2.5rem] border-2 border-purple-200 dark:border-purple-800 shadow-sm mb-6">
      {/* CABEÇALHO PROFISSIONAL */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-purple-300 dark:border-purple-700 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Award size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-purple-900 dark:text-purple-200 mb-1">{doctorName}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-bold flex items-center gap-2">
                <Stethoscope size={16} /> CRM: {doctor?.crm || 'Não informado'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Período: 01/{String(currentMonth + 1).padStart(2, '0')}/{currentYear} a {new Date(currentYear, currentMonth + 1, 0).getDate()}/{String(currentMonth + 1).padStart(2, '0')}/{currentYear}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Referência</p>
            <p className="text-2xl font-black text-purple-700 dark:text-purple-400">{monthNames[currentMonth]} {currentYear}</p>
          </div>
        </div>
      </div>

      {/* RESUMO PRINCIPAL SEMPRE VISÍVEL */}
      <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Plantões</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">R$ {summary.totalShifts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{summary.doctorShifts.length} plantões</p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Receitas Extras</p>
            <p className="text-2xl font-black text-green-600 dark:text-green-400">+ R$ {summary.totalExtras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{summary.doctorExtras.length} receitas</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Descontos</p>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">- R$ {summary.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* BOTÃO PARA EXPANDIR DETALHES */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mb-4 flex items-center justify-center gap-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 px-6 py-4 rounded-2xl font-bold text-sm transition-colors"
      >
        {showDetails ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        {showDetails ? 'Ocultar Lista Detalhada' : 'Exibir Lista Detalhada de Plantões'}
      </button>

      {/* DETALHES OCULTOS POR PADRÃO */}
      {showDetails && (
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
          {(summary.totalDiscounts > 0 || summary.personalDiscount > 0) && (
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl space-y-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                DESCONTOS
              </h4>

              {summary.totalDiscounts > 0 && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">Descontos Fixos:</span>
                  <span className="text-lg font-black text-red-600 dark:text-red-400">
                    - R$ {summary.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {summary.personalDiscount > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-amber-700 dark:text-amber-400 uppercase">Desconto Adicional (ADM):</span>
                    <span className="text-lg font-black text-red-600 dark:text-red-400">
                      - R$ {summary.personalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {doctorDiscountReason && (
                    <p className="text-xs text-amber-600 dark:text-amber-500 font-bold">Motivo: {doctorDiscountReason}</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-red-300 dark:border-red-800">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">Total Descontos:</span>
                <span className="text-xl font-black text-red-600 dark:text-red-400">
                  - R$ {(summary.totalDiscounts + summary.personalDiscount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Total Líquido Final */}
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 p-6 rounded-2xl border-2 border-purple-300 dark:border-purple-700 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">Valor Líquido Total</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">Plantões + Extras - Descontos{summary.personalDiscount > 0 ? ' - Ajuste ADM' : ''}</p>
          </div>
          <span className="text-4xl font-black text-purple-700 dark:text-purple-300">
            R$ {summary.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}