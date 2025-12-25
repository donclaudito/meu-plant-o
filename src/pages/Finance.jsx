import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, CheckCircle, Clock, PieChart, Download, Calculator, FileText, RefreshCw } from 'lucide-react';
import FinanceFilters from '@/components/finance/FinanceFilters';
import FinanceCharts from '@/components/finance/FinanceCharts';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Finance({ currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear() }) {
  const [filters, setFilters] = useState({
    doctor: 'TODOS',
    hospital: 'TODOS',
    specialty: 'TODAS',
    startDate: '',
    endDate: '',
    paid: 'TODOS'
  });
  const [isRecalculating, setIsRecalculating] = useState(false);
  const queryClient = useQueryClient();

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts'],
    queryFn: () => base44.entities.Shift.list('-date'),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.list('name'),
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.list('name'),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const d = new Date(s.date);
      
      // Date range filter
      if (filters.startDate && s.date < filters.startDate) return false;
      if (filters.endDate && s.date > filters.endDate) return false;
      
      // If no date range, filter by current month
      if (!filters.startDate && !filters.endDate) {
        if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return false;
      }
      
      // Other filters
      if (filters.doctor !== 'TODOS' && s.doctorName !== filters.doctor) return false;
      if (filters.hospital !== 'TODOS' && s.unit !== filters.hospital) return false;
      if (filters.specialty !== 'TODAS' && s.specialty !== filters.specialty) return false;
      if (filters.paid === 'PAGO' && !s.paid) return false;
      if (filters.paid === 'PENDENTE' && s.paid) return false;
      
      return true;
    });
  }, [shifts, currentMonth, currentYear, filters]);

  const stats = useMemo(() => {
    const total = filteredShifts.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const paid = filteredShifts.filter(s => s.paid).reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
    const hours = filteredShifts.reduce((acc, c) => acc + (Number(c.hours) || 0), 0);
    const valuePerHour = hours > 0 ? total / hours : 0;
    
    // Valores de referência das definições
    const hourlyRate = user?.hourlyRate || 150;
    const shift12hValue = user?.shift12hValue || 1800;
    const shift24hValue = user?.shift24hValue || 3000;
    
    // Breakdown por tipo
    const byType = filteredShifts.reduce((acc, shift) => {
      const type = shift.type || 'Outro';
      if (!acc[type]) {
        acc[type] = { count: 0, hours: 0, value: 0, expectedValue: 0 };
      }
      acc[type].count++;
      acc[type].hours += shift.hours || 0;
      acc[type].value += shift.value || 0;
      
      // Calcular valor esperado baseado nas definições
      if (shift.hours === 24) {
        acc[type].expectedValue += shift24hValue;
      } else if (shift.hours === 12) {
        acc[type].expectedValue += shift12hValue;
      } else {
        acc[type].expectedValue += hourlyRate * (shift.hours || 0);
      }
      return acc;
    }, {});
    
    // Calcular valor/hora esperado para cada tipo
    Object.keys(byType).forEach(key => {
      byType[key].expectedValuePerHour = byType[key].hours > 0 ? byType[key].expectedValue / byType[key].hours : 0;
      byType[key].actualValuePerHour = byType[key].hours > 0 ? byType[key].value / byType[key].hours : 0;
    });
    
    // Breakdown por duração (6h, 12h, 24h)
    const byDuration = filteredShifts.reduce((acc, shift) => {
      const hours = shift.hours || 0;
      const key = `${hours}h`;
      if (!acc[key]) {
        acc[key] = { count: 0, hours: 0, value: 0, avgValue: 0, expectedValue: 0 };
      }
      acc[key].count++;
      acc[key].hours += hours;
      acc[key].value += shift.value || 0;
      
      // Valor esperado por plantão baseado nas definições
      if (hours === 24) {
        acc[key].expectedValue += shift24hValue;
      } else if (hours === 12) {
        acc[key].expectedValue += shift12hValue;
      } else {
        acc[key].expectedValue += hourlyRate * hours;
      }
      return acc;
    }, {});
    
    // Calcular médias para cada duração
    Object.keys(byDuration).forEach(key => {
      byDuration[key].avgValue = byDuration[key].value / byDuration[key].count;
      byDuration[key].valuePerHour = byDuration[key].hours > 0 ? byDuration[key].value / byDuration[key].hours : 0;
      byDuration[key].expectedAvgValue = byDuration[key].expectedValue / byDuration[key].count;
      byDuration[key].expectedValuePerHour = byDuration[key].hours > 0 ? byDuration[key].expectedValue / byDuration[key].hours : 0;
    });
    
    // Valor médio geral esperado por hora (baseado nas definições)
    const totalExpectedValue = filteredShifts.reduce((acc, shift) => {
      if (shift.hours === 24) return acc + shift24hValue;
      if (shift.hours === 12) return acc + shift12hValue;
      return acc + (hourlyRate * (shift.hours || 0));
    }, 0);
    const expectedValuePerHour = hours > 0 ? totalExpectedValue / hours : 0;
    
    return { 
      total, 
      paid, 
      pending: total - paid, 
      hours, 
      count: filteredShifts.length, 
      valuePerHour, 
      expectedValuePerHour,
      byType, 
      byDuration 
    };
  }, [filteredShifts, user]);

  const monthlyData = useMemo(() => {
    const monthsData = {};
    shifts.forEach(s => {
      const date = new Date(s.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthsData[key]) {
        monthsData[key] = { month: monthLabel, total: 0, paid: 0, pending: 0 };
      }
      
      monthsData[key].total += s.value || 0;
      if (s.paid) {
        monthsData[key].paid += s.value || 0;
      } else {
        monthsData[key].pending += s.value || 0;
      }
    });
    
    return Object.values(monthsData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [shifts]);

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
    link.download = `relatorio_plantoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const recalculateValues = async () => {
    setIsRecalculating(true);
    try {
      const user = await base44.auth.me();
      const hourlyRate = user.hourlyRate || 150;
      const shift12hValue = user.shift12hValue || 1800;
      const shift24hValue = user.shift24hValue || 3000;

      const updates = filteredShifts.map(shift => {
        let newValue;
        if (shift.hours === 24) {
          newValue = shift24hValue;
        } else if (shift.hours === 12) {
          newValue = shift12hValue;
        } else {
          newValue = Math.round(hourlyRate * shift.hours);
        }
        
        return base44.entities.Shift.update(shift.id, { value: newValue });
      });

      await Promise.all(updates);
      queryClient.invalidateQueries(['shifts']);
    } catch (error) {
      console.error('Erro ao recalcular valores:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  const exportToPDF = async () => {
    const reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #1e293b; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
          .stat-card { background: #f1f5f9; padding: 20px; border-radius: 12px; }
          .stat-label { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .stat-value { font-size: 32px; font-weight: bold; color: #1e293b; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 30px; }
          th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-size: 12px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>Relatório Financeiro - Plantões</h1>
        <p><strong>Período:</strong> ${filters.startDate || 'Início'} até ${filters.endDate || 'Hoje'}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Faturamento Total</div>
            <div class="stat-value">R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valor Liquidado</div>
            <div class="stat-value">R$ ${stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valor Pendente</div>
            <div class="stat-value">R$ ${stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Horas</div>
            <div class="stat-value">${stats.hours}h</div>
          </div>
        </div>

        <h2>Detalhamento por Tipo de Plantão</h2>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Horas</th>
              <th>Valor Total</th>
              <th>Valor/Hora</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.byType).map(([type, data]) => `
              <tr>
                <td><strong>${type}</strong></td>
                <td>${data.count}</td>
                <td>${data.hours}h</td>
                <td>R$ ${data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>R$ ${(data.value / data.hours).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Lista Completa de Plantões</h2>
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Hospital</th>
              <th>Médico</th>
              <th>Tipo</th>
              <th>Horas</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredShifts.map(s => `
              <tr>
                <td>${new Date(s.date).toLocaleDateString('pt-BR')}</td>
                <td>${s.unit}</td>
                <td>${s.doctorName}</td>
                <td>${s.type}</td>
                <td>${s.hours}h</td>
                <td>R$ ${s.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                <td>${s.paid ? '✓ Pago' : '⏳ Pendente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Relatório gerado automaticamente por Meu Plantão</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url);
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          <Wallet className="text-blue-600" size={28} /> Resumo Financeiro
        </h2>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200">
          {filters.startDate || filters.endDate ? 'Período Personalizado' : `${monthNames[currentMonth]} ${currentYear}`}
        </div>
      </div>

      <FinanceFilters filters={filters} setFilters={setFilters} doctors={doctors} hospitals={hospitals} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={recalculateValues}
              disabled={isRecalculating}
              className="p-2 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50"
              title="Recalcular valores conforme definições"
            >
              <RefreshCw size={16} className={`text-blue-600 ${isRecalculating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Faturamento Total</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-slate-400 font-bold text-xl">R$</span>
            <p className="text-5xl font-black text-slate-900 tracking-tight">{stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase">
            <TrendingUp size={14}/> Baseado em {stats.count} plantões
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-green-500 uppercase tracking-[0.2em]">Valor Liquidado</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-200 font-bold text-xl">R$</span>
            <p className="text-5xl font-black text-green-600 tracking-tight">{stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-600 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Valores confirmados
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.2em]">Valor Pendente</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-amber-200 font-bold text-xl">R$</span>
            <p className="text-5xl font-black text-amber-600 tracking-tight">{stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black mb-6 flex items-center gap-2">
          <Calculator className="text-purple-600" /> Análise por Duração de Plantão
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Object.entries(stats.byDuration).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(([duration, data]) => (
            <div key={duration} className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-2xl border border-purple-100">
              <p className="text-xs font-black text-purple-600 uppercase tracking-wider mb-3">Plantões de {duration}</p>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold">Quantidade</p>
                  <p className="text-2xl font-black text-slate-900">{data.count} plantões</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Valor Real</p>
                    <p className="text-lg font-black text-green-600">
                      R$ {data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Valor Config</p>
                    <p className="text-lg font-black text-blue-600">
                      R$ {data.expectedAvgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">R$/h Real</p>
                    <p className="text-sm font-black text-green-600">
                      {data.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">R$/h Config</p>
                    <p className="text-sm font-black text-blue-600">
                      {data.expectedValuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t border-purple-200">
                  <p className="text-[10px] text-slate-500 font-bold">Total Faturado</p>
                  <p className="text-xl font-black text-purple-600">
                    R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-purple-600 p-6 rounded-2xl text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Valor Real por Hora</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">R$</span>
                <p className="text-4xl font-black tracking-tight">
                  {stats.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xl font-black">/h</span>
              </div>
              <p className="text-xs opacity-80 mt-2">Calculado dos plantões realizados</p>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Valor Config por Hora</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">R$</span>
                <p className="text-4xl font-black tracking-tight">
                  {stats.expectedValuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-xl font-black">/h</span>
              </div>
              <p className="text-xs opacity-80 mt-2">Baseado nas definições</p>
            </div>
          </div>
          <div className="text-center mt-4 pt-4 border-t border-white/20">
            <p className="text-xs font-bold opacity-80">Total: {stats.hours}h em {stats.count} plantões</p>
          </div>
        </div>
      </div>

      <FinanceCharts stats={stats} monthlyData={monthlyData} />

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black mb-6">Breakdown por Tipo de Plantão</h3>
        <div className="space-y-4">
          {Object.entries(stats.byType).map(([type, data]) => (
            <div key={type} className="p-5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-black text-slate-900 text-lg">{type}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {data.count} plantão{data.count !== 1 ? 'es' : ''} • {data.hours}h totais
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-2xl text-slate-900">
                    R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Valor/h Real</p>
                  <p className="text-sm font-black text-green-600">
                    R$ {data.actualValuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Valor/h Config</p>
                  <p className="text-sm font-black text-blue-600">
                    R$ {data.expectedValuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Diferença</p>
                  <p className={`text-sm font-black ${data.actualValuePerHour >= data.expectedValuePerHour ? 'text-green-600' : 'text-red-600'}`}>
                    {data.actualValuePerHour >= data.expectedValuePerHour ? '+' : ''}
                    {((data.actualValuePerHour - data.expectedValuePerHour) / data.expectedValuePerHour * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <Download size={16}/> Exportar CSV
        </button>
        <button
          onClick={exportToPDF}
          className="bg-red-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <FileText size={16}/> Exportar PDF
        </button>
      </div>
    </div>
  );
}