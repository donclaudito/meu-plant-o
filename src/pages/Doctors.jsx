import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Save, Trash2, Download, Upload } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';
import Toast from '@/components/common/Toast';
import ImportDoctors from '@/components/doctors/ImportDoctors';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

export default function Doctors() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user?.role === 'shift_editor') {
      window.location.href = '/shifts';
    }
  }, [user]);

  const [newDoctor, setNewDoctor] = useState({ 
    name: '', 
    specialty: 'CIRURGIA GERAL', 
    phone: '',
    pixAccountHolder: '',
    pixKey: '',
    pixKeyType: 'CPF'
  });
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const [isExtractingPix, setIsExtractingPix] = useState(false);

  const queryClient = useQueryClient();

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
      setNewDoctor({ 
        name: '', 
        specialty: 'CIRURGIA GERAL', 
        phone: '',
        pixAccountHolder: '',
        pixKey: '',
        pixKeyType: 'CPF'
      });
      showToast('Médico cadastrado!');
    },
  });

  const updateDoctorMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Doctor.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setEditingDoctor(null);
      showToast('Médico atualizado!');
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
    if (editingDoctor) {
      updateDoctorMutation.mutate({ id: editingDoctor.id, data: editingDoctor });
    } else {
      createDoctorMutation.mutate(newDoctor);
    }
  };

  const handleEdit = (doctor) => {
    setEditingDoctor({
      ...doctor,
      pixKeyType: doctor.pixKeyType || 'CPF'
    });
  };

  const handleCancelEdit = () => {
    setEditingDoctor(null);
  };

  const handlePixUpload = async (e, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingPix(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            accountHolder: { 
              type: "string", 
              description: "Nome completo do titular da conta PIX como aparece no comprovativo"
            },
            pixKey: { 
              type: "string", 
              description: "Chave PIX (CPF, CNPJ, email, telefone ou código aleatório)"
            },
            pixKeyType: {
              type: "string",
              description: "Tipo de chave PIX: CPF, CNPJ, Email, Telefone ou Aleatória"
            }
          }
        }
      });

      if (result.status === 'success' && result.output) {
        const extractedData = {
          pixAccountHolder: result.output.accountHolder || '',
          pixKey: result.output.pixKey || '',
          pixKeyType: result.output.pixKeyType || 'CPF'
        };

        if (isEditing) {
          setEditingDoctor(prev => ({ ...prev, ...extractedData }));
        } else {
          setNewDoctor(prev => ({ ...prev, ...extractedData }));
        }
        showToast('Dados PIX extraídos com sucesso!');
      } else {
        showToast('Erro ao extrair dados do comprovativo', 'error');
      }
    } catch (error) {
      showToast('Erro ao processar arquivo', 'error');
    } finally {
      setIsExtractingPix(false);
      e.target.value = '';
    }
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

  const handleDeleteSelected = async () => {
    if (selectedDoctors.length === 0) return;
    if (window.confirm(`Tem a certeza que deseja eliminar ${selectedDoctors.length} médico(s) selecionado(s)?`)) {
      await deleteDoctorsMutation.mutateAsync(selectedDoctors);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,specialty,phone
Dr. João Silva,CIRURGIA GERAL,+351 912 345 678
Dra. Maria Costa,PEDIATRIA,+351 918 765 432`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_medicos.csv';
    link.click();
  };

  const exportDoctors = () => {
    if (doctors.length === 0) {
      showToast('Nenhum médico para exportar', 'error');
      return;
    }
    
    const csvHeader = 'name,specialty,phone\n';
    const csvRows = doctors.map(d => 
      `${d.name},${d.specialty},${d.phone || ''}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `medicos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('Médicos exportados!');
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
      <Toast message={message?.text} type={message?.type} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h2 className="text-lg sm:text-xl font-black mb-4 sm:mb-6 flex items-center gap-2 dark:text-white">
            <UserPlus size={20} className="sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" /> 
            <span className="text-base sm:text-xl">{editingDoctor ? 'Editar Médico' : 'Cadastro de Médicos'}</span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <input 
              type="text" 
              placeholder="Nome completo" 
              required 
              value={editingDoctor ? editingDoctor.name : newDoctor.name} 
              onChange={e => editingDoctor ? setEditingDoctor({ ...editingDoctor, name: e.target.value }) : setNewDoctor({ ...newDoctor, name: e.target.value })} 
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm sm:text-base" 
            />
            <select 
              value={editingDoctor ? editingDoctor.specialty : newDoctor.specialty} 
              onChange={e => editingDoctor ? setEditingDoctor({ ...editingDoctor, specialty: e.target.value }) : setNewDoctor({ ...newDoctor, specialty: e.target.value })} 
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm sm:text-base"
            >
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input 
              type="tel" 
              placeholder="Telefone (opcional)" 
              value={editingDoctor ? editingDoctor.phone : newDoctor.phone} 
              onChange={e => editingDoctor ? setEditingDoctor({ ...editingDoctor, phone: e.target.value }) : setNewDoctor({ ...newDoctor, phone: e.target.value })} 
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm sm:text-base" 
            />
            
            <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">Dados PIX (Opcional)</p>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handlePixUpload(e, !!editingDoctor)}
                    disabled={isExtractingPix}
                    className="hidden"
                  />
                  <Upload size={14} />
                  <span className="text-[10px] font-bold">{isExtractingPix ? 'Extraindo...' : 'Importar PIX'}</span>
                </label>
              </div>
              
              <input 
                type="text" 
                placeholder="Nome do titular da conta (como aparece no PIX)" 
                value={editingDoctor ? editingDoctor.pixAccountHolder || '' : newDoctor.pixAccountHolder} 
                onChange={e => editingDoctor ? setEditingDoctor({ ...editingDoctor, pixAccountHolder: e.target.value }) : setNewDoctor({ ...newDoctor, pixAccountHolder: e.target.value })} 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm sm:text-base mb-3" 
              />
              
              <select 
                value={editingDoctor ? editingDoctor.pixKeyType || 'CPF' : newDoctor.pixKeyType} 
                onChange={e => editingDoctor ? setEditingDoctor({ ...editingDoctor, pixKeyType: e.target.value }) : setNewDoctor({ ...newDoctor, pixKeyType: e.target.value })} 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm sm:text-base mb-3"
              >
                <option value="CPF">CPF</option>
                <option value="CNPJ">CNPJ</option>
                <option value="Email">Email</option>
                <option value="Telefone">Telefone</option>
                <option value="Aleatória">Chave Aleatória</option>
              </select>
              
              <input 
                type="text" 
                placeholder="Chave PIX" 
                value={editingDoctor ? editingDoctor.pixKey || '' : newDoctor.pixKey} 
                onChange={e => editingDoctor ? setEditingDoctor({ ...editingDoctor, pixKey: e.target.value }) : setNewDoctor({ ...newDoctor, pixKey: e.target.value })} 
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl sm:rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm sm:text-base" 
              />
            </div>
            
            <div className="flex gap-2">
              {editingDoctor && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all text-sm sm:text-base"
                >
                  Cancelar
                </button>
              )}
              <button 
                type="submit" 
                disabled={createDoctorMutation.isPending || updateDoctorMutation.isPending}
                className="flex-1 bg-blue-600 dark:bg-blue-500 text-white font-black py-2.5 sm:py-3 rounded-xl sm:rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 disabled:opacity-50 text-sm sm:text-base"
              >
                <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> {editingDoctor ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>

        <ImportDoctors showToast={showToast} />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-black dark:text-white">Lista de Médicos</h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg sm:rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-[11px] sm:text-xs font-bold"
              title="Descarregar modelo CSV"
            >
              <Download size={13} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Modelo</span>
            </button>
            {doctors.length > 0 && (
              <button
                onClick={exportDoctors}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg sm:rounded-xl hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-[11px] sm:text-xs font-bold"
                title="Exportar médicos para CSV"
              >
                <Download size={13} className="sm:w-3.5 sm:h-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
          {doctors.length > 0 && (
           <div className="flex items-center gap-2">
             <button
               onClick={toggleSelectAll}
               className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors whitespace-nowrap"
             >
               <span className="hidden sm:inline">{selectedDoctors.length === doctors.length ? 'Desmarcar' : 'Selecionar'}</span>
               <span className="sm:hidden">✓</span>
             </button>
             {selectedDoctors.length > 0 && (
               <button
                 onClick={handleDeleteSelected}
                 disabled={deleteDoctorsMutation.isPending}
                 className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-white bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-colors disabled:opacity-50"
               >
                 <Trash2 size={13} className="sm:w-3.5 sm:h-3.5" />
                 <span className="hidden sm:inline">Eliminar</span> ({selectedDoctors.length})
               </button>
             )}
           </div>
          )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          {doctors.map(d => (
            <div key={d.id} className="bg-slate-50 dark:bg-slate-700 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 flex items-center gap-2 sm:gap-3 group hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all">
              <input
                type="checkbox"
                checked={selectedDoctors.includes(d.id)}
                onChange={() => toggleSelectDoctor(d.id)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
              />
              <div 
                className="flex-1 min-w-0 cursor-pointer" 
                onClick={() => handleEdit(d)}
              >
                <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm leading-tight break-words">
                  {d.name} <span className="text-slate-500 dark:text-slate-400">|</span> {d.specialty} {d.phone && <><span className="text-slate-500 dark:text-slate-400">|</span> {d.phone}</>}
                </p>
                {d.pixAccountHolder && (
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                    PIX: {d.pixAccountHolder}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setDeleteConfirmation({ isOpen: true, id: d.id, name: d.name })} 
                className="p-1.5 sm:p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
              >
                <Trash2 size={14} className="sm:w-4 sm:h-4" />
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