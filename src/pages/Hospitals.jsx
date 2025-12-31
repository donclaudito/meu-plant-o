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

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Hospital.list('name');
      return all.filter(h => h.created_by === user?.email);
    },
    enabled: !!user,
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

      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
          <Building2 className="text-blue-600 dark:text-blue-400" /> Cadastro de Hospitais
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" 
            placeholder="Nome da Unidade" 
            required 
            value={newHospital.name} 
            onChange={e => setNewHospital({ ...newHospital, name: e.target.value })} 
            className="px-4 py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500" 
          />
          <input 
            type="text" 
            placeholder="Localidade" 
            value={newHospital.city} 
            onChange={e => setNewHospital({ ...newHospital, city: e.target.value })} 
            className="px-4 py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500" 
          />
          <button 
            type="submit" 
            disabled={createHospitalMutation.isPending}
            className="bg-blue-600 dark:bg-blue-500 text-white font-black py-3 rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 disabled:opacity-50"
          >
            <Save size={18} /> Salvar
          </button>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="text-lg font-black mb-6 dark:text-white">Lista de Hospitais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospitals.map(h => (
            <div key={h.id} className="bg-slate-50 dark:bg-slate-700 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 flex justify-between items-center group hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 dark:text-white text-sm">{h.name}</p>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {h.city || 'Localização não definida'}
                </p>
              </div>
              <button 
                onClick={() => setDeleteConfirmation({ isOpen: true, id: h.id, name: h.name })} 
                className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {hospitals.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
              Nenhum hospital cadastrado
            </div>
          )}
        </div>
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