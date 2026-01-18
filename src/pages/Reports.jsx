import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Printer, TrendingUp } from 'lucide-react';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportStats from '@/components/reports/ReportStats';
import DoctorPerformance from '@/components/reports/DoctorPerformance';

export default function Reports() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    doctorName: '',
    unit: '',
    specialty: '',
    type: ''
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Shift.list('-date');
      return all.filter(s => s.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list('name');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Hospital.list('name');
      return all.filter(h => h.created_by === user?.email);
    },
    enabled: !!user,
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (filters.startDate && shift.date < filters.startDate) return false;
      if (filters.endDate && shift.date > filters.endDate) return false;
      if (filters.doctorName && shift.doctorName !== filters.doctorName) return false;
      if (filters.unit && shift.unit !== filters.unit) return false;
      if (filters.specialty && shift.specialty !== filters.specialty) return false;
      if (filters.type && shift.type !== filters.type) return false;
      return true;
    });
  }, [shifts, filters]);

  const stats = useMemo(() => {
    const total = filteredShifts.reduce((sum, s) => sum + s.value, 0);
    const hours = filteredShifts.reduce((sum, s) => sum + s.hours, 0);
    const paid = filteredShifts.filter(s => s.paid).reduce((sum, s) => sum + s.value, 0);
    const pending = total - paid;
    const avgValue = filteredShifts.length > 0 ? total / filteredShifts.length : 0;
    const hourlyRate = hours > 0 ? total / hours : 0;

    const byType = filteredShifts.reduce((acc, s) => {
      if (!acc[s.type]) acc[s.type] = { count: 0, total: 0, hours: 0 };
      acc[s.type].count++;
      acc[s.type].total += s.value;
      acc[s.type].hours += s.hours;
      return acc;
    }, {});

    const byUnit = filteredShifts.reduce((acc, s) => {
      if (!acc[s.unit]) acc[s.unit] = { count: 0, total: 0, hours: 0 };
      acc[s.unit].count++;
      acc[s.unit].total += s.value;
      acc[s.unit].hours += s.hours;
      return acc;
    }, {});

    const byDoctor = filteredShifts.reduce((acc, s) => {
      if (!acc[s.doctorName]) acc[s.doctorName] = { 
        count: 0, 
        total: 0, 
        hours: 0, 
        paid: 0, 
        pending: 0,
        specialty: s.specialty 
      };
      acc[s.doctorName].count++;
      acc[s.doctorName].total += s.value;
      acc[s.doctorName].hours += s.hours;
      if (s.paid) acc[s.doctorName].paid += s.value;
      else acc[s.doctorName].pending += s.value;
      return acc;
    }, {});

    return {
      total,
      hours,
      paid,
      pending,
      avgValue,
      hourlyRate,
      count: filteredShifts.length,
      byType,
      byUnit,
      byDoctor
    };
  }, [filteredShifts]);

  const exportToCSV = () => {
    const header = 'Data,Hospital,Médico,Especialidade,Tipo,Horas,Valor (R$),Pago\n';
    const rows = filteredShifts.map(s => 
      `${s.date},${s.unit},${s.doctorName},${s.specialty},${s.type},${s.hours},${s.value},${s.paid ? 'Sim' : 'Não'}`
    ).join('\n');
    
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_plantoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const printReport = () => {
    const printWindow = window.open('', '_blank');
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Plantões - Meu Plantão</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #2563eb; margin-bottom: 10px; }
          .date { color: #64748b; font-size: 14px; margin-bottom: 30px; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: #f1f5f9; padding: 20px; border-radius: 12px; }
          .stat-label { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0f172a; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
          th { background: #f8fafc; font-weight: bold; color: #475569; font-size: 12px; text-transform: uppercase; }
          .section { margin-top: 40px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1e293b; }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📊 Relatório de Plantões</h1>
        <div class="date">Gerado em ${new Date().toLocaleDateString('pt-PT')} às ${new Date().toLocaleTimeString('pt-PT')}</div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total de Plantões</div>
            <div class="stat-value">${stats.count}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Horas Trabalhadas</div>
            <div class="stat-value">${stats.hours}h</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Receita Total</div>
            <div class="stat-value">R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valores Pagos</div>
            <div class="stat-value">R$ ${stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valores Pendentes</div>
            <div class="stat-value">R$ ${stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valor/Hora</div>
            <div class="stat-value">R$ ${stats.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Detalhes dos Plantões</div>
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
                  <td>${new Date(s.date).toLocaleDateString('pt-PT')}</td>
                  <td>${s.unit}</td>
                  <td>${s.doctorName}</td>
                  <td>${s.type}</td>
                  <td>${s.hours}h</td>
                  <td>R$ ${s.value.toLocaleString('pt-BR')}</td>
                  <td>${s.paid ? '✅ Pago' : '⏳ Pendente'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">👨‍⚕️ Desempenho por Médico</div>
          <table>
            <thead>
              <tr>
                <th>Médico</th>
                <th>Especialidade</th>
                <th>Plantões</th>
                <th>Horas</th>
                <th>Total</th>
                <th>Pago</th>
                <th>Pendente</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(stats.byDoctor).map(([name, data]) => `
                <tr>
                  <td>${name}</td>
                  <td>${data.specialty}</td>
                  <td>${data.count}</td>
                  <td>${data.hours}h</td>
                  <td>R$ ${data.total.toLocaleString('pt-BR')}</td>
                  <td>R$ ${data.paid.toLocaleString('pt-BR')}</td>
                  <td>R$ ${data.pending.toLocaleString('pt-BR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-8 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <FileText size={32} /> Relatórios Avançados
            </h1>
            <p className="text-blue-100 font-medium">
              Análise detalhada de plantões, desempenho e estatísticas
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              disabled={filteredShifts.length === 0}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <Download size={18} /> CSV
            </button>
            <button
              onClick={printReport}
              disabled={filteredShifts.length === 0}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>
        </div>
      </div>

      <ReportFilters 
        filters={filters} 
        setFilters={setFilters} 
        doctors={doctors}
        hospitals={hospitals}
      />

      <ReportStats stats={stats} />

      <DoctorPerformance stats={stats} />

      {filteredShifts.length === 0 && (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 text-center">
          <TrendingUp size={64} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Nenhum dado encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400">
            Ajuste os filtros ou adicione plantões para ver os relatórios
          </p>
        </div>
      )}
    </div>
  );
}