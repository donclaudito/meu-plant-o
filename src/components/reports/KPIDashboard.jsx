import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, Calendar, Target, Activity, Sparkles } from 'lucide-react';

export default function KPIDashboard({ stats, shifts }) {
  const [selectedKPIs, setSelectedKPIs] = useState({
    revenueGrowth: true,
    hourlyRate: true,
    paymentRate: true,
    utilizationRate: true,
    avgShiftValue: true,
    monthlyTarget: true,
  });

  const kpiCalculations = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthShifts = shifts.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const lastMonthShifts = shifts.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });

    const currentMonthRevenue = currentMonthShifts.reduce((sum, s) => sum + (s.value || 0), 0);
    const lastMonthRevenue = lastMonthShifts.reduce((sum, s) => sum + (s.value || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    const hourlyRate = stats.hours > 0 ? stats.netTotal / stats.hours : 0;

    const paymentRate = stats.total > 0 ? (stats.paid / stats.total) * 100 : 0;

    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const workDaysInMonth = totalDaysInMonth - 8; // Aproximadamente 8 domingos
    const utilizationRate = (stats.hours / (workDaysInMonth * 12)) * 100; // 12h = dia típico

    const avgShiftValue = stats.count > 0 ? stats.total / stats.count : 0;

    const monthlyTarget = 50000; // Meta mensal configurável
    const targetProgress = (stats.netTotal / monthlyTarget) * 100;

    return {
      revenueGrowth: { value: revenueGrowth, trend: revenueGrowth >= 0 ? 'up' : 'down' },
      hourlyRate: { value: hourlyRate },
      paymentRate: { value: paymentRate, trend: paymentRate >= 80 ? 'up' : 'down' },
      utilizationRate: { value: utilizationRate, trend: utilizationRate >= 60 ? 'up' : 'down' },
      avgShiftValue: { value: avgShiftValue },
      monthlyTarget: { value: targetProgress, target: monthlyTarget, current: stats.netTotal },
    };
  }, [stats, shifts]);

  const kpiCards = [
    {
      key: 'revenueGrowth',
      title: 'Crescimento da Receita',
      icon: TrendingUp,
      color: 'blue',
      format: (val) => `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`,
      description: 'vs. mês anterior',
    },
    {
      key: 'hourlyRate',
      title: 'Taxa Horária Líquida',
      icon: DollarSign,
      color: 'green',
      format: (val) => `€ ${val.toFixed(2)}/h`,
      description: 'valor líquido por hora',
    },
    {
      key: 'paymentRate',
      title: 'Taxa de Recebimento',
      icon: Activity,
      color: 'purple',
      format: (val) => `${val.toFixed(1)}%`,
      description: 'dos valores faturados',
    },
    {
      key: 'utilizationRate',
      title: 'Taxa de Utilização',
      icon: Clock,
      color: 'orange',
      format: (val) => `${val.toFixed(1)}%`,
      description: 'da capacidade mensal',
    },
    {
      key: 'avgShiftValue',
      title: 'Valor Médio por Plantão',
      icon: Calendar,
      color: 'indigo',
      format: (val) => `€ ${val.toFixed(2)}`,
      description: 'média por plantão',
    },
    {
      key: 'monthlyTarget',
      title: 'Meta Mensal',
      icon: Target,
      color: 'pink',
      format: (val) => `${val.toFixed(1)}%`,
      description: `€ ${kpiCalculations.monthlyTarget.current.toFixed(2)} de € ${kpiCalculations.monthlyTarget.target.toFixed(2)}`,
    },
  ];

  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-xl font-black mb-6 dark:text-white flex items-center gap-2">
        <Sparkles className="text-yellow-600 dark:text-yellow-400" /> Dashboard de KPIs
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map(kpi => {
          if (!selectedKPIs[kpi.key]) return null;
          
          const kpiData = kpiCalculations[kpi.key];
          const Icon = kpi.icon;
          const trend = kpiData.trend;

          return (
            <div
              key={kpi.key}
              className="relative overflow-hidden rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${colorMap[kpi.color]}`} />
              
              <div className="p-6 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[kpi.color]} shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  {trend && (
                    <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {trend === 'up' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {kpi.title}
                </h4>

                <p className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {kpi.format(kpiData.value)}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {kpi.description}
                </p>

                {kpi.key === 'monthlyTarget' && (
                  <div className="mt-4">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full bg-gradient-to-r ${colorMap[kpi.color]} transition-all duration-500`}
                        style={{ width: `${Math.min(kpiData.value, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-400 font-bold">
          💡 Os KPIs são calculados automaticamente com base nos seus dados financeiros e podem ajudá-lo a tomar decisões estratégicas.
        </p>
      </div>
    </div>
  );
}