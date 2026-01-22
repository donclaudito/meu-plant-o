import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, CheckCircle, Clock, PieChart, Download, Calculator, FileText, RefreshCw, MinusCircle, HandCoins, FileSpreadsheet, ArrowDown, ArrowUp } from 'lucide-react';
import FinanceFilters from '@/components/finance/FinanceFilters';
import FinanceCharts from '@/components/finance/FinanceCharts';
import DiscountsModule from '@/components/finance/DiscountsModule';
import ExtraIncomeModule from '@/components/finance/ExtraIncomeModule';
import DepositsModule from '@/components/finance/DepositsModule';
import ManualPaymentModal from '@/components/finance/ManualPaymentModal';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const isDateInActiveMonth = (dateString, month, year) => {
  if (!dateString) return false;
  
  // Normalizar a data independentemente do formato (AAAA-MM-DD ou DD-MM-AAAA)
  let parts = dateString.split('-');
  let dateYear, dateMonth, dateDay;
  
  if (parts[0].length === 4) {
    // Formato ISO: AAAA-MM-DD
    [dateYear, dateMonth, dateDay] = parts.map(Number);
  } else {
    // Formato comum: DD-MM-AAAA
    [dateDay, dateMonth, dateYear] = parts.map(Number);
  }
  
  return dateMonth === month + 1 && dateYear === year;
};

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', user?.email],
    queryFn: async () => {
      const allShifts = await base44.entities.Shift.list('-date');
      return allShifts.filter(s => s.created_by === user?.email);
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
    return shifts.filter(s => {
      // Date range filter
      if (filters.startDate && s.date < filters.startDate) return false;
      if (filters.endDate && s.date > filters.endDate) return false;
      
      // If no date range, filter by current month using robust validation
      if (!filters.startDate && !filters.endDate) {
        if (!isDateInActiveMonth(s.date, currentMonth, currentYear)) return false;
      }
      
      // Other filters
      if (filters.doctor !== 'TODOS') {
        const normalizedFilterDoctor = filters.doctor.trim().toUpperCase();
        const normalizedDoctorName = (s.doctorName || '').trim().toUpperCase();
        if (normalizedDoctorName !== normalizedFilterDoctor) return false;
      }
      if (filters.hospital !== 'TODOS' && s.unit !== filters.hospital) return false;
      if (filters.specialty !== 'TODAS' && s.specialty !== filters.specialty) return false;
      if (filters.paid === 'PAGO' && !s.paid) return false;
      if (filters.paid === 'PENDENTE' && s.paid) return false;
      
      return true;
    });
  }, [shifts, currentMonth, currentYear, filters]);

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

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Deposit.list('-date');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: manualPayments = [] } = useQuery({
    queryKey: ['manualPayments', user?.email],
    queryFn: async () => {
      const all = await base44.entities.ManualPayment.list('-date');
      return all.filter(p => p.created_by === user?.email);
    },
    enabled: !!user,
  });

  const createManualPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.ManualPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualPayments'] });
    },
  });

  const totalDiscounts = useMemo(() => {
    return discounts
      .filter(d => {
        if (filters.startDate && d.date < filters.startDate) return false;
        if (filters.endDate && d.date > filters.endDate) return false;
        if (!filters.startDate && !filters.endDate) {
          if (!isDateInActiveMonth(d.date, currentMonth, currentYear)) return false;
        }
        return true;
      })
      .reduce((acc, d) => acc + (Number(d.value) || 0), 0);
  }, [discounts, currentMonth, currentYear, filters]);

  const totalExtraIncome = useMemo(() => {
    return extraIncomes
      .filter(income => {
        if (filters.startDate && income.date < filters.startDate) return false;
        if (filters.endDate && income.date > filters.endDate) return false;
        if (!filters.startDate && !filters.endDate) {
          if (!isDateInActiveMonth(income.date, currentMonth, currentYear)) return false;
        }
        return true;
      })
      .reduce((acc, income) => acc + (Number(income.value) || 0), 0);
  }, [extraIncomes, currentMonth, currentYear, filters]);

  const totalDepositsAmount = useMemo(() => {
    return deposits
      .filter(deposit => {
        if (filters.startDate && deposit.date < filters.startDate) return false;
        if (filters.endDate && deposit.date > filters.endDate) return false;
        if (!filters.startDate && !filters.endDate) {
          if (!isDateInActiveMonth(deposit.date, currentMonth, currentYear)) return false;
        }
        return true;
      })
      .reduce((acc, deposit) => acc + (Number(deposit.value) || 0), 0);
  }, [deposits, currentMonth, currentYear, filters]);

  const totalManualPayments = useMemo(() => {
    return manualPayments
      .filter(payment => {
        if (filters.startDate && payment.date < filters.startDate) return false;
        if (filters.endDate && payment.date > filters.endDate) return false;
        if (!filters.startDate && !filters.endDate) {
          if (!isDateInActiveMonth(payment.date, currentMonth, currentYear)) return false;
        }
        return true;
      })
      .reduce((acc, payment) => acc + (Number(payment.value) || 0), 0);
  }, [manualPayments, currentMonth, currentYear, filters]);

  const stats = useMemo(() => {
    // Proteção defensiva contra dados inválidos
    const safeShifts = filteredShifts || [];
    const safeExtraIncome = Number(totalExtraIncome) || 0;
    const safeDiscounts = Number(totalDiscounts) || 0;
    const safeDeposits = Number(totalDepositsAmount) || 0;
    const safeManualPayments = Number(totalManualPayments) || 0;
    
    if (safeShifts.length === 0) {
      return {
        total: 0,
        grossTotal: safeExtraIncome,
        totalExtraIncome: safeExtraIncome,
        netTotal: safeExtraIncome - safeDiscounts,
        totalDiscounts: safeDiscounts,
        totalDepositsAmount: safeDeposits,
        totalManualPayments: safeManualPayments,
        paid: 0,
        pending: 0,
        hours: 0,
        count: 0,
        valuePerHour: 0,
        byType: {},
        byDuration: {}
      };
    }

    // Valores de referência das definições com proteção defensiva
    const shift12hValue = Number(user?.shift12hValue) || 1800;
    const shift24hValue = Number(user?.shift24hValue) || 3000;
    const calculatedHourlyRate = shift12hValue / 12;
    
    // Proteção contra valores inválidos nos plantões
    const validShifts = safeShifts.filter(shift => 
      shift && 
      typeof shift.hours === 'number' && 
      shift.hours > 0
    );
    
    // Calcular horas e valores baseados nas configurações
    const hours = validShifts.reduce((acc, c) => acc + (Number(c.hours) || 0), 0);
    
    const totalByConfig = validShifts.reduce((acc, shift) => {
      try {
        const shiftHours = Number(shift.hours) || 0;
        const shiftValue = Number(shift.value) || 0;

        // Usa o valor configurado se disponível, senão calcula
        if (shiftValue > 0) return acc + shiftValue;
        if (shiftHours === 24) return acc + shift24hValue;
        if (shiftHours === 12) return acc + shift12hValue;
        return acc + (calculatedHourlyRate * shiftHours);
      } catch (error) {
        console.error('Erro ao calcular valor do plantão:', error);
        return acc;
      }
    }, 0);

    const paid = validShifts.filter(s => s.paid).reduce((acc, shift) => {
      try {
        const shiftValue = Number(shift.value) || 0;
        return acc + shiftValue;
      } catch (error) {
        console.error('Erro ao calcular valor pago:', error);
        return acc;
      }
    }, 0);

    const grossTotal = Number(totalByConfig) + Number(safeExtraIncome);
    const netTotal = Math.max(0, Number(grossTotal) - Number(safeDiscounts));
    const pending = Math.max(0, Number(totalByConfig) - Number(paid) - Number(safeManualPayments));
    const valuePerHour = hours > 0 ? (Number(netTotal) / Number(hours)) : 0;
    
    // Breakdown por tipo - consolidando 12h Dia e 12h Noite
    const byType = validShifts.reduce((acc, shift) => {
      try {
        let type = shift.type || 'Outro';

        // Consolidar 12h Dia e 12h Noite em "12h"
        if (type === '12h Dia' || type === '12h Noite') {
          type = '12h';
        }

        if (!acc[type]) {
          acc[type] = { count: 0, hours: 0, value: 0 };
        }
        acc[type].count++;
        const shiftHours = Number(shift.hours) || 0;
        const shiftValue = Number(shift.value) || 0;
        acc[type].hours += shiftHours;

        // Usar o valor do plantão se disponível, senão calcular
        if (shiftValue > 0) {
          acc[type].value += shiftValue;
        } else if (shiftHours === 24) {
          acc[type].value += shift24hValue;
        } else if (shiftHours === 12) {
          acc[type].value += shift12hValue;
        } else {
          acc[type].value += calculatedHourlyRate * shiftHours;
        }
        return acc;
      } catch (error) {
        console.error('Erro ao processar tipo de plantão:', error);
        return acc;
      }
    }, {});
    
    // Calcular valor/hora para cada tipo
    Object.keys(byType).forEach(key => {
      byType[key].valuePerHour = byType[key].hours > 0 ? byType[key].value / byType[key].hours : 0;
    });
    
    // Breakdown por duração (6h, 12h, 24h)
    const byDuration = validShifts.reduce((acc, shift) => {
      try {
        const hours = Number(shift.hours) || 0;
        const shiftValue = Number(shift.value) || 0;
        const key = `${hours}h`;
        if (!acc[key]) {
          acc[key] = { count: 0, hours: 0, value: 0, avgValue: 0 };
        }
        acc[key].count++;
        acc[key].hours += hours;

        // Usar o valor do plantão se disponível, senão calcular
        if (shiftValue > 0) {
          acc[key].value += shiftValue;
        } else if (hours === 24) {
          acc[key].value += shift24hValue;
        } else if (hours === 12) {
          acc[key].value += shift12hValue;
        } else {
          acc[key].value += calculatedHourlyRate * hours;
        }
        return acc;
      } catch (error) {
        console.error('Erro ao processar duração do plantão:', error);
        return acc;
      }
    }, {});
    
    // Calcular médias para cada duração
    Object.keys(byDuration).forEach(key => {
      byDuration[key].avgValue = byDuration[key].value / byDuration[key].count;
      byDuration[key].valuePerHour = byDuration[key].hours > 0 ? byDuration[key].value / byDuration[key].hours : 0;
    });
    
    return { 
      total: Number(totalByConfig) || 0,
      grossTotal: Number(grossTotal) || 0,
      totalExtraIncome: safeExtraIncome,
      netTotal: Number(netTotal) || 0,
      totalDiscounts: safeDiscounts,
      totalDepositsAmount: safeDeposits,
      totalManualPayments: safeManualPayments,
      paid: Number(paid) || 0, 
      pending: Number(pending) || 0, 
      hours: Number(hours) || 0, 
      count: validShifts.length, 
      valuePerHour: Number(valuePerHour) || 0,
      byType, 
      byDuration 
    };
  }, [filteredShifts, user, totalDiscounts, totalExtraIncome, totalDepositsAmount, totalManualPayments]);

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

  const exportToXLSX = () => {
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

    // Criar arquivo XLSX simples (Excel 2007+)
    const worksheetData = [headers, ...rows];
    const maxColWidths = headers.map((_, idx) => 
      Math.max(...worksheetData.map(row => String(row[idx] || '').length)) + 2
    );

    let xlsxContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xlsxContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
    xlsxContent += '<Styles>\n';
    xlsxContent += '<Style ss:ID="Header" ss:Name="header"><Interior ss:Color="#3B82F6" ss:Pattern="Solid"/><Font ss:Bold="1" ss:Color="#FFFFFF"/></Style>\n';
    xlsxContent += '</Styles>\n';
    xlsxContent += '<Worksheet ss:Name="Plantões">\n';
    xlsxContent += '<Table>\n';
    
    // Header
    xlsxContent += '<Row>\n';
    headers.forEach(header => {
      xlsxContent += `<Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>\n`;
    });
    xlsxContent += '</Row>\n';

    // Data rows
    rows.forEach(row => {
      xlsxContent += '<Row>\n';
      row.forEach(cell => {
        const cellType = typeof cell === 'number' ? 'Number' : 'String';
        xlsxContent += `<Cell><Data ss:Type="${cellType}">${cell}</Data></Cell>\n`;
      });
      xlsxContent += '</Row>\n';
    });

    xlsxContent += '</Table>\n';
    xlsxContent += '</Worksheet>\n';
    xlsxContent += '</Workbook>\n';

    const blob = new Blob([xlsxContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
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
          h2 { color: #1e293b; margin-top: 30px; font-size: 18px; }
          .header-section { background: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 30px 0; }
          .summary-card { background: #f1f5f9; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; }
          .summary-label { font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #1e293b; margin-top: 5px; }
          .payment-summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
          .payment-card { padding: 15px; border-radius: 8px; }
          .paid-card { background: #dcfce7; border: 2px solid #22c55e; }
          .pending-card { background: #fef3c7; border: 2px solid #f59e0b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-size: 11px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 11px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="header-section">
          <h1 style="margin: 0 0 15px 0;">Relatório Financeiro Detalhado - Plantões</h1>
          <p style="margin: 5px 0;"><strong>Período:</strong> ${filters.startDate ? new Date(filters.startDate).toLocaleDateString('pt-PT') : 'Início'} até ${filters.endDate ? new Date(filters.endDate).toLocaleDateString('pt-PT') : new Date().toLocaleDateString('pt-PT')}</p>
          <p style="margin: 5px 0;"><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-PT')}</p>
          ${filters.doctor !== 'TODOS' ? `<p style="margin: 5px 0;"><strong>Filtro Médico:</strong> ${filters.doctor}</p>` : ''}
          ${filters.hospital !== 'TODOS' ? `<p style="margin: 5px 0;"><strong>Filtro Hospital:</strong> ${filters.hospital}</p>` : ''}
        </div>

        <h2>Resumo Financeiro</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-label">Faturamento Bruto</div>
            <div class="summary-value">€ ${stats.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Receitas Extras</div>
            <div class="summary-value">€ ${stats.totalExtraIncome.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Total Bruto</div>
            <div class="summary-value">€ ${stats.grossTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Descontos</div>
            <div class="summary-value">€ ${stats.totalDiscounts.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <h2>Status de Pagamentos</h2>
        <div class="payment-summary">
          <div class="payment-card paid-card">
            <div class="summary-label" style="color: #166534;">Valor Liquidado</div>
            <div style="font-size: 28px; font-weight: bold; color: #16a34a; margin-top: 8px;">€ ${stats.paid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 12px; color: #166534; margin-top: 5px;">${filteredShifts.filter(s => s.paid).length} plantões pagos</div>
          </div>
          <div class="payment-card pending-card">
            <div class="summary-label" style="color: #92400e;">Valor Pendente</div>
            <div style="font-size: 28px; font-weight: bold; color: #d97706; margin-top: 8px;">€ ${stats.pending.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
            <div style="font-size: 12px; color: #92400e; margin-top: 5px;">${filteredShifts.filter(s => !s.paid).length} plantões pendentes</div>
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
                <td>€ ${data.value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                <td>€ ${(data.value / data.hours).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
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
                <td>${new Date(s.date + 'T00:00:00').toLocaleDateString('pt-PT')}</td>
                <td>${s.unit}</td>
                <td>${s.doctorName}</td>
                <td>${s.type}</td>
                <td>${s.hours}h</td>
                <td>€ ${s.value.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">A carregar dados financeiros...</p>
          <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">Por favor aguarde...</p>
        </div>
      </div>
    );
  }

  // Proteção adicional contra renderização com dados inválidos
  const safeStats = stats || {
    total: 0, grossTotal: 0, totalExtraIncome: 0, netTotal: 0,
    totalDiscounts: 0, totalDepositsAmount: 0, totalManualPayments: 0,
    paid: 0, pending: 0, hours: 0, count: 0, valuePerHour: 0,
    byType: {}, byDuration: {}
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-4">
         <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
           <Wallet className="text-blue-600 dark:text-blue-400" size={28} /> Resumo Financeiro
         </h2>
         <div className="flex items-center gap-2 flex-wrap">
           <button
             onClick={exportToCSV}
             className="flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-lg"
           >
             <FileSpreadsheet size={18} /> CSV
           </button>
           <button
             onClick={exportToXLSX}
             className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
           >
             <Download size={18} /> Excel
           </button>
           <button
             onClick={exportToPDF}
             className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-lg"
           >
             <FileText size={18} /> PDF
           </button>
           <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
             {filters.startDate || filters.endDate ? 'Período Personalizado' : `${monthNames[currentMonth]} ${currentYear}`}
           </div>
         </div>
       </div>

      <FinanceFilters filters={filters} setFilters={setFilters} doctors={doctors} hospitals={hospitals} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={recalculateValues}
              disabled={isRecalculating}
              className="p-2 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              title="Recalcular valores conforme definições"
            >
              <RefreshCw size={16} className={`text-blue-600 dark:text-blue-400 ${isRecalculating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Plantões</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-slate-400 dark:text-slate-500 font-bold text-xl">€</span>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{safeStats.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
            <TrendingUp size={14}/> {safeStats.count} plantões
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-green-100 dark:border-green-900/30 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">Receitas Extras</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-300 font-bold text-xl">€</span>
            <p className="text-4xl font-black text-green-700 dark:text-green-400 tracking-tight">{safeStats.totalExtraIncome.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-700 dark:text-green-400 text-[10px] font-black uppercase">
            <TrendingUp size={14}/> Ambulatório, Cirurgia, Bónus
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 p-8 rounded-[2.5rem] border-2 border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-[0.2em]">Faturamento Bruto Total</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-indigo-400 font-bold text-xl">€</span>
            <p className="text-4xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight">{safeStats.grossTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Plantões + Extras
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.2em]">Descontos</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-red-200 font-bold text-xl">€</span>
            <p className="text-4xl font-black text-red-600 dark:text-red-400 tracking-tight">{safeStats.totalDiscounts.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-black uppercase">
            <MinusCircle size={14}/> Deduzido
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-8 rounded-[2.5rem] border-2 border-green-200 dark:border-green-800 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-green-700 dark:text-green-400 uppercase tracking-[0.2em]">Líquido Total</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-400 font-bold text-xl">€</span>
            <p className="text-4xl font-black text-green-700 dark:text-green-300 tracking-tight">{safeStats.netTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-700 dark:text-green-400 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Após descontos
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-green-500 dark:text-green-400 uppercase tracking-[0.2em]">Valor Liquidado</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-200 font-bold text-xl">€</span>
            <p className="text-5xl font-black text-green-600 dark:text-green-400 tracking-tight">{safeStats.paid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-600 dark:text-green-400 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Valores confirmados
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-xl transition-colors"
              title="Registar pagamento recebido"
            >
              <HandCoins size={16} className="text-green-600 dark:text-green-400" />
            </button>
          </div>
          <p className="text-[11px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-[0.2em]">Valor Pendente</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-amber-200 font-bold text-xl">€</span>
            <p className="text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tight">{safeStats.pending.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase">
            <ArrowDown size={14}/> Aguardando recebimento
          </div>
          {safeStats.totalManualPayments > 0 && (
            <div className="mt-2 text-[9px] text-green-600 dark:text-green-400 font-bold">
              Abatido: € {safeStats.totalManualPayments.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-[0.2em]">Carga Horária</p>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-5xl font-black text-purple-600 dark:text-purple-400 tracking-tight">{safeStats.hours}</p>
            <span className="text-purple-400 font-black text-2xl uppercase">H</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">
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
                <div>
                  <p className="text-[10px] text-slate-500 font-bold">Valor Médio</p>
                  <p className="text-lg font-black text-green-600">
                    R$ {data.avgValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-bold">Valor/Hora</p>
                  <p className="text-lg font-black text-blue-600">
                    R$ {data.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h
                  </p>
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
        <div className="bg-purple-600 p-6 rounded-2xl text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">Valor Médio Geral por Hora</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">R$</span>
              <p className="text-5xl font-black tracking-tight">
                {stats.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-2xl font-black">/h</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold opacity-80">Baseado em</p>
            <p className="text-2xl font-black">{stats.hours}h</p>
            <p className="text-xs font-bold opacity-80 mt-1">{stats.count} plantões</p>
          </div>
        </div>
      </div>

      <FinanceCharts stats={stats} monthlyData={monthlyData} />

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h3 className="text-xl font-black mb-6">Breakdown por Tipo de Plantão</h3>
        <div className="space-y-4">
          {Object.entries(stats.byType).map(([type, data]) => (
            <div key={type} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
              <div>
                <p className="font-black text-slate-900">{type}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {data.count} plantão{data.count !== 1 ? 'es' : ''} • {data.hours}h totais
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-lg text-slate-900">
                  R$ {data.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-500">
                  R$ {data.valuePerHour.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/h
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DiscountsModule 
          currentMonth={currentMonth} 
          currentYear={currentYear}
          discountTypes={user?.discountTypes || []}
        />
        <ExtraIncomeModule 
          currentMonth={currentMonth}
          currentYear={currentYear}
          showToast={(msg) => {}}
        />
      </div>

      <DepositsModule 
        currentMonth={currentMonth}
        currentYear={currentYear}
        showToast={(msg) => {}}
      />

      <ManualPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={(data) => createManualPaymentMutation.mutate(data)}
      />

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black mb-6">Resumo de Pagamentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border-2 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">Valor Liquidado</p>
              <ArrowUp size={18} className="text-green-600" />
            </div>
            <p className="text-4xl font-black text-green-700 dark:text-green-300 mb-2">€ {safeStats.paid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            <div className="text-xs text-green-700 dark:text-green-400 font-bold">
              {filteredShifts.filter(s => s.paid).length} plantão{filteredShifts.filter(s => s.paid).length !== 1 ? 'es' : ''} pagos
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-6 rounded-2xl border-2 border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Valor Pendente</p>
              <ArrowDown size={18} className="text-amber-600" />
            </div>
            <p className="text-4xl font-black text-amber-700 dark:text-amber-300 mb-2">€ {safeStats.pending.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">
              {filteredShifts.filter(s => !s.paid).length} plantão{filteredShifts.filter(s => !s.paid).length !== 1 ? 'es' : ''} pendentes
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Taxa de Liquidação</p>
              <CheckCircle size={18} className="text-blue-600" />
            </div>
            <p className="text-4xl font-black text-blue-700 dark:text-blue-300 mb-2">
              {filteredShifts.length > 0 ? Math.round((filteredShifts.filter(s => s.paid).length / filteredShifts.length) * 100) : 0}%
            </p>
            <div className="text-xs text-blue-700 dark:text-blue-400 font-bold">
              Dos plantões registados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}