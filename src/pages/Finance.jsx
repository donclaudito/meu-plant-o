import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Wallet, TrendingUp, CheckCircle, Clock, PieChart, Download } from 'lucide-react';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Finance({ currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear() }) {
  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-date'),
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [shifts, currentMonth, currentYear]);

  const stats = useMemo(() => {
    const total = filteredShifts.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const paid = filteredShifts.filter(s => s.paid).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const hours = filteredShifts.reduce((acc, c) => acc + (Number(c.hours) || 0), 0);
    return { total, paid, pending: total - paid, hours, count: filteredShifts.length };
  }, [filteredShifts]);

  const exportToCSV = () => {
    const headers = ['Data', 'Hospital', 'Médico', 'Especialidade', 'Tipo', 'Horas', 'Valor', 'Status'];
    const rows = filteredShifts.map(s => [
      s.date,
      s.unit,
      s.doctorName,
      s.specialty,
      s.type,
      s.hours,
      s.value,
      s.paid ? 'Pago' : 'Pendente'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantoes_${monthNames[currentMonth]}_${currentYear}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Wallet className="text-blue-600" size={28} /> Resumo Financeiro
        </h2>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200">
          {monthNames[currentMonth]} {currentYear}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Faturamento Total</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-slate-400 font-bold text-xl">€</span>
            <p className="text-5xl font-black text-slate-900 tracking-tight">{stats.total.toLocaleString('pt-PT')}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase">
            <TrendingUp size={14}/> Baseado em {stats.count} plantões
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-green-500 uppercase tracking-[0.2em]">Valor Liquidado</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-200 font-bold text-xl">€</span>
            <p className="text-5xl font-black text-green-600 tracking-tight">{stats.paid.toLocaleString('pt-PT')}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-600 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Valores confirmados
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">Valor Pendente</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-amber-200 font-bold text-xl">€</span>
            <p className="text-5xl font-black text-amber-600 tracking-tight">{stats.pending.toLocaleString('pt-PT')}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase">
            <Clock size={14}/> Aguardando pagamento
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-purple-500 uppercase tracking-[0.2em]">Carga Horária</p>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-5xl font-black text-purple-600 tracking-tight">{stats.hours}</p>
            <span className="text-purple-400 font-black text-2xl uppercase">H</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase">
            <PieChart size={14}/> Total de horas trabalhadas
          </div>
        </div>
      </div>

      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-blue-100 gap-4">
        <div>
          <h4 className="font-black text-lg">Pronto para exportar?</h4>
          <p className="text-blue-100 text-sm opacity-80">Gere um ficheiro CSV com todos os detalhes financeiros do mês.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="bg-white text-blue-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Download size={16}/> Descarregar CSV
        </button>
      </div>
    </div>
  );
}