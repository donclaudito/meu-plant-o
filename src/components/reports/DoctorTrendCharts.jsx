import React, { useMemo, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export default function DoctorTrendCharts({ shifts, doctors }) {
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const doctorMonthlyData = useMemo(() => {
    const monthlyStats = {};

    shifts.forEach(shift => {
      if (!shift || !shift.date || !shift.doctorName) return;
      if (selectedDoctor && shift.doctorName !== selectedDoctor) return;

      const [year, month] = shift.date.split('-').map(Number);
      const key = `${year}-${String(month).padStart(2, '0')}`;
      const label = `${monthNames[month - 1]} ${year}`;

      if (!monthlyStats[key]) {
        monthlyStats[key] = {
          month: label,
          sortKey: key,
          shifts: 0,
          hours: 0,
          revenue: 0,
          paid: 0,
          pending: 0
        };
      }

      const value = Number(shift.value) || 0;
      monthlyStats[key].shifts++;
      monthlyStats[key].hours += Number(shift.hours) || 0;
      monthlyStats[key].revenue += value;

      if (shift.paid) {
        monthlyStats[key].paid += value;
      } else {
        monthlyStats[key].pending += value;
      }
    });

    return Object.values(monthlyStats)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6);
  }, [shifts, selectedDoctor]);

  const doctorComparison = useMemo(() => {
    const comparison = {};

    shifts.forEach(shift => {
      if (!shift || !shift.doctorName) return;

      const name = shift.doctorName;
      if (!comparison[name]) {
        comparison[name] = {
          name,
          shifts: 0,
          revenue: 0,
          hours: 0
        };
      }

      comparison[name].shifts++;
      comparison[name].revenue += Number(shift.value) || 0;
      comparison[name].hours += Number(shift.hours) || 0;
    });

    return Object.values(comparison).sort((a, b) => b.revenue - a.revenue);
  }, [shifts]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
          Tendências de Desempenho
        </h3>
        <div>
          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
            Filtrar por Médico
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          >
            <option value="">Todos os Médicos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
            Evolução de Receita (Últimos 6 Meses)
          </h4>
          {doctorMonthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={doctorMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                  tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}
                  formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                />
                <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Receita Total"
                  dot={{ fill: '#3b82f6', r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="paid" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  name="Pago"
                  dot={{ fill: '#22c55e', r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pending" 
                  stroke="#f59e0b" 
                  strokeWidth={3}
                  name="Pendente"
                  dot={{ fill: '#f59e0b', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 dark:text-slate-500 py-12">Nenhum dado disponível</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
            Plantões por Mês (Últimos 6 Meses)
          </h4>
          {doctorMonthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={doctorMonthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}
                />
                <Legend wrapperStyle={{ fontWeight: 'bold', fontSize: '12px' }} />
                <Bar dataKey="shifts" fill="#8b5cf6" name="Plantões" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 dark:text-slate-500 py-12">Nenhum dado disponível</p>
          )}
        </div>

        {!selectedDoctor && (
          <div>
            <h4 className="text-sm font-black text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
              Comparação entre Médicos (Receita Total)
            </h4>
            {doctorComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doctorComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    type="number"
                    stroke="#64748b"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                    tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    stroke="#64748b"
                    style={{ fontSize: '11px', fontWeight: 'bold' }}
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                  />
                  <Bar dataKey="revenue" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-slate-400 dark:text-slate-500 py-12">Nenhum dado disponível</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}