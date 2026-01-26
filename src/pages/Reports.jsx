import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Download, Printer, TrendingUp } from 'lucide-react';
import ReportFilters from '@/components/reports/ReportFilters';
import ReportStats from '@/components/reports/ReportStats';
import DoctorPerformance from '@/components/reports/DoctorPerformance';
import CustomReportBuilder from '@/components/reports/CustomReportBuilder';
import ComparativeCharts from '@/components/reports/ComparativeCharts';
import KPIDashboard from '@/components/reports/KPIDashboard';

export default function Reports() {
  const [filters, setFilters] = useState({
    month: '',
    doctorName: '',
    unit: '',
    specialty: '',
    type: ''
  });
  const queryClient = useQueryClient();

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

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Discount.list('-date');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: extraIncomes = [] } = useQuery({
    queryKey: ['extraIncomes', user?.email],
    queryFn: async () => {
      const all = await base44.entities.ExtraIncome.list('-date');
      return all.filter(i => i.created_by === user?.email);
    },
    enabled: !!user,
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (!shift || !shift.date) return false;
      
      if (filters.month) {
        const [filterYear, filterMonth] = filters.month.split('-').map(Number);
        const [year, month] = shift.date.split('-').map(Number);
        if (year !== filterYear || month !== filterMonth) {
          return false;
        }
      }
      
      if (filters.doctorName) {
        const normalizedFilterDoctor = filters.doctorName.trim().toUpperCase();
        const normalizedDoctorName = (shift.doctorName || '').trim().toUpperCase();
        if (normalizedDoctorName !== normalizedFilterDoctor) return false;
      }
      
      if (filters.unit && shift.unit !== filters.unit) return false;
      if (filters.specialty && shift.specialty !== filters.specialty) return false;
      if (filters.type && shift.type !== filters.type) return false;
      return true;
    });
  }, [shifts, filters]);

  const filteredExtraIncomes = useMemo(() => {
    return extraIncomes.filter(income => {
      if (!income || !income.date) return false;
      
      if (filters.month) {
        const [filterYear, filterMonth] = filters.month.split('-').map(Number);
        const [year, month] = income.date.split('-').map(Number);
        if (year !== filterYear || month !== filterMonth) {
          return false;
        }
      }
      return true;
    });
  }, [extraIncomes, filters]);

  const globalDiscounts = useMemo(() => {
    return discounts.filter(d => {
      if (!d || !d.date) return false;
      
      if (filters.month) {
        const [filterYear, filterMonth] = filters.month.split('-').map(Number);
        const [year, month] = d.date.split('-').map(Number);
        if (year !== filterYear || month !== filterMonth) {
          return false;
        }
      }
      return !d.type || d.type === '';
    });
  }, [discounts, filters]);

  const stats = useMemo(() => {
    const safeShifts = filteredShifts || [];
    const safeExtraIncome = filteredExtraIncomes.reduce((acc, income) => acc + (Number(income.value) || 0), 0);

    // Validar plantões e calcular total
    const validShifts = safeShifts.filter(
      (shift) => shift && typeof shift.hours === "number" && shift.hours > 0
    );
    
    const monthlyShiftsTotal = validShifts.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
    const safeDiscounts = globalDiscounts.reduce((acc, d) => {
      const isPercentage = d.isPercentage === true;
      if (isPercentage) {
        return acc + (monthlyShiftsTotal * (Number(d.value) || 0) / 100);
      }
      return acc + (Number(d.value) || 0);
    }, 0);

    const shift6hValue = Number(user?.shift6hValue) || 1000;
    const shift12hValue = Number(user?.shift12hValue) || 1800;
    const shift24hValue = Number(user?.shift24hValue) || 3000;
    const baseHourlyRate = Number(user?.hourlyRate) || 150;

    const hours = validShifts.reduce((acc, c) => acc + (Number(c.hours) || 0), 0);

    const totalByConfig = validShifts.reduce((acc, shift) => {
      const shiftHours = Number(shift.hours) || 0;
      const shiftValue = Number(shift.value) || 0;

      if (shiftValue > 0) return acc + shiftValue;
      if (shiftHours === 24) return acc + shift24hValue;
      if (shiftHours === 12) return acc + shift12hValue;
      if (shiftHours === 6) return acc + shift6hValue;
      return acc + baseHourlyRate * shiftHours;
    }, 0);

    const paid = validShifts.filter((s) => s.paid).reduce((acc, shift) => {
      const shiftValue = Number(shift.value) || 0;
      return acc + shiftValue;
    }, 0);

    const grossTotal = Number(totalByConfig) + Number(safeExtraIncome);
    const netTotal = Math.max(0, Number(grossTotal) - Number(safeDiscounts));
    const pending = Math.max(0, Number(totalByConfig) - Number(paid));
    const valuePerHour = hours > 0 ? Number(netTotal) / Number(hours) : 0;
    const avgValue = filteredShifts.length > 0 ? totalByConfig / filteredShifts.length : 0;
    const hourlyRate = valuePerHour;
    
    const count12h = validShifts.filter(
      (s) => s.type === "12h Dia" || s.type === "12h Noite"
    ).length;
    const count6h = validShifts.filter(
      (s) => s.type === "6h Dia" || s.type === "6h Noite"
    ).length;

    const byType = validShifts.reduce((acc, shift) => {
      let type = shift.type || "Outro";
      if (type === "12h Dia" || type === "12h Noite") {
        type = "12h";
      }
      if (!acc[type]) {
        acc[type] = { count: 0, hours: 0, total: 0 };
      }
      acc[type].count++;
      const shiftHours = Number(shift.hours) || 0;
      const shiftValue = Number(shift.value) || 0;
      acc[type].hours += shiftHours;
      if (shiftValue > 0) {
        acc[type].total += shiftValue;
      } else if (shiftHours === 24) {
        acc[type].total += shift24hValue;
      } else if (shiftHours === 12) {
        acc[type].total += shift12hValue;
      } else if (shiftHours === 6) {
        acc[type].total += shift6hValue;
      } else {
        acc[type].total += baseHourlyRate * shiftHours;
      }
      return acc;
    }, {});

    const byUnit = validShifts.reduce((acc, s) => {
      if (!acc[s.unit]) acc[s.unit] = { count: 0, total: 0, hours: 0 };
      acc[s.unit].count++;
      acc[s.unit].total += s.value;
      acc[s.unit].hours += s.hours;
      return acc;
    }, {});

    const byDoctor = validShifts.reduce((acc, s) => {
      if (!acc[s.doctorName])
        acc[s.doctorName] = {
          count: 0,
          total: 0,
          hours: 0,
          paid: 0,
          pending: 0,
          specialty: s.specialty,
        };
      acc[s.doctorName].count++;
      acc[s.doctorName].total += s.value;
      acc[s.doctorName].hours += s.hours;
      if (s.paid) acc[s.doctorName].paid += s.value;
      else acc[s.doctorName].pending += s.value;
      return acc;
    }, {});

    return {
      total: totalByConfig,
      grossTotal,
      totalExtraIncome: safeExtraIncome,
      netTotal,
      totalDiscounts: safeDiscounts,
      hours,
      paid,
      pending,
      avgValue,
      hourlyRate,
      count: validShifts.length,
      count12h,
      count6h,
      byType,
      byUnit,
      byDoctor,
    };
  }, [filteredShifts, filteredExtraIncomes, globalDiscounts, user]);

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
            <div class="stat-label">Plantões 12h</div>
            <div class="stat-value">${stats.count12h}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Plantões 6h</div>
            <div class="stat-value">${stats.count6h}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valores Pagos</div>
            <div class="stat-value">R$ ${stats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Valores Pendentes</div>
            <div class="stat-value">R$ ${stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
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
    <div className="space-y-4 md:space-y-5 lg:space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1 sm:mb-2 flex items-center gap-2 md:gap-3">
              <FileText size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8" /> Relatórios
            </h1>
            <p className="text-blue-100 font-medium text-xs sm:text-sm">
              Análise detalhada de plantões e estatísticas
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={exportToCSV}
              disabled={filteredShifts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-xs sm:text-sm"
            >
              <Download size={16} /> CSV
            </button>
            <button
              onClick={printReport}
              disabled={filteredShifts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm text-xs sm:text-sm"
            >
              <Printer size={16} /> Imprimir
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

      <KPIDashboard stats={stats} shifts={shifts} />

      <ComparativeCharts 
        shifts={shifts} 
        extraIncomes={extraIncomes} 
        discounts={discounts} 
      />

      <CustomReportBuilder 
        stats={stats} 
        shifts={filteredShifts}
        doctors={doctors}
        hospitals={hospitals}
      />

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