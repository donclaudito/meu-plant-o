import React from 'react';
import { DollarSign, Clock, TrendingUp, Calendar, PieChart, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RPieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ReportStats({ stats }) {
  const typeChartData = Object.entries(stats.byType).map(([type, data]) => ({
    name: type,
    value: data.total,
    count: data.count
  }));

  const unitChartData = Object.entries(stats.byUnit).map(([unit, data]) => ({
    name: unit.length > 15 ? unit.substring(0, 15) + '...' : unit,
    value: data.total,
    count: data.count
  }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Calendar size={14} className="sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Plantões</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.count}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Calendar size={14} className="sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">12h</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.count12h || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Calendar size={14} className="sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">6h</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.count6h || 0}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Clock size={14} className="sm:w-4 sm:h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Horas</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{stats.hours}h</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <DollarSign size={14} className="sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Total</p>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white">R$ {stats.total.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <DollarSign size={14} className="sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Pago</p>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white">R$ {stats.paid.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <DollarSign size={14} className="sm:w-4 sm:h-4 text-amber-600 dark:text-amber-400" />
            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Pendente</p>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white">R$ {stats.pending.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base sm:text-lg font-black mb-3 sm:mb-4 dark:text-white flex items-center gap-1.5 sm:gap-2">
            <PieChart size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm sm:text-base">Receita por Tipo</span>
          </h3>
          {typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" style={{ fontSize: '9px' }} stroke="#94a3b8" className="sm:text-[11px]" />
                <YAxis style={{ fontSize: '9px' }} stroke="#94a3b8" className="sm:text-[11px]" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 dark:text-slate-500 py-8 sm:py-12 text-sm">Sem dados</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-base sm:text-lg font-black mb-3 sm:mb-4 dark:text-white flex items-center gap-1.5 sm:gap-2">
            <Building2 size={18} className="sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm sm:text-base">Receita por Hospital</span>
          </h3>
          {unitChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200} className="sm:h-[250px]">
              <BarChart data={unitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" style={{ fontSize: '9px' }} stroke="#94a3b8" className="sm:text-[11px]" />
                <YAxis style={{ fontSize: '9px' }} stroke="#94a3b8" className="sm:text-[11px]" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '12px',
                    fontWeight: 'bold',
                    fontSize: '11px'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 dark:text-slate-500 py-8 sm:py-12 text-sm">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  );
}