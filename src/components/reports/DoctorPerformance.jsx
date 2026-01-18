import React, { useState } from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';

export default function DoctorPerformance({ stats }) {
  const [sortBy, setSortBy] = useState('total');
  
  const doctorData = Object.entries(stats.byDoctor)
    .map(([name, data]) => ({
      name,
      ...data,
      avgPerShift: data.count > 0 ? data.total / data.count : 0,
      avgPerHour: data.hours > 0 ? data.total / data.hours : 0,
      paymentRate: data.total > 0 ? (data.paid / data.total) * 100 : 0
    }))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  if (doctorData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-black dark:text-white flex items-center gap-1.5 sm:gap-2">
          <Users size={18} className="sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          <span className="text-sm sm:text-base">Desempenho por Médico</span>
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg sm:rounded-xl font-bold text-[11px] sm:text-xs focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        >
          <option value="total">Total Recebido</option>
          <option value="count">Nº de Plantões</option>
          <option value="hours">Horas Trabalhadas</option>
          <option value="avgPerHour">Valor/Hora</option>
          <option value="paymentRate">Taxa de Pagamento</option>
        </select>
      </div>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <div className="inline-block min-w-full align-middle px-4 md:px-0">
        <table className="w-full min-w-[500px] md:min-w-0">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Médico</th>
              <th className="text-left py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden sm:table-cell">Especialidade</th>
              <th className="text-center py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Plantões</th>
              <th className="text-center py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden md:table-cell">Horas</th>
              <th className="text-right py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Total</th>
              <th className="text-right py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden lg:table-cell">Pago</th>
              <th className="text-right py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden lg:table-cell">Pendente</th>
              <th className="text-center py-2.5 sm:py-3 px-2 text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden xl:table-cell">R$/Hora</th>
            </tr>
          </thead>
          <tbody>
            {doctorData.map((doctor, index) => (
              <tr 
                key={doctor.name} 
                className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="py-3 sm:py-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-[10px] sm:text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">{doctor.name}</span>
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium hidden sm:table-cell">
                  {doctor.specialty}
                </td>
                <td className="py-3 sm:py-4 px-2 text-center font-black text-slate-900 dark:text-white text-sm">
                  {doctor.count}
                </td>
                <td className="py-3 sm:py-4 px-2 text-center font-bold text-slate-700 dark:text-slate-300 hidden md:table-cell text-sm">
                  {doctor.hours}h
                </td>
                <td className="py-3 sm:py-4 px-2 text-right font-black text-green-600 dark:text-green-400 text-xs sm:text-sm">
                  R$ {doctor.total.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 sm:py-4 px-2 text-right font-bold text-blue-600 dark:text-blue-400 hidden lg:table-cell text-sm">
                  R$ {doctor.paid.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 sm:py-4 px-2 text-right font-bold text-amber-600 dark:text-amber-400 hidden lg:table-cell text-sm">
                  R$ {doctor.pending.toLocaleString('pt-BR')}
                </td>
                <td className="py-3 sm:py-4 px-2 text-center hidden xl:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {doctor.avgPerHour > 0 && (
                      doctor.avgPerHour >= (stats.hourlyRate || 0) ? (
                        <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5 text-green-500 dark:text-green-400" />
                      ) : (
                        <TrendingDown size={12} className="sm:w-3.5 sm:h-3.5 text-red-500 dark:text-red-400" />
                      )
                    )}
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                      R$ {doctor.avgPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {doctorData.length > 5 && (
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
            Exibindo {doctorData.length} médicos | Use os filtros acima para refinar
          </p>
        </div>
      )}
    </div>
  );
}