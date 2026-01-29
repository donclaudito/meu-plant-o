import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, Filter, List, X, FileSpreadsheet, Download } from 'lucide-react';
import CalendarView from '@/components/shifts/CalendarView';
import ListView from '@/components/shifts/ListView';
import ShiftModal from '@/components/shifts/ShiftModal';
import ImportShifts from '@/components/shifts/ImportShifts';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import Toast from '@/components/common/Toast';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

export default function Shifts({ currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear() }) {
  const [viewMode, setViewMode] = useState('calendar');
  const [filterSpecialty, setFilterSpecialty] = useState('TODAS');
  const [filterDoctor, setFilterDoctor] = useState('TODOS');
  const [filterWeek, setFilterWeek] = useState('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [selectedShifts, setSelectedShifts] = useState([]);

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
    staleTime: 1000 * 60 * 5, // 5 minutos
    cacheTime: 1000 * 60 * 10, // 10 minutos
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list('name');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutos (dados mudam raramente)
    cacheTime: 1000 * 60 * 60, // 60 minutos
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Hospital.list('name');
      return all.filter(h => h.created_by === user?.email);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 30, // 30 minutos (dados mudam raramente)
    cacheTime: 1000 * 60 * 60, // 60 minutos
  });

  const createShiftMutation = useMutation({
    mutationFn: (data) => base44.entities.Shift.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setIsModalOpen(false);
      showToast('Plantão registado!');
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Shift.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      showToast('Plantão atualizado!');
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id) => base44.entities.Shift.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
      showToast('Plantão removido!');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      const results = await Promise.allSettled(ids.map(id => base44.entities.Shift.delete(id)));
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      return { successful, failed, total: ids.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setSelectedShifts([]);
      if (result.failed > 0) {
        showToast(`${result.successful} plantões removidos (${result.failed} já não existiam)`);
      } else {
        showToast(`${result.successful} plantões removidos!`);
      }
    },
  });

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      // Extrai ano e mês diretamente da string YYYY-MM-DD para evitar problemas de timezone
      const [year, month] = s.date.split('-').map(Number);
      const matchMonth = month === currentMonth + 1 && year === currentYear;

      // Aplicar filtros de médico, especialidade e semana
      const normalizedFilterDoctor = filterDoctor === 'TODOS' ? 'TODOS' : filterDoctor.trim().toUpperCase();
      const normalizedDoctorName = (s.doctorName || '').trim().toUpperCase();
      const matchDoctor = normalizedFilterDoctor === 'TODOS' || normalizedDoctorName === normalizedFilterDoctor;

      const matchSpecialty = filterSpecialty === 'TODAS' || s.specialty === filterSpecialty;

      let matchWeek = true;
      if (filterWeek !== 'TODAS') {
        const weekNum = parseInt(filterWeek);
        const [, , day] = s.date.split('-').map(Number);
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        const weekOfMonth = Math.ceil((day + adjustedFirstDay) / 7);
        matchWeek = weekOfMonth === weekNum;
      }

      return matchMonth && matchDoctor && matchSpecialty && matchWeek;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [shifts, currentMonth, currentYear, filterDoctor, filterSpecialty, filterWeek]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDay.getDay();
    const adjustedFirstDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Segunda = 0, Domingo = 6
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];

    // Adicionar dias vazios antes do início do mês
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, date: null, shifts: [] });
    }

    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const dayShifts = filteredShifts.filter(s => s.date === dateStr);
      days.push({ day: i, date: dateStr, shifts: dayShifts });
    }

    return days;
  }, [currentMonth, currentYear, filteredShifts]);

  const handleDayClick = (date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleDeleteShift = (id, name) => {
    setDeleteConfirmation({ isOpen: true, id, name });
  };

  const handleTogglePaid = (id, paid) => {
    updateShiftMutation.mutate({ id, data: { paid } });
  };

  const handleUpdateShiftDate = (id, newDate) => {
    updateShiftMutation.mutate({ id, data: { date: newDate } });
  };

  const toggleSelectShift = (id) => {
    setSelectedShifts(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedShifts.length === filteredShifts.length) {
      setSelectedShifts([]);
    } else {
      setSelectedShifts(filteredShifts.map(s => s.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedShifts.length === 0) return;
    if (confirm(`Tem certeza que deseja eliminar ${selectedShifts.length} plantões selecionados?`)) {
      bulkDeleteMutation.mutate(selectedShifts);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">A carregar plantões...</p>
        </div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayShifts = filteredShifts.filter(s => s.date === todayStr);
  const upcomingShifts = filteredShifts.filter(s => s.date > todayStr).sort((a, b) => a.date.localeCompare(b.date));
  const nextShift = upcomingShifts[0];

  const exportToCSV = () => {
    const headers = ['Data', 'Hospital', 'Médico', 'Especialidade', 'Tipo', 'Horas', 'Valor', 'Status'];
    const rows = filteredShifts.map(s => [
      new Date(s.date + 'T00:00:00').toLocaleDateString('pt-PT'),
      s.unit,
      s.doctorName,
      s.specialty,
      s.type,
      s.hours,
      `R$ ${s.value.toFixed(2)}`,
      s.paid ? 'Pago' : 'Pendente'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantoes_${monthNames[currentMonth]}_${currentYear}.csv`;
    link.click();
  };

  const syncToGoogleSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const { data } = await base44.functions.invoke('syncShiftsToSheets', {
        month: currentMonth,
        year: currentYear
      });
      
      if (data.success) {
        showToast(`${data.shiftsCount} plantões sincronizados!`);
        window.open(data.spreadsheetUrl, '_blank');
      } else {
        showToast(data.error || 'Erro ao sincronizar', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Erro ao sincronizar', 'error');
    } finally {
      setIsSyncingSheets(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      {todayShifts.length > 0 ? (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 text-white p-4 rounded-2xl mb-6 shadow-lg dark:shadow-red-900/30 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase tracking-wide">Hoje está de plantão!</p>
              <p className="text-xs opacity-90 mt-1">
                Médicos de serviço: {todayShifts.map((s, i) => (
                  <span key={s.id}>
                    <strong>{s.doctorName}</strong> em {s.unit} ({s.type})
                    {i < todayShifts.length - 1 ? ' • ' : ''}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white p-4 rounded-2xl mb-6 shadow-lg dark:shadow-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase tracking-wide">
                {filterDoctor !== 'TODOS' ? `${filterDoctor} está de folga hoje.` : 'Hoje está de folga!'}
              </p>
              {nextShift && (
                <p className="text-xs opacity-90 mt-2">
                  Próximo plantão: {new Date(nextShift.date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })} • <strong>{nextShift.doctorName}</strong> em {nextShift.unit} ({nextShift.type})
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex gap-2 items-center flex-wrap">
            {selectedShifts.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 bg-red-600 dark:bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-md"
              >
                <X size={16} /> Eliminar {selectedShifts.length}
              </button>
            )}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-md"
            >
              <Download size={16} /> CSV
            </button>
          
          <button
            onClick={syncToGoogleSheets}
            disabled={isSyncingSheets}
            className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} /> 
            {isSyncingSheets ? 'Sincronizando...' : 'Google Sheets'}
          </button>
          
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
            <div className="p-2 text-slate-400 dark:text-slate-500"><Filter size={16}/></div>
            <select 
              value={filterDoctor} 
              onChange={e => setFilterDoctor(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-300 pr-8"
            >
              <option value="TODOS">TODOS MÉDICOS</option>
              {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
            <div className="p-2 text-slate-400 dark:text-slate-500"><Filter size={16}/></div>
            <select 
              value={filterWeek} 
              onChange={e => setFilterWeek(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-300 pr-8"
            >
              <option value="TODAS">TODAS SEMANAS</option>
              <option value="1">SEMANA 1</option>
              <option value="2">SEMANA 2</option>
              <option value="3">SEMANA 3</option>
              <option value="4">SEMANA 4</option>
              <option value="5">SEMANA 5</option>
            </select>
          </div>
          
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
            <div className="p-2 text-slate-400 dark:text-slate-500"><Filter size={16}/></div>
            <select 
              value={filterSpecialty} 
              onChange={e => setFilterSpecialty(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-slate-600 dark:text-slate-300 pr-8"
            >
              <option value="TODAS">TODAS ESPECIALIDADES</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <CalendarIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        
        <div className="hidden md:flex text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm items-center gap-2">
          <CalendarIcon size={14}/> {monthNames[currentMonth]} {currentYear}
        </div>
      </div>

      {showImport && (
        <div className="mb-8">
          <ImportShifts showToast={showToast} />
          <button
            onClick={() => setShowImport(false)}
            className="mt-4 w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Fechar Importação
          </button>
        </div>
      )}

      {!showImport && (
        <button
          onClick={() => setShowImport(true)}
          className="mb-6 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <FileSpreadsheet size={20} />
          Importar do Google Sheets
        </button>
      )}

      {viewMode === 'calendar' ? (
        <CalendarView 
          calendarDays={calendarDays}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onDayClick={handleDayClick}
          onDeleteShift={handleDeleteShift}
          onUpdateShiftDate={handleUpdateShiftDate}
          selectedShifts={selectedShifts}
          onToggleSelect={toggleSelectShift}
          onToggleSelectAll={toggleSelectAll}
        />
      ) : (
        <ListView 
          shifts={filteredShifts}
          onTogglePaid={handleTogglePaid}
          onDeleteShift={handleDeleteShift}
          selectedShifts={selectedShifts}
          onToggleSelect={toggleSelectShift}
          onToggleSelectAll={toggleSelectAll}
        />
      )}
      
      {/* FAB - Mobile */}
      <button 
        onClick={() => { setSelectedDate(null); setIsModalOpen(true); }}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-40"
      >
        <Plus size={24} strokeWidth={3} />
      </button>

      {/* Desktop Button */}
      <button 
        onClick={() => { setSelectedDate(null); setIsModalOpen(true); }}
        className="hidden md:flex w-full bg-slate-900 dark:bg-slate-700 text-white font-black py-5 rounded-[2rem] hover:bg-slate-800 dark:hover:bg-slate-600 transition-all items-center justify-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest text-sm"
      >
        <Plus size={20} strokeWidth={3} /> Novo Plantão
      </button>

      <ShiftModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => createShiftMutation.mutate(data)}
        doctors={doctors}
        hospitals={hospitals}
        initialDate={selectedDate}
      />

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => deleteShiftMutation.mutate(deleteConfirmation.id)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}