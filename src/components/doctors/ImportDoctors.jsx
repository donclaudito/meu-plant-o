import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Upload, FileText, Loader2, CheckCircle, Trash2 } from 'lucide-react';

export default function ImportDoctors({ showToast }) {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedDoctors, setSelectedDoctors] = useState([]);
  const queryClient = useQueryClient();

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.list('name'),
  });

  const createDoctorsMutation = useMutation({
    mutationFn: (doctors) => base44.entities.Doctor.bulkCreate(doctors),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setImportResult({ success: true, count: data.length });
      showToast(`${data.length} médicos importados com sucesso!`);
      setTimeout(() => setImportResult(null), 5000);
    },
  });

  const deleteDoctorsMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => base44.entities.Doctor.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setSelectedDoctors([]);
      showToast('Médicos eliminados com sucesso!');
    },
  });

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
    if (confirm(`Eliminar ${selectedDoctors.length} médico(s)?`)) {
      deleteDoctorsMutation.mutate(selectedDoctors);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extract data from file
      const jsonSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            specialty: { type: "string" },
            phone: { type: "string" }
          },
          required: ["name", "specialty"]
        }
      };

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: jsonSchema
      });

      if (result.status === 'success' && result.output) {
        // Map specialties to match enum
        const specialtyMap = {
          'cirurgia geral': 'CIRURGIA GERAL',
          'cirurgia': 'CIRURGIA GERAL',
          'clinica medica': 'CLÍNICA MÉDICA',
          'clinica': 'CLÍNICA MÉDICA',
          'pediatria': 'PEDIATRIA',
          'ginecologia': 'GINECOLOGIA',
          'ortopedia': 'ORTOPEDIA',
          'anestesia': 'ANESTESIA',
          'anestesiologia': 'ANESTESIA'
        };

        const doctors = result.output.map(d => ({
          name: d.name,
          specialty: specialtyMap[d.specialty?.toLowerCase()] || 'OUTRA',
          phone: d.phone || ''
        }));

        createDoctorsMutation.mutate(doctors);
      } else {
        showToast('Erro ao processar arquivo: ' + (result.details || 'Formato inválido'), 'error');
      }
    } catch (error) {
      showToast('Erro ao importar arquivo: ' + error.message, 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Upload size={20} className="text-white" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">Importar Médicos</h4>
            <p className="text-xs text-slate-500">Excel, CSV ou PDF</p>
          </div>
        </div>
        {doctors.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
            >
              {selectedDoctors.length === doctors.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
            {selectedDoctors.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteDoctorsMutation.isPending}
                className="flex items-center gap-1 text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} />
                Eliminar ({selectedDoctors.length})
              </button>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        id="doctor-file-upload"
        accept=".csv,.xlsx,.xls,.pdf"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isUploading}
      />

      <label
        htmlFor="doctor-file-upload"
        className={`flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase cursor-pointer hover:bg-blue-700 transition-colors ${
          isUploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <FileText size={16} />
            Selecionar Arquivo
          </>
        )}
      </label>

      {importResult && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <p className="text-xs font-bold text-green-700">
            {importResult.count} médicos importados
          </p>
        </div>
      )}

      <div className="mt-4 p-3 bg-white rounded-xl">
        <p className="text-[9px] font-bold text-slate-500 mb-2 uppercase">Formato esperado:</p>
        <div className="text-[10px] text-slate-600 font-mono bg-slate-50 p-2 rounded">
          Nome | Especialidade | Telefone<br/>
          Dr. João Silva | Cirurgia Geral | 912345678<br/>
          Dra. Maria Santos | Pediatria | 913456789
        </div>
      </div>

      {doctors.length > 0 && (
        <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
          {doctors.map(doctor => (
            <div 
              key={doctor.id}
              className="flex items-center gap-2 p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedDoctors.includes(doctor.id)}
                onChange={() => toggleSelectDoctor(doctor.id)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{doctor.name}</p>
                <p className="text-[9px] text-slate-500">{doctor.specialty}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}