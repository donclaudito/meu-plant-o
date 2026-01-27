import React from 'react';
import { Filter, X } from 'lucide-react';

const specialties = [
  'CIRURGIA GERAL', 'CLÍNICA MÉDICA', 'PEDIATRIA', 
  'GINECOLOGIA', 'ORTOPEDIA', 'ANESTESIA', 'OUTRA'
];

export default function ReportFilters({ filters, setFilters, doctors, hospitals }) {
  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const clearFilters = () => {
    setFilters({
      month: '',
      doctorName: '',
      unit: '',
      specialty: '',
      type: ''
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Filter size={24} className="text-blue-600 dark:text-blue-400" />
          Filtros de Análise
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <X size={16} /> Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
            Mês
          </label>
          <input
            type="month"
            value={filters.month}
            onChange={(e) => setFilters({...filters, month: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
            Médico
          </label>
          <select
            value={filters.doctorName}
            onChange={(e) => setFilters({...filters, doctorName: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
            Hospital
          </label>
          <select
            value={filters.unit}
            onChange={(e) => setFilters({...filters, unit: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
            Especialidade
          </label>
          <select
            value={filters.specialty}
            onChange={(e) => setFilters({...filters, specialty: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          >
            <option value="">Todas</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
            Tipo
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="12h Dia">12h Dia</option>
            <option value="12h Noite">12h Noite</option>
            <option value="24h">24h</option>
            <option value="6h Dia">6h Dia</option>
            <option value="6h Noite">6h Noite</option>
          </select>
        </div>
      </div>
    </div>
  );
}