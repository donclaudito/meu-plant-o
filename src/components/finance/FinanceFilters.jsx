import React from 'react';
import { Filter, X } from 'lucide-react';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "GASTROENTEROLOGIA", "CIRURGIA DIGESTIVA", "OUTRA"
];

export default function FinanceFilters({ filters, setFilters, doctors, hospitals }) {
  const clearFilters = () => {
    setFilters({
      doctor: 'TODOS',
      hospital: 'TODOS',
      specialty: 'TODAS',
      startDate: '',
      endDate: '',
      paid: 'TODOS'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'TODOS' && v !== 'TODAS');

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Filter size={16} className="text-blue-600 dark:text-blue-400" /> Filtros Avançados
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <select
          value={filters.doctor}
          onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        >
          <option value="TODOS">Todos Médicos</option>
          {Array.from(new Set(doctors.map(d => {
            // NORMALIZAÇÃO: Unificar nomes variantes
            let name = d.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (name === 'lavosier') name = 'lavoisier';
            if (name === 'mario') name = 'mário';
            return name;
          }))).sort().map(normalizedName => {
            const titleCaseName = normalizedName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return <option key={normalizedName} value={titleCaseName}>{titleCaseName}</option>;
          })}
        </select>

        <select
          value={filters.hospital}
          onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        >
          <option value="TODOS">Todos Hospitais</option>
          {hospitals.map(h => (
            <option key={h.id} value={h.name}>{h.name}</option>
          ))}
        </select>

        <select
          value={filters.specialty}
          onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        >
          <option value="TODAS">Todas Especialidades</option>
          {specialties.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.paid}
          onChange={(e) => setFilters({ ...filters, paid: e.target.value })}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        >
          <option value="TODOS">Todos Status</option>
          <option value="PAGO">Apenas Pagos</option>
          <option value="PENDENTE">Apenas Pendentes</option>
        </select>

        <input
          type="month"
          value={filters.startDate ? filters.startDate.substring(0, 7) : ''}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value ? `${e.target.value}-01` : '' })}
          placeholder="Mês Início"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        />

        <input
          type="month"
          value={filters.endDate ? filters.endDate.substring(0, 7) : ''}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value ? `${e.target.value}-31` : '' })}
          placeholder="Mês Fim"
          className="px-3 py-2 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
        />
      </div>
    </div>
  );
}