import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, Trash2, Calendar, Upload, Sparkles, TrendingUp, ArrowRight } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Deposits() {
  const [showForm, setShowForm] = useState(false);
  const [selectedReferenceMonth, setSelectedReferenceMonth] = useState(new Date().getMonth());
  const [selectedReferenceYear, setSelectedReferenceYear] = useState(new Date().getFullYear());
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState('');
  const [newDeposit, setNewDeposit] = useState({
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    description: '',
    value: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });
  const [isExtracting, setIsExtracting] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Deposit.list('-date');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', user?.email],
    queryFn: async () => {
      const allShifts = await base44.entities.Shift.list('-date');
      return allShifts.filter(s => s.created_by === user?.email);
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

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list();
      return all.filter(d => d.created_by === user?.email);
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

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.Deposit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowForm(false);
      setNewDeposit({ date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, description: '', value: 0 });
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: (id) => base44.entities.Deposit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
    },
  });

  const deleteExtraIncomeMutation = useMutation({
    mutationFn: (id) => base44.entities.ExtraIncome.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraIncomes'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
    },
  });

  const filteredDeposits = useMemo(() => {
    return deposits.filter(deposit => {
      const [year, month] = deposit.date.split('-').map(Number);
      
      const refMonth = selectedReferenceMonth;
      const refYear = selectedReferenceYear;
      
      let paymentMonth = refMonth + 2;
      let paymentYear = refYear;
      
      if (paymentMonth > 12) {
        paymentMonth = paymentMonth - 12;
        paymentYear = refYear + 1;
      }
      
      const dateMatch = month === paymentMonth && year === paymentYear;
      
      if (selectedDoctorFilter && deposit.description) {
        const doctorMatch = deposit.description.toLowerCase().includes(selectedDoctorFilter.toLowerCase());
        return dateMatch && doctorMatch;
      }
      
      return dateMatch;
    });
  }, [deposits, selectedReferenceMonth, selectedReferenceYear, selectedDoctorFilter]);

  const totalDeposits = useMemo(() => {
    return filteredDeposits.reduce((acc, deposit) => acc + (Number(deposit.value) || 0), 0);
  }, [filteredDeposits]);

  const shiftsFromReferenceMonth = useMemo(() => {
    return shifts.filter(s => {
      const [year, month] = s.date.split('-').map(Number);
      const dateMatch = month === selectedReferenceMonth + 1 && year === selectedReferenceYear;
      
      if (selectedDoctorFilter) {
        const doctorMatch = s.doctorName.toLowerCase().includes(selectedDoctorFilter.toLowerCase());
        return dateMatch && doctorMatch;
      }
      
      return dateMatch;
    });
  }, [shifts, selectedReferenceMonth, selectedReferenceYear, selectedDoctorFilter]);

  const totalShiftsValue = useMemo(() => {
    return shiftsFromReferenceMonth.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
  }, [shiftsFromReferenceMonth]);

  const extraIncomesFromReferenceMonth = useMemo(() => {
    return extraIncomes.filter(income => {
      const [year, month] = income.date.split('-').map(Number);
      const dateMatch = month === selectedReferenceMonth + 1 && year === selectedReferenceYear;
      
      if (selectedDoctorFilter && income.description) {
        const doctorMatch = income.description.toLowerCase().includes(selectedDoctorFilter.toLowerCase());
        return dateMatch && doctorMatch;
      }
      
      return dateMatch;
    });
  }, [extraIncomes, selectedReferenceMonth, selectedReferenceYear, selectedDoctorFilter]);

  const totalExtraIncome = useMemo(() => {
    return extraIncomesFromReferenceMonth.reduce((acc, income) => acc + (Number(income.value) || 0), 0);
  }, [extraIncomesFromReferenceMonth]);

  const globalDiscounts = useMemo(() => {
    return discounts.filter(d => !d.type || d.type === '');
  }, [discounts]);

  const totalDiscounts = useMemo(() => {
    // Usar o total de plantões (não filtrados por médico) para calcular descontos percentuais
    const allMonthShifts = shifts.filter(s => {
      const [year, month] = s.date.split('-').map(Number);
      return month === selectedReferenceMonth + 1 && year === selectedReferenceYear;
    });
    
    const monthlyShiftsTotal = allMonthShifts.reduce((acc, s) => acc + (Number(s.value) || 0), 0);
    
    // Filtrar descontos do mês de referência
    const monthlyDiscounts = globalDiscounts.filter(d => {
      const [year, month] = d.date.split('-').map(Number);
      return month === selectedReferenceMonth + 1 && year === selectedReferenceYear;
    });
    
    // Calcular total de descontos
    return monthlyDiscounts.reduce((acc, d) => {
      const isPercentage = d.isPercentage === true;
      if (isPercentage) {
        return acc + (monthlyShiftsTotal * (Number(d.value) || 0) / 100);
      }
      return acc + (Number(d.value) || 0);
    }, 0);
  }, [globalDiscounts, shifts, selectedReferenceMonth, selectedReferenceYear]);

  const shiftsByUnit = useMemo(() => {
    const grouped = {};
    shiftsFromReferenceMonth.forEach(shift => {
      const unit = shift.unit || 'Sem unidade';
      if (!grouped[unit]) {
        grouped[unit] = { total: 0, count: 0 };
      }
      grouped[unit].total += Number(shift.value) || 0;
      grouped[unit].count += 1;
    });
    return grouped;
  }, [shiftsFromReferenceMonth]);

  const doctorFilterDisplayName = useMemo(() => {
    if (!selectedDoctorFilter) return '';
    const doctor = doctors.find(d => d.name === selectedDoctorFilter);
    return doctor ? doctor.name : selectedDoctorFilter;
  }, [selectedDoctorFilter, doctors]);

  const grossTotal = totalShiftsValue + totalExtraIncome;
  const totalExpected = Math.max(0, grossTotal - totalDiscounts);
  const difference = totalDeposits - totalExpected;

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert YYYY-MM to YYYY-MM-01 for storage
    const depositData = {
      ...newDeposit,
      date: `${newDeposit.date}-01`
    };
    createDepositMutation.mutate(depositData);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data do depósito no formato YYYY-MM-DD" },
            value: { type: "number", description: "Valor do depósito em número" },
            description: { type: "string", description: "Descrição ou observações sobre o depósito" }
          },
          required: ["date", "value"]
        }
      });

      if (result.status === 'success' && result.output) {
        // Extract year and month from the date
        const extractedDate = result.output.date || new Date().toISOString().split('T')[0];
        const [year, month] = extractedDate.split('-');
        setNewDeposit({
          date: `${year}-${month}`,
          value: result.output.value || 0,
          description: result.output.description || ''
        });
      }
    } catch (error) {
      console.error('Erro ao processar arquivo');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const paymentMonth = (selectedReferenceMonth + 1) % 12;
  const paymentYear = selectedReferenceMonth === 11 ? selectedReferenceYear + 1 : selectedReferenceYear;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-[1600px] mx-auto px-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Wallet className="text-blue-600 dark:text-blue-400" size={32} /> Depósitos Bancários
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold text-sm uppercase hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
        >
          <Plus size={18} />
          {showForm ? 'Cancelar' : 'Adicionar'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Mês de Referência
            </label>
            <select
              value={selectedReferenceMonth}
              onChange={(e) => setSelectedReferenceMonth(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Ano de Referência
            </label>
            <select
              value={selectedReferenceYear}
              onChange={(e) => setSelectedReferenceYear(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              <option value={2024}>2024</option>
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 block mb-2">
              Médico
            </label>
            <select
              value={selectedDoctorFilter}
              onChange={(e) => setSelectedDoctorFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              <option value="">Todos os Médicos</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.name}>{doctor.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 dark:bg-blue-500 p-3 rounded-xl">
                <Calendar className="text-white" size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Mês de Referência</p>
                <p className="text-xl md:text-2xl font-black text-blue-900 dark:text-blue-200">
                  {monthNames[selectedReferenceMonth]} {selectedReferenceYear}
                </p>
              </div>
            </div>
            <ArrowRight className="text-blue-600 dark:text-blue-400 hidden md:block" size={32} />
            <div>
              <p className="text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest md:text-right">Mês de Pagamento</p>
              <p className="text-xl md:text-2xl font-black text-indigo-900 dark:text-indigo-200 md:text-right">
                {monthNames[paymentMonth]} {paymentYear}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Novo Depósito</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-2xl font-black text-xs uppercase cursor-pointer hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isExtracting}
                />
                {isExtracting ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    A extrair dados...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Carregar Comprovante (IA)
                  </>
                )}
              </label>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 text-center mt-2">JPG, PNG ou PDF • A IA extrairá data e valor automaticamente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Mês e Ano</label>
                <input
                  type="month"
                  value={newDeposit.date}
                  onChange={(e) => setNewDeposit({...newDeposit, date: e.target.value})}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input
                  type="number"
                  value={newDeposit.value}
                  onChange={(e) => setNewDeposit({...newDeposit, value: Number(e.target.value)})}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
              <input
                type="text"
                value={newDeposit.description}
                onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                placeholder="Descrição opcional"
              />
            </div>
            <button
              type="submit"
              disabled={createDepositMutation.isPending}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white font-black py-4 rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Guardar Depósito
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 md:p-8 rounded-[2.5rem] border-2 border-green-200 dark:border-green-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-green-600 dark:text-green-400" size={28} />
            <p className="text-[11px] font-black text-green-700 dark:text-green-400 uppercase tracking-widest">
              Plantões de {monthNames[selectedReferenceMonth]} {selectedReferenceYear}
              {selectedDoctorFilter && ` - ${doctorFilterDisplayName}`}
            </p>
          </div>
          <p className="text-3xl md:text-4xl font-black text-green-700 dark:text-green-300 mb-2">
            R$ {totalShiftsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 font-bold">
            {shiftsFromReferenceMonth.length} plantão{shiftsFromReferenceMonth.length !== 1 ? 'ões' : ''} registado{shiftsFromReferenceMonth.length !== 1 ? 's' : ''}
          </p>
          {totalExtraIncome > 0 && (
            <div className="mt-3 pt-3 border-t border-green-300 dark:border-green-700">
              <p className="text-[9px] text-green-600 dark:text-green-400 font-bold uppercase tracking-wider">+ Outras Entradas</p>
              <p className="text-lg font-black text-green-600 dark:text-green-300">
                R$ {totalExtraIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[8px] text-green-500 dark:text-green-400 mt-1">
                {extraIncomesFromReferenceMonth.length} entrada{extraIncomesFromReferenceMonth.length !== 1 ? 's' : ''} (consultas, cirurgias, etc)
              </p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 md:p-8 rounded-[2.5rem] border-2 border-purple-200 dark:border-purple-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-purple-600 dark:text-purple-400" size={28} />
            <p className="text-[11px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest">
              Total Líquido Esperado
            </p>
          </div>
          <p className="text-3xl md:text-4xl font-black text-purple-700 dark:text-purple-300 mb-2">
            R$ {totalExpected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
            Plantões + Extras - Descontos
          </p>
          {totalDiscounts > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-300 dark:border-purple-700">
              <p className="text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">Descontos Aplicados</p>
              <p className="text-lg font-black text-red-600 dark:text-red-400">
                - R$ {totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 md:p-8 rounded-[2.5rem] border-2 border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="text-blue-600 dark:text-blue-400" size={28} />
            <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">
              Depositado em {monthNames[paymentMonth]} {paymentYear}
            </p>
          </div>
          <p className="text-3xl md:text-4xl font-black text-blue-700 dark:text-blue-300 mb-2">
            R$ {totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
            {filteredDeposits.length} depósito{filteredDeposits.length !== 1 ? 's' : ''} registado{filteredDeposits.length !== 1 ? 's' : ''}
          </p>
          <div className={`mt-3 pt-3 border-t ${difference >= 0 ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'}`}>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: difference >= 0 ? '#16a34a' : '#dc2626' }}>
              Diferença
            </p>
            <p className={`text-2xl font-black ${difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {difference >= 0 ? '+' : ''} R$ {Math.abs(difference).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[8px] mt-1" style={{ color: difference >= 0 ? '#16a34a' : '#dc2626' }}>
              {difference >= 0 ? 'Depositado a mais' : 'Falta depositar'}
            </p>
          </div>
        </div>
      </div>

      {Object.keys(shiftsByUnit).length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Plantões por Unidade</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(shiftsByUnit)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([unit, data]) => (
                <div key={unit} className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{unit}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                    R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    {data.count} plantão{data.count !== 1 ? 'ões' : ''}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {extraIncomesFromReferenceMonth.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Outras Entradas do Mês</h3>
          <div className="space-y-2">
            {extraIncomesFromReferenceMonth.map(income => (
              <div key={income.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 dark:bg-green-500 p-2 rounded-lg">
                    <TrendingUp size={14} className="text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">{income.type}</span>
                    {income.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{income.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-lg text-green-700 dark:text-green-300">R$ {income.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  <button
                    onClick={() => setDeleteConfirmation({ isOpen: true, id: income.id, name: 'Receita Extra' })}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Lista de Depósitos</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Total de depósitos no sistema: {deposits.length} | Filtrados: {filteredDeposits.length}
        </p>
        <div className="space-y-2">
          {filteredDeposits.map(deposit => (
            <div key={deposit.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border border-slate-100 dark:border-slate-600">
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {(() => {
                      const [year, month] = deposit.date.split('-');
                      return `${monthNames[parseInt(month) - 1]} ${year}`;
                    })()}
                  </span>
                  {deposit.description && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{deposit.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-black text-lg text-blue-700 dark:text-blue-300">R$ {deposit.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <button
                  onClick={() => setDeleteConfirmation({ isOpen: true, id: deposit.id, name: 'Depósito' })}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredDeposits.length === 0 && (
            <p className="text-center text-slate-400 dark:text-slate-500 py-8">Nenhum depósito registado para este período</p>
          )}
        </div>
      </div>

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => {
          if (deleteConfirmation.name === 'Receita Extra') {
            deleteExtraIncomeMutation.mutate(deleteConfirmation.id);
          } else {
            deleteDepositMutation.mutate(deleteConfirmation.id);
          }
        }}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}