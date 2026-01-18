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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
          <Users size={20} className="text-purple-600 dark:text-purple-400" />
          Desempenho por Médico
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold text-xs focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        >
          <option value="total">Total Recebido</option>
          <option value="count">Nº de Plantões</option>
          <option value="hours">Horas Trabalhadas</option>
          <option value="avgPerHour">Valor/Hora</option>
          <option value="paymentRate">Taxa de Pagamento</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="text-left py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Médico</th>
              <th className="text-left py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden sm:table-cell">Especialidade</th>
              <th className="text-center py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Plantões</th>
              <th className="text-center py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden md:table-cell">Horas</th>
              <th className="text-right py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Total</th>
              <th className="text-right py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden lg:table-cell">Pago</th>
              <th className="text-right py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden lg:table-cell">Pendente</th>
              <th className="text-center py-3 px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase hidden xl:table-cell">R$/Hora</th>
            </tr>
          </thead>
          <tbody>
            {doctorData.map((doctor, index) => (
              <tr 
                key={doctor.name} 
                className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <td className="py-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-sm">{doctor.name}</span>
                  </div>
                </td>
                <td className="py-4 px-2 text-sm text-slate-600 dark:text-slate-400 font-medium hidden sm:table-cell">
                  {doctor.specialty}
                </td>
                <td className="py-4 px-2 text-center font-black text-slate-900 dark:text-white">
                  {doctor.count}
                </td>
                <td className="py-4 px-2 text-center font-bold text-slate-700 dark:text-slate-300 hidden md:table-cell">
                  {doctor.hours}h
                </td>
                <td className="py-4 px-2 text-right font-black text-green-600 dark:text-green-400">
                  R$ {doctor.total.toLocaleString('pt-BR')}
                </td>
                <td className="py-4 px-2 text-right font-bold text-blue-600 dark:text-blue-400 hidden lg:table-cell">
                  R$ {doctor.paid.toLocaleString('pt-BR')}
                </td>
                <td className="py-4 px-2 text-right font-bold text-amber-600 dark:text-amber-400 hidden lg:table-cell">
                  R$ {doctor.pending.toLocaleString('pt-BR')}
                </td>
                <td className="py-4 px-2 text-center hidden xl:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {doctor.avgPerHour > 0 && (
                      doctor.avgPerHour >= (stats.hourlyRate || 0) ? (
                        <TrendingUp size={14} className="text-green-500 dark:text-green-400" />
                      ) : (
                        <TrendingDown size={14} className="text-red-500 dark:text-red-400" />
                      )
                    )}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      R$ {doctor.avgPerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {doctorData.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Exibindo {doctorData.length} médicos | Use os filtros acima para refinar
          </p>
        </div>
      )}
    </div>
  );
}