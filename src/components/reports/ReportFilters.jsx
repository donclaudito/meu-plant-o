import React from 'react';
import { Filter, X } from 'lucide-react';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

const shiftTypes = ["12h Dia", "12h Noite", "24h", "6h Dia", "6h Noite"];

export default function ReportFilters({ filters, setFilters, doctors, hospitals }) {
  const clearFilters = () => {
    setFilters({
      month: '',
      doctorName: '',
      unit: '',
      specialty: '',
      type: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-black dark:text-white flex items-center gap-1.5 sm:gap-2">
          <Filter size={18} className="sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Filtros de Pesquisa</span>
          <span className="sm:hidden">Filtros</span>
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg sm:rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-[10px] sm:text-xs font-bold"
          >
            <X size={12} className="sm:w-3.5 sm:h-3.5" /> Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Mês
          </label>
          <input
            type="month"
            value={filters.month}
            onChange={(e) => setFilters({ ...filters, month: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-lg sm:rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-xs sm:text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Médico
          </label>
          <select
            value={filters.doctorName}
            onChange={(e) => setFilters({ ...filters, doctorName: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg sm:rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-xs sm:text-sm"
          >
            <option value="">Todos os Médicos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Hospital
          </label>
          <select
            value={filters.unit}
            onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg sm:rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-xs sm:text-sm"
          >
            <option value="">Todos os Hospitais</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Especialidade
          </label>
          <select
            value={filters.specialty}
            onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg sm:rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-xs sm:text-sm"
          >
            <option value="">Todas as Especialidades</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[9px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Tipo de Plantão
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-lg sm:rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-xs sm:text-sm"
          >
            <option value="">Todos os Tipos</option>
            {shiftTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}