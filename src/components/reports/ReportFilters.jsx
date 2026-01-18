import React from 'react';
import { Filter, X } from 'lucide-react';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

const shiftTypes = ["12h Dia", "12h Noite", "24h", "6h Dia", "6h Noite"];

export default function ReportFilters({ filters, setFilters, doctors, hospitals }) {
  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      doctorName: '',
      unit: '',
      specialty: '',
      type: ''
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
          <Filter size={20} className="text-blue-600 dark:text-blue-400" />
          Filtros de Pesquisa
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-bold"
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Data Inicial
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Data Final
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Médico
          </label>
          <select
            value={filters.doctorName}
            onChange={(e) => setFilters({ ...filters, doctorName: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
          >
            <option value="">Todos os Médicos</option>
            {doctors.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Hospital
          </label>
          <select
            value={filters.unit}
            onChange={(e) => setFilters({ ...filters, unit: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
          >
            <option value="">Todos os Hospitais</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Especialidade
          </label>
          <select
            value={filters.specialty}
            onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
          >
            <option value="">Todas as Especialidades</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
            Tipo de Plantão
          </label>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-700 dark:text-white border-none rounded-xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
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