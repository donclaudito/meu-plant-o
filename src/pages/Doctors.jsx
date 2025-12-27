import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Save, Trash2 } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import Toast from '@/components/common/Toast';
import ImportDoctors from '@/components/doctors/ImportDoctors';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

export default function Doctors() {
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: 'CIRURGIA GERAL', phone: '' });
  const [message, setMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });
  const [selectedDoctors, setSelectedDoctors] = useState([]);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list('name');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const createDoctorMutation = useMutation({
    mutationFn: (data) => base44.entities.Doctor.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setNewDoctor({ name: '', specialty: 'CIRURGIA GERAL', phone: '' });
      showToast('Médico cadastrado!');
    },
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id) => base44.entities.Doctor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
      showToast('Médico removido!');
    },
  });

  const deleteDoctorsMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Doctor.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setSelectedDoctors([]);
      showToast('Médicos eliminados!');
    },
  });

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createDoctorMutation.mutate(newDoctor);
  };

  const toggleSelectAll = () => {
    if (selectedDoctors.length === doctors.length) {
      setSelectedDoctors([]);
    } else {
      setSelectedDoctors(doctors.map(d => d.id));
    }
  };

  const toggleSelectDoctor = (id) => {
    setSelectedDoctors(prev => 
      prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedDoctors.length === 0) return;
    if (confirm(`Eliminar ${selectedDoctors.length} médico(s) selecionado(s)?`)) {
      deleteDoctorsMutation.mutate(selectedDoctors);
    }
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
      <Toast message={message?.text} type={message?.type} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
            <UserPlus className="text-blue-600 dark:text-blue-400" /> Cadastro de Médicos
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nome completo" 
              required 
              value={newDoctor.name} 
              onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500" 
            />
            <select 
              value={newDoctor.specialty} 
              onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input 
              type="tel" 
              placeholder="Telefone (opcional)" 
              value={newDoctor.phone} 
              onChange={e => setNewDoctor({ ...newDoctor, phone: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500" 
            />
            <button 
              type="submit" 
              disabled={createDoctorMutation.isPending}
              className="w-full bg-blue-600 dark:bg-blue-500 text-white font-black py-3 rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 disabled:opacity-50"
            >
              <Save size={18} /> Salvar
            </button>
          </form>
        </div>

        <ImportDoctors showToast={showToast} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black dark:text-white">Lista de Médicos</h3>
          {doctors.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                {selectedDoctors.length === doctors.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              {selectedDoctors.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleteDoctorsMutation.isPending}
                  className="flex items-center gap-2 text-xs font-bold text-white bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Eliminar ({selectedDoctors.length})
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map(d => (
            <div key={d.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center gap-3 group hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <input
                type="checkbox"
                checked={selectedDoctors.includes(d.id)}
                onChange={() => toggleSelectDoctor(d.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 dark:text-white text-sm leading-tight">
                  {d.name} | {d.specialty} {d.phone && `| ${d.phone}`}
                </p>
              </div>
              <button 
                onClick={() => setDeleteConfirmation({ isOpen: true, id: d.id, name: d.name })} 
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {doctors.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
              Nenhum médico cadastrado
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => deleteDoctorMutation.mutate(deleteConfirmation.id)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}