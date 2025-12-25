import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Save, Trash2 } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import Toast from '@/components/common/Toast';

export default function Hospitals() {
  const [newHospital, setNewHospital] = useState({ name: '', address: '', city: '' });
  const [message, setMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });

  const queryClient = useQueryClient();

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.list('name'),
  });

  const createHospitalMutation = useMutation({
    mutationFn: (data) => base44.entities.Hospital.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      setNewHospital({ name: '', address: '', city: '' });
      showToast('Hospital cadastrado!');
    },
  });

  const deleteHospitalMutation = useMutation({
    mutationFn: (id) => base44.entities.Hospital.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
      showToast('Hospital removido!');
    },
  });

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createHospitalMutation.mutate(newHospital);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
          <Building2 className="text-blue-600" /> Cadastro de Hospitais
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Nome da Unidade" 
            required 
            value={newHospital.name} 
            onChange={e => setNewHospital({ ...newHospital, name: e.target.value })} 
            className="px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600" 
          />
          <input 
            type="text" 
            placeholder="Localidade" 
            value={newHospital.city} 
            onChange={e => setNewHospital({ ...newHospital, city: e.target.value })} 
            className="px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600" 
          />
          <button 
            type="submit" 
            disabled={createHospitalMutation.isPending}
            className="bg-blue-600 text-white font-black py-3 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
          >
            <Save size={18} /> Salvar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map(h => (
          <div key={h.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
            <div>
              <p className="font-black text-slate-900">{h.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {h.city || 'Localização não definida'}
              </p>
            </div>
            <button 
              onClick={() => setDeleteConfirmation({ isOpen: true, id: h.id, name: h.name })} 
              className="p-2 text-slate-200 hover:text-red-500 transition-all"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {hospitals.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium">
            Nenhum hospital cadastrado
          </div>
        )}
      </div>

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => deleteHospitalMutation.mutate(deleteConfirmation.id)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}