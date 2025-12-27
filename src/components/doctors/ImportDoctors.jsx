import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tantml:react-query';
import { FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportDoctors({ showToast }) {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const createDoctorsMutation = useMutation({
    mutationFn: (doctors) => base44.entities.Doctor.bulkCreate(doctors),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setImportResult({ success: true, count: data.length });
      showToast(`${data.length} médicos importados com sucesso!`);
      setTimeout(() => setImportResult(null), 5000);
    },
  });

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
        setImportResult({ success: false, error: result.details || 'Erro ao processar ficheiro' });
      }
    } catch (error) {
      setImportResult({ success: false, error: error.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 rounded-[2.5rem] border-2 border-green-200 dark:border-green-800 shadow-sm">
      <h2 className="text-xl font-black mb-6 flex items-center gap-2 dark:text-white">
        <FileSpreadsheet className="text-green-600 dark:text-green-400" size={24} /> 
        Importar do Google Sheets
      </h2>

      {!importResult && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,.xlsx,.xls,image/*,.pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white font-black py-5 rounded-2xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-green-200 dark:shadow-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={24} />
            {isUploading ? 'A processar ficheiro...' : 'Selecionar Ficheiro do Google Sheets'}
          </button>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Aceita CSV, Excel, imagem ou PDF exportado do Google Sheets
          </p>

          <div className="mt-6 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3 mb-3">
              <FileSpreadsheet className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1">Como Exportar do Google Sheets:</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Ficheiro → Transferir → Valores separados por vírgulas (.csv)
                </p>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-xl font-mono text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
              <span className="text-green-600 dark:text-green-400 font-black">Nome,Especialidade,Telefone</span><br/>
              Dr. João Silva,CIRURGIA GERAL,912345678<br/>
              Dra. Maria Santos,PEDIATRIA,913456789
            </div>
          </div>
        </>
      )}

      {importResult && (
        <div className={`p-6 rounded-2xl flex items-center gap-4 ${
          importResult.success 
            ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800'
        }`}>
          {importResult.success ? (
            <>
              <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
              <div>
                <p className="font-black text-green-700 dark:text-green-300 text-lg">
                  {importResult.count} médicos importados!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Os dados foram adicionados com sucesso
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
              <div>
                <p className="font-black text-red-700 dark:text-red-300">Erro na importação</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{importResult.error}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}