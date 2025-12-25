import React from 'react';
import { Filter, X } from 'lucide-react';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
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
    <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <Filter size={16} className="text-blue-600" /> Filtros Avançados
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <select
          value={filters.doctor}
          onChange={(e) => setFilters({ ...filters, doctor: e.target.value })}
          className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="TODOS">Todos Médicos</option>
          {doctors.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>

        <select
          value={filters.hospital}
          onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}
          className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="TODOS">Todos Hospitais</option>
          {hospitals.map(h => (
            <option key={h.id} value={h.name}>{h.name}</option>
          ))}
        </select>

        <select
          value={filters.specialty}
          onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
          className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="TODAS">Todas Especialidades</option>
          {specialties.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={filters.paid}
          onChange={(e) => setFilters({ ...filters, paid: e.target.value })}
          className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="TODOS">Todos Status</option>
          <option value="PAGO">Apenas Pagos</option>
          <option value="PENDENTE">Apenas Pendentes</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          placeholder="Data Início"
          className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          placeholder="Data Fim"
          className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold border-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
    </div>
  );
}