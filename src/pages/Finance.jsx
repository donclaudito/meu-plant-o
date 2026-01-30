import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, CheckCircle, Clock, PieChart, Download, Calculator, FileText, RefreshCw, MinusCircle, HandCoins, FileSpreadsheet, ArrowDown, ArrowUp, Sparkles } from 'lucide-react';
import FinanceFilters from '@/components/finance/FinanceFilters';
import ExtraIncomeModule from '@/components/finance/ExtraIncomeModule';
import DepositsModule from '@/components/finance/DepositsModule';
import ManualPaymentModal from '@/components/finance/ManualPaymentModal';
import PixImportModal from '@/components/finance/PixImportModal';
import PaymentReceipt from '@/components/finance/PaymentReceipt';
import DoctorPayslip from '@/components/finance/DoctorPayslip';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const isDateInActiveMonth = (dateString, month, year) => {
  if (!dateString || typeof dateString !== 'string') return false;
  
  try {
    // Normalizar a data independentemente do formato (AAAA-MM-DD ou DD-MM-AAAA)
    let parts = dateString.split('-');
    if (parts.length < 2) return false;
    
    let dateYear, dateMonth;
    
    if (parts[0].length === 4) {
      // Formato ISO: AAAA-MM-DD ou AAAA-MM
      [dateYear, dateMonth] = parts.map(Number);
    } else {
      // Formato comum: DD-MM-AAAA
      [, dateMonth, dateYear] = parts.map(Number);
    }
    
    return dateMonth === month + 1 && dateYear === year;
  } catch (e) {
    console.error('Erro ao validar data:', dateString, e);
    return false;
  }
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
  const [showPixModal, setShowPixModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' or 'paid'
  const [showShiftsList, setShowShiftsList] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
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
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list('name');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Hospital.list('name');
      return all.filter(h => h.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 60,
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      if (!s.date || typeof s.date !== 'string') return false;
      
      // FILTRO CIRÚRGICO POR STRING - Prioridade máxima
      if (filters.startDate || filters.endDate) {
        // Se houver filtro de data personalizado, extrair ano-mês
        if (filters.startDate) {
          const targetMonth = filters.startDate.substring(0, 7); // AAAA-MM
          if (!s.date.startsWith(targetMonth)) return false;
        }
        if (filters.endDate) {
          const targetMonth = filters.endDate.substring(0, 7); // AAAA-MM
          if (!s.date.startsWith(targetMonth)) return false;
        }
      } else {
        // Se não houver filtro personalizado, usar mês/ano atual
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const datePattern = `${yearStr}-${monthStr}-`;
        
        // Verificação rigorosa: a data DEVE começar com AAAA-MM-
        if (!s.date.startsWith(datePattern)) return false;
      }
      
      // Other filters - case insensitive
      if (filters.doctor !== 'TODOS') {
        const normalizedFilterDoctor = filters.doctor.trim().toUpperCase();
        const normalizedDoctorName = (s.doctorName || '').trim().toUpperCase();
        if (normalizedDoctorName !== normalizedFilterDoctor) return false;
      }
      if (filters.hospital !== 'TODOS' && (s.unit || '').toUpperCase() !== filters.hospital.toUpperCase()) return false;
      if (filters.specialty !== 'TODAS' && (s.specialty || '').toUpperCase() !== filters.specialty.toUpperCase()) return false;
      if (filters.paid === 'PAGO' && !s.paid) return false;
      if (filters.paid === 'PENDENTE' && s.paid) return false;
      
      return true;
    });
  }, [shifts, currentMonth, currentYear, filters]);

  const addDoctorPrefix = (name) => {
    if (!name || name === 'TODOS') return name;
    // Se já tem Dr. ou Dra., não adiciona novamente
    if (name.toUpperCase().startsWith('DR.') || name.toUpperCase().startsWith('DRA.')) return name;
    // Por padrão, usar "Dr."
    return `Dr. ${name}`;
  };

  const handleApprove = () => {
    if (password === '58120') {
      setIsApproved(true);
      setShowPasswordModal(false);
      setPassword('');
    } else {
      alert('Senha incorreta!');
      setPassword('');
    }
  };

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Discount.list('-date');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    cacheTime: 1000 * 60 * 20,
  });

  const { data: extraIncomes = [] } = useQuery({
    queryKey: ['extraIncomes', user?.email],
    queryFn: async () => {
      const all = await base44.entities.ExtraIncome.list('-date');
      return all.filter(i => i.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Deposit.list('-date');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const { data: manualPayments = [] } = useQuery({
    queryKey: ['manualPayments', user?.email],
    queryFn: async () => {
      const all = await base44.entities.ManualPayment.list('-date');
      return all.filter(p => p.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  const createManualPaymentMutation = useMutation({
    mutationFn: (data) => base44.entities.ManualPayment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualPayments'] });
    },
  });

  // Descontos globais (sem tipo específico)
  const globalDiscounts = useMemo(() => {
    return discounts.filter(d => !d.type || d.type === '');
  }, [discounts]);

  const totalDiscounts = useMemo(() => {
    // Calcular o total bruto usando grossValue ou value
    const monthlyShiftsTotal = filteredShifts.reduce((acc, s) => acc + (Number(s.grossValue || s.value) || 0), 0);
    
    // Aplicar descontos globais (fixos e percentuais)
    return globalDiscounts.reduce((acc, d) => {
      const isPercentage = d.isPercentage === true;
      if (isPercentage) {
        return acc + (monthlyShiftsTotal * (Number(d.value) || 0) / 100);
      }
      return acc + (Number(d.value) || 0);
    }, 0);
  }, [globalDiscounts, filteredShifts]);

  const totalExtraIncome = useMemo(() => {
    const filtered = extraIncomes.filter(income => {
      if (!income.date || typeof income.date !== 'string') return false;
      
      // FILTRO CIRÚRGICO POR STRING
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          const targetMonth = filters.startDate.substring(0, 7);
          if (!income.date.startsWith(targetMonth)) return false;
        }
        if (filters.endDate) {
          const targetMonth = filters.endDate.substring(0, 7);
          if (!income.date.startsWith(targetMonth)) return false;
        }
      } else {
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const datePattern = `${yearStr}-${monthStr}-`;
        if (!income.date.startsWith(datePattern)) return false;
      }
      
      // FILTRO RIGOROSO: Filtrar SEMPRE por médico quando não for TODOS
      if (filters.doctor && filters.doctor !== 'TODOS') {
        const normalizedFilterDoctor = filters.doctor.trim().toUpperCase().replace(/^DR\.\s*/i, '').replace(/^DRA\.\s*/i, '');
        const normalizedIncomeName = (income.doctorName || '').trim().toUpperCase().replace(/^DR\.\s*/i, '').replace(/^DRA\.\s*/i, '');
        if (normalizedIncomeName !== normalizedFilterDoctor) return false;
      }
      
      return true;
    });
    
    return filtered.reduce((acc, income) => acc + (Number(income.value) || 0), 0);
  }, [extraIncomes, currentMonth, currentYear, filters]);

  const filteredExtraIncomes = useMemo(() => {
    return extraIncomes.filter(income => {
      if (!income.date || typeof income.date !== 'string') return false;
      
      // FILTRO CIRÚRGICO POR STRING
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          const targetMonth = filters.startDate.substring(0, 7);
          if (!income.date.startsWith(targetMonth)) return false;
        }
        if (filters.endDate) {
          const targetMonth = filters.endDate.substring(0, 7);
          if (!income.date.startsWith(targetMonth)) return false;
        }
      } else {
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const datePattern = `${yearStr}-${monthStr}-`;
        if (!income.date.startsWith(datePattern)) return false;
      }
      
      // FILTRO RIGOROSO por médico
      if (filters.doctor && filters.doctor !== 'TODOS') {
        const normalizedFilterDoctor = filters.doctor.trim().toUpperCase().replace(/^DR\.\s*/i, '').replace(/^DRA\.\s*/i, '');
        const normalizedIncomeName = (income.doctorName || '').trim().toUpperCase().replace(/^DR\.\s*/i, '').replace(/^DRA\.\s*/i, '');
        if (normalizedIncomeName !== normalizedFilterDoctor) return false;
      }
      
      return true;
    });
  }, [extraIncomes, currentMonth, currentYear, filters]);

  const totalDepositsAmount = useMemo(() => {
    const filtered = deposits.filter(deposit => {
      if (!deposit.date || typeof deposit.date !== 'string') return false;
      
      // FILTRO CIRÚRGICO POR STRING
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          const targetMonth = filters.startDate.substring(0, 7);
          if (!deposit.date.startsWith(targetMonth)) return false;
        }
        if (filters.endDate) {
          const targetMonth = filters.endDate.substring(0, 7);
          if (!deposit.date.startsWith(targetMonth)) return false;
        }
      } else {
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const datePattern = `${yearStr}-${monthStr}-`;
        if (!deposit.date.startsWith(datePattern)) return false;
      }
      return true;
    });
    
    return filtered.reduce((acc, deposit) => acc + (Number(deposit.value) || 0), 0);
  }, [deposits, currentMonth, currentYear, filters]);

  const totalManualPayments = useMemo(() => {
    const filtered = manualPayments.filter(payment => {
      if (!payment.date || typeof payment.date !== 'string') return false;
      
      // FILTRO CIRÚRGICO POR STRING
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          const targetMonth = filters.startDate.substring(0, 7);
          if (!payment.date.startsWith(targetMonth)) return false;
        }
        if (filters.endDate) {
          const targetMonth = filters.endDate.substring(0, 7);
          if (!payment.date.startsWith(targetMonth)) return false;
        }
      } else {
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, '0');
        const datePattern = `${yearStr}-${monthStr}-`;
        if (!payment.date.startsWith(datePattern)) return false;
      }
      return true;
    });
    
    return filtered.reduce((acc, payment) => acc + (Number(payment.value) || 0), 0);
  }, [manualPayments, currentMonth, currentYear, filters]);

  const stats = useMemo(() => {
    // Zerar variáveis
    let total = 0;
    let grossTotal = 0;
    let netTotal = 0;
    let paid = 0;
    let pending = 0;
    let hours = 0;
    
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
        netTotal: Math.max(0, safeExtraIncome - safeDiscounts),
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
    const shift6hValue = Number(user?.shift6hValue) || 1000;
    const shift12hValue = Number(user?.shift12hValue) || 1800;
    const shift24hValue = Number(user?.shift24hValue) || 3000;
    const baseHourlyRate = Number(user?.hourlyRate) || 150;
    
    // Proteção contra valores inválidos nos plantões
    const validShifts = safeShifts.filter(shift => 
      shift && 
      typeof shift.hours === 'number' && 
      shift.hours > 0
    );
    
    // Calcular horas e valores baseados nas configurações - zerado
    hours = 0;
    validShifts.forEach(c => {
      hours = hours + (Number(c.hours) || 0);
    });
    
    total = 0;
    validShifts.forEach(shift => {
      try {
        const shiftHours = Number(shift.hours) || 0;
        const shiftValue = Number(shift.grossValue || shift.value) || 0;

        // Usa o valor configurado se disponível, senão calcula
        if (shiftValue > 0) {
          total = total + shiftValue;
        } else if (shiftHours === 24) {
          total = total + shift24hValue;
        } else if (shiftHours === 12) {
          total = total + shift12hValue;
        } else if (shiftHours === 6) {
          total = total + shift6hValue;
        } else {
          total = total + (baseHourlyRate * shiftHours);
        }
      } catch (error) {
        console.error('Erro ao calcular valor do plantão:', error);
      }
    });

    paid = 0;
    validShifts.filter(s => s.paid).forEach(shift => {
      try {
        const shiftValue = Number(shift.netValue || shift.value) || 0;
        paid = paid + shiftValue;
      } catch (error) {
        console.error('Erro ao calcular valor pago:', error);
      }
    });

    // Calcular totais: bruto usa grossValue/value, líquido usa netValue/value
    let netTotalShifts = 0;
    validShifts.forEach(shift => {
      netTotalShifts = netTotalShifts + (Number(shift.netValue) || Number(shift.value) || 0);
    });
    
    grossTotal = total + safeExtraIncome;
    // CORRIGIDO: Líquido = (soma netValues + extras) - descontos globais
    netTotal = Math.max(0, netTotalShifts + safeExtraIncome - safeDiscounts);
    const totalPaid = paid + safeManualPayments;
    pending = Math.max(0, netTotalShifts - totalPaid - safeDiscounts);
    const valuePerHour = hours > 0 ? (netTotal / hours) : 0;
    
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
        } else if (shiftHours === 6) {
          acc[type].value += shift6hValue;
        } else {
          acc[type].value += baseHourlyRate * shiftHours;
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
    
    // Breakdown por duração (apenas 12h e 6h)
    const byDuration = validShifts.reduce((acc, shift) => {
      try {
        const hours = Number(shift.hours) || 0;
        const shiftValue = Number(shift.value) || 0;
        
        // Consolidar apenas 12h e 6h
        let key;
        if (hours === 12 || hours === 24) {
          // 24h conta como 12h (já que é o dobro)
          key = '12h';
        } else if (hours === 6) {
          key = '6h';
        } else {
          // Outros tipos não são incluídos
          return acc;
        }
        
        if (!acc[key]) {
          acc[key] = { count: 0, hours: 0, value: 0 };
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
        } else if (hours === 6) {
          acc[key].value += shift6hValue;
        } else {
          acc[key].value += baseHourlyRate * hours;
        }
        return acc;
      } catch (error) {
        console.error('Erro ao processar duração do plantão:', error);
        return acc;
      }
    }, {});
    
    return { 
      total: total,
      grossTotal: grossTotal,
      totalExtraIncome: safeExtraIncome,
      netTotal: netTotal,
      totalDiscounts: safeDiscounts,
      totalDepositsAmount: safeDeposits,
      totalManualPayments: safeManualPayments,
      paid: paid, 
      pending: pending, 
      hours: hours, 
      count: validShifts.length, 
      valuePerHour: valuePerHour,
      byType, 
      byDuration 
    };
  }, [filteredShifts, user, totalDiscounts, totalExtraIncome, totalDepositsAmount, totalManualPayments]);



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
      const baseHourlyRate = user.hourlyRate || 150;
      const shift6hValue = user.shift6hValue || 1000;
      const shift12hValue = user.shift12hValue || 1800;
      const shift24hValue = user.shift24hValue || 3000;

      const updates = filteredShifts.map(shift => {
        let newValue;
        if (shift.hours === 24) {
          newValue = shift24hValue;
        } else if (shift.hours === 12) {
          newValue = shift12hValue;
        } else if (shift.hours === 6) {
          newValue = shift6hValue;
        } else {
          newValue = Math.round(baseHourlyRate * shift.hours);
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
              ${[...filteredShifts].sort((a, b) => a.date.localeCompare(b.date)).map(s => `
                <tr>
                  <td>${new Date(s.date + 'T00:00:00').toLocaleDateString('pt-PT')}</td>
                  <td>${s.unit}</td>
                  <td>${s.doctorName.toUpperCase()}</td>
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
      {/* DASHBOARD DE AUDITORIA - Exclusivo para Dr. Claudio */}
      {user?.email === 'claudioleallr@gmail.com' && !isApproved && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border-2 border-amber-400 dark:border-amber-700 rounded-[2rem] p-6 shadow-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <FileText size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-amber-900 dark:text-amber-200">⚠️ PENDENTE DE AUDITORIA</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 font-bold">Fechamento aguardando assinatura do Dr. Claudio (ADM Master)</p>
              </div>
            </div>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-black text-sm uppercase shadow-lg transition-colors"
            >
              <CheckCircle size={20} /> ✅ ASSINAR E APROVAR PAGAMENTO
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de Aprovação */}
      {isApproved && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-400 dark:border-green-700 rounded-[2rem] p-6 shadow-lg">
          <div className="flex items-center gap-4">
            <CheckCircle size={48} className="text-green-600" />
            <div>
              <h3 className="text-xl font-black text-green-900 dark:text-green-200">✅ FECHAMENTO AUDITADO E ASSINADO</h3>
              <p className="text-sm text-green-700 dark:text-green-400 font-bold">Dr. Claudio (ADM Master) | ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>
        </div>
      )}

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

      <FinanceFilters 
        filters={filters} 
        setFilters={setFilters} 
        doctors={doctors.map(d => ({ ...d, name: addDoctorPrefix(d.name) }))} 
        hospitals={hospitals} 
      />

      {/* Holerite Detalhado por Médico */}
      <DoctorPayslip 
        doctorName={addDoctorPrefix(filters.doctor)} 
        shifts={filteredShifts}
        extraIncomes={filteredExtraIncomes}
        discounts={totalDiscounts}
        currentMonth={currentMonth}
        currentYear={currentYear}
        filters={filters}
      />

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 p-8 rounded-[2.5rem] border-2 border-blue-200 dark:border-blue-800 shadow-sm mb-6 will-change-auto">
        <h3 className="text-xl font-black text-blue-900 dark:text-blue-200 mb-6 flex items-center gap-2">
          <Calculator className="text-blue-600 dark:text-blue-400" /> Conciliação Financeira
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl transform-gpu">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Bruto</p>
            <p className="text-3xl font-black text-blue-700 dark:text-blue-300">R$ {safeStats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">{safeStats.count} plantões</p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl transform-gpu">
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">Total Descontos</p>
            <p className="text-3xl font-black text-red-600 dark:text-red-400">- R$ {safeStats.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40 p-6 rounded-2xl border-2 border-green-300 dark:border-green-700 transform-gpu">
            <p className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest mb-2">Total Líquido</p>
            <p className="text-3xl font-black text-green-700 dark:text-green-300">R$ {safeStats.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Valores líquidos</p>
          </div>
        </div>
      </div>

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
            <span className="text-slate-400 dark:text-slate-500 font-bold text-xl">R$</span>
            <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{safeStats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase">
            <TrendingUp size={14}/> {safeStats.count} plantões
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-green-100 dark:border-green-900/30 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-green-600 dark:text-green-400 uppercase tracking-[0.2em]">Receitas Extras</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-300 font-bold text-xl">R$</span>
            <p className="text-4xl font-black text-green-700 dark:text-green-400 tracking-tight">{safeStats.totalExtraIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-700 dark:text-green-400 text-[10px] font-black uppercase">
            <TrendingUp size={14}/> Ambulatório, Cirurgia, Bónus
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 p-8 rounded-[2.5rem] border-2 border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-[0.2em]">Faturamento Bruto Total</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-indigo-400 font-bold text-xl">R$</span>
            <p className="text-4xl font-black text-indigo-700 dark:text-indigo-300 tracking-tight">{safeStats.grossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Plantões + Extras
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-red-100 dark:border-red-900/30 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <p className="text-[11px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.2em]">Descontos</p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-red-200 font-bold text-xl">R$</span>
            <p className="text-4xl font-black text-red-600 dark:text-red-400 tracking-tight">{safeStats.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-red-600 dark:text-red-400 text-[10px] font-black uppercase">
            <MinusCircle size={14}/> Deduzido
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 p-8 rounded-[2.5rem] border-2 border-green-200 dark:border-green-800 shadow-sm flex flex-col justify-between min-h-[180px] hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-green-700 dark:text-green-400 uppercase tracking-[0.2em]">Líquido Total</p>
            <button
              onClick={() => setPaymentStatus(paymentStatus === 'paid' ? 'pending' : 'paid')}
              className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${
                paymentStatus === 'paid' 
                  ? 'bg-green-600 dark:bg-green-500 text-white shadow-md' 
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-2 border-amber-300 dark:border-amber-700'
              }`}
            >
              {paymentStatus === 'paid' ? '✓ Pago' : '⏳ Pendente'}
            </button>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-green-400 font-bold text-xl">R$</span>
            <p className="text-4xl font-black text-green-700 dark:text-green-300 tracking-tight">{safeStats.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-green-700 dark:text-green-400 text-[10px] font-black uppercase">
            <CheckCircle size={14}/> Após descontos
          </div>
        </div>






      </div>

      {/* Lista de Plantões - Retrátil */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
            <CalendarIcon className="text-blue-600 dark:text-blue-400" /> Lista Detalhada de Plantões ({filteredShifts.length})
          </h3>
          <button
            onClick={() => setShowShiftsList(!showShiftsList)}
            className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 px-4 py-2.5 rounded-xl font-bold text-xs uppercase transition-colors"
          >
            {showShiftsList ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            {showShiftsList ? 'Ocultar' : 'Exibir'}
          </button>
        </div>

        {showShiftsList && (
          <div className="space-y-2">
            <div className="grid grid-cols-5 gap-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-xl font-black text-xs text-slate-600 dark:text-slate-300 uppercase">
              <div>Data</div>
              <div>Hospital</div>
              <div>Médico</div>
              <div>Tipo</div>
              <div className="text-right">Valor</div>
            </div>
            {filteredShifts.map(shift => (
              <div key={shift.id} className="grid grid-cols-5 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors text-sm">
                <div className="font-bold text-slate-900 dark:text-white">
                  {new Date(shift.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                </div>
                <div className="text-slate-600 dark:text-slate-400">{shift.unit}</div>
                <div className="text-blue-600 dark:text-blue-400 font-bold">{addDoctorPrefix(shift.doctorName)}</div>
                <div className="text-slate-600 dark:text-slate-400">{shift.type}</div>
                <div className="text-right font-black text-green-600 dark:text-green-400">
                  R$ {(Number(shift.netValue) || Number(shift.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ExtraIncomeModule 
        currentMonth={currentMonth}
        currentYear={currentYear}
        showToast={(msg) => {}}
        doctors={doctors}
      />



      <ManualPaymentModal 
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSave={(data) => createManualPaymentMutation.mutate(data)}
      />

      <PixImportModal
        isOpen={showPixModal}
        onClose={() => setShowPixModal(false)}
        doctors={doctors}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['manualPayments'] });
          queryClient.invalidateQueries({ queryKey: ['discounts'] });
        }}
      />

      <PaymentReceipt
        stats={safeStats}
        globalDiscounts={globalDiscounts}
        filteredShifts={filteredShifts}
        extraIncomes={filteredExtraIncomes}
        currentMonth={currentMonth}
        currentYear={currentYear}
        user={user}
        filters={filters}
        isApproved={isApproved}
        addDoctorPrefix={addDoctorPrefix}
      />

      {/* Modal de Senha */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] w-full max-w-md p-8">
            <h3 className="text-2xl font-black mb-6 dark:text-white">🔐 Senha de Aprovação</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Digite a senha de auditoria para assinar e aprovar o fechamento financeiro:</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleApprove()}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-center text-2xl tracking-widest mb-6 focus:ring-2 focus:ring-green-500"
              placeholder="• • • • •"
              maxLength={5}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowPasswordModal(false); setPassword(''); }}
                className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}