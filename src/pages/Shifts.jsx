import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar as CalendarIcon, Filter, List } from 'lucide-react';
import CalendarView from '@/components/shifts/CalendarView';
import ListView from '@/components/shifts/ListView';
import ShiftModal from '@/components/shifts/ShiftModal';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });

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

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const d = new Date(s.date);
      const matchMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      const matchSpecialty = filterSpecialty === 'TODAS' || s.specialty === filterSpecialty;
      return matchMonth && matchSpecialty;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [shifts, currentMonth, currentYear, filterSpecialty]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null });
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, date: dateStr, shifts: filteredShifts.filter(s => s.date === dateStr) });
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

  return (
    <div className="animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex gap-2 items-center">
          <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
            <div className="p-2 text-slate-400"><Filter size={16}/></div>
            <select 
              value={filterSpecialty} 
              onChange={e => setFilterSpecialty(e.target.value)}
              className="bg-transparent text-xs font-black uppercase tracking-widest border-none focus:ring-0 cursor-pointer text-slate-600 pr-8"
            >
              <option value="TODAS">TODAS ESPECIALIDADES</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <CalendarIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
        
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
          <CalendarIcon size={14}/> {monthNames[currentMonth]} {currentYear}
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <CalendarView 
          calendarDays={calendarDays}
          currentMonth={currentMonth}
          currentYear={currentYear}
          onDayClick={handleDayClick}
          onDeleteShift={handleDeleteShift}
          onUpdateShiftDate={handleUpdateShiftDate}
        />
      ) : (
        <ListView 
          shifts={filteredShifts}
          onTogglePaid={handleTogglePaid}
          onDeleteShift={handleDeleteShift}
        />
      )}
      
      <button 
        onClick={() => { setSelectedDate(null); setIsModalOpen(true); }}
        className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 uppercase tracking-widest text-sm"
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