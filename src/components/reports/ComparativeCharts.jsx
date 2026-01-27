import React, { useMemo } from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function ComparativeCharts({ shifts, extraIncomes, discounts }) {
  const monthlyComparison = useMemo(() => {
    const monthsData = {};
    
    shifts.forEach(s => {
      const date = new Date(s.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthsData[key]) {
        monthsData[key] = {
          month: monthLabel,
          plantoes: 0,
          horas: 0,
          receitasExtras: 0,
          descontos: 0,
          bruto: 0,
          liquido: 0,
        };
      }
      
      monthsData[key].plantoes += s.value || 0;
      monthsData[key].horas += s.hours || 0;
    });

    extraIncomes.forEach(income => {
      const date = new Date(income.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthsData[key]) {
        monthsData[key] = {
          month: monthLabel,
          plantoes: 0,
          horas: 0,
          receitasExtras: 0,
          descontos: 0,
          bruto: 0,
          liquido: 0,
        };
      }
      
      monthsData[key].receitasExtras += income.value || 0;
    });

    discounts.forEach(d => {
      if (!d.type || d.type === '') {
        const date = new Date(d.date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!monthsData[key]) {
          monthsData[key] = {
            month: monthLabel,
            plantoes: 0,
            horas: 0,
            receitasExtras: 0,
            descontos: 0,
            bruto: 0,
            liquido: 0,
          };
        }
        
        const isPercentage = d.isPercentage === true;
        if (isPercentage) {
          monthsData[key].descontos += (monthsData[key].plantoes * (d.value || 0)) / 100;
        } else {
          monthsData[key].descontos += d.value || 0;
        }
      }
    });

    Object.keys(monthsData).forEach(key => {
      monthsData[key].bruto = monthsData[key].plantoes + monthsData[key].receitasExtras;
      monthsData[key].liquido = monthsData[key].bruto - monthsData[key].descontos;
    });
    
    return Object.values(monthsData).sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  }, [shifts, extraIncomes, discounts]);

  const yearlyComparison = useMemo(() => {
    const yearsData = {};
    
    shifts.forEach(s => {
      const date = new Date(s.date);
      const year = date.getFullYear().toString();
      
      if (!yearsData[year]) {
        yearsData[year] = {
          year,
          plantoes: 0,
          horas: 0,
          receitasExtras: 0,
          descontos: 0,
          bruto: 0,
          liquido: 0,
        };
      }
      
      yearsData[year].plantoes += s.value || 0;
      yearsData[year].horas += s.hours || 0;
    });

    extraIncomes.forEach(income => {
      const date = new Date(income.date);
      const year = date.getFullYear().toString();
      
      if (!yearsData[year]) {
        yearsData[year] = {
          year,
          plantoes: 0,
          horas: 0,
          receitasExtras: 0,
          descontos: 0,
          bruto: 0,
          liquido: 0,
        };
      }
      
      yearsData[year].receitasExtras += income.value || 0;
    });

    discounts.forEach(d => {
      if (!d.type || d.type === '') {
        const date = new Date(d.date);
        const year = date.getFullYear().toString();
        
        if (!yearsData[year]) {
          yearsData[year] = {
            year,
            plantoes: 0,
            horas: 0,
            receitasExtras: 0,
            descontos: 0,
            bruto: 0,
            liquido: 0,
          };
        }
        
        const isPercentage = d.isPercentage === true;
        if (isPercentage) {
          yearsData[year].descontos += (yearsData[year].plantoes * (d.value || 0)) / 100;
        } else {
          yearsData[year].descontos += d.value || 0;
        }
      }
    });

    Object.keys(yearsData).forEach(year => {
      yearsData[year].bruto = yearsData[year].plantoes + yearsData[year].receitasExtras;
      yearsData[year].liquido = yearsData[year].bruto - yearsData[year].descontos;
    });
    
    return Object.values(yearsData).sort((a, b) => a.year.localeCompare(b.year));
  }, [shifts, extraIncomes, discounts]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black mb-6 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-blue-600 dark:text-blue-400" /> Evolução Financeira Mensal
        </h3>
        {monthlyComparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" style={{ fontSize: '11px' }} stroke="#94a3b8" />
              <YAxis style={{ fontSize: '11px' }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
                formatter={(value) => `€ ${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="plantoes" stroke="#3b82f6" name="Plantões" strokeWidth={2} />
              <Line type="monotone" dataKey="receitasExtras" stroke="#10b981" name="Receitas Extras" strokeWidth={2} />
              <Line type="monotone" dataKey="bruto" stroke="#8b5cf6" name="Bruto Total" strokeWidth={3} />
              <Line type="monotone" dataKey="liquido" stroke="#22c55e" name="Líquido Total" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sem dados para comparação mensal</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black mb-6 dark:text-white flex items-center gap-2">
          <Calendar className="text-purple-600 dark:text-purple-400" /> Comparação Anual
        </h3>
        {yearlyComparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={yearlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" style={{ fontSize: '11px' }} stroke="#94a3b8" />
              <YAxis style={{ fontSize: '11px' }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
                formatter={(value) => `€ ${value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="plantoes" fill="#3b82f6" name="Plantões" radius={[8, 8, 0, 0]} />
              <Bar dataKey="receitasExtras" fill="#10b981" name="Receitas Extras" radius={[8, 8, 0, 0]} />
              <Bar dataKey="descontos" fill="#ef4444" name="Descontos" radius={[8, 8, 0, 0]} />
              <Bar dataKey="liquido" fill="#22c55e" name="Líquido Total" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sem dados para comparação anual</p>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black mb-6 dark:text-white flex items-center gap-2">
          <TrendingUp className="text-green-600 dark:text-green-400" /> Horas Trabalhadas - Tendência Mensal
        </h3>
        {monthlyComparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" style={{ fontSize: '11px' }} stroke="#94a3b8" />
              <YAxis style={{ fontSize: '11px' }} stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #e2e8f0', 
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '11px'
                }}
                formatter={(value) => `${value}h`}
              />
              <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
              <Line type="monotone" dataKey="horas" stroke="#10b981" name="Horas Trabalhadas" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sem dados de horas</p>
        )}
      </div>
    </div>
  );
}