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

  const queryClient = useQueryClient();

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.list('name'),
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

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createDoctorMutation.mutate(newDoctor);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <UserPlus className="text-blue-600" /> Cadastro de Médicos
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="Nome completo" 
              required 
              value={newDoctor.name} 
              onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600" 
            />
            <select 
              value={newDoctor.specialty} 
              onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
            >
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button 
              type="submit" 
              disabled={createDoctorMutation.isPending}
              className="w-full bg-blue-600 text-white font-black py-3 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              <Save size={18} /> Salvar
            </button>
          </form>
        </div>

        <ImportDoctors showToast={showToast} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {doctors.map(d => (
          <div key={d.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
            <div>
              <p className="font-black text-slate-900">{d.name}</p>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{d.specialty}</p>
            </div>
            <button 
              onClick={() => setDeleteConfirmation({ isOpen: true, id: d.id, name: d.name })} 
              className="p-2 text-slate-200 hover:text-red-500 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {doctors.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium">
            Nenhum médico cadastrado
          </div>
        )}
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