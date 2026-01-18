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
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Plantões</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.count}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-purple-600 dark:text-purple-400" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Horas</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.hours}h</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-600 dark:text-green-400" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Total</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {stats.total.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Pago</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {stats.paid.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-amber-600 dark:text-amber-400" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Pendente</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {stats.pending.toLocaleString('pt-BR')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">Valor/Hora</p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {stats.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-black mb-4 dark:text-white flex items-center gap-2">
            <PieChart size={20} className="text-blue-600 dark:text-blue-400" />
            Receita por Tipo de Plantão
          </h3>
          {typeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" style={{ fontSize: '11px', fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis style={{ fontSize: '11px', fontWeight: 'bold' }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sem dados</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-black mb-4 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-green-600 dark:text-green-400" />
            Receita por Hospital
          </h3>
          {unitChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={unitChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" style={{ fontSize: '11px', fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis style={{ fontSize: '11px', fontWeight: 'bold' }} stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #e2e8f0', 
                    borderRadius: '12px',
                    fontWeight: 'bold'
                  }}
                  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
                />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-slate-400 dark:text-slate-500 py-12">Sem dados</p>
          )}
        </div>
      </div>
    </div>
  );
}