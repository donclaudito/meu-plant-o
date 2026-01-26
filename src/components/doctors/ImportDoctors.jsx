import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

    // Validar tipo de arquivo
    if (!file.name.endsWith('.csv')) {
      setImportResult({ success: false, error: 'Por favor, selecione apenas arquivos CSV' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      // Ler CSV diretamente
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setImportResult({ success: false, error: 'Arquivo CSV vazio ou inválido' });
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Processar cabeçalhos
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIndex = headers.findIndex(h => h === 'name' || h === 'nome');
      const specialtyIndex = headers.findIndex(h => h === 'specialty' || h === 'especialidade');
      const phoneIndex = headers.findIndex(h => h === 'phone' || h === 'telefone');

      if (nameIndex === -1 || specialtyIndex === -1) {
        setImportResult({ success: false, error: 'CSV deve conter colunas "name" e "specialty"' });
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Map specialties
      const specialtyMap = {
        'cirurgia geral': 'CIRURGIA GERAL',
        'cirurgia': 'CIRURGIA GERAL',
        'clinica medica': 'CLÍNICA MÉDICA',
        'clínica médica': 'CLÍNICA MÉDICA',
        'clinica': 'CLÍNICA MÉDICA',
        'pediatria': 'PEDIATRIA',
        'ginecologia': 'GINECOLOGIA',
        'ortopedia': 'ORTOPEDIA',
        'anestesia': 'ANESTESIA',
        'anestesiologia': 'ANESTESIA'
      };

      // Processar dados
      const doctors = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values[nameIndex] && values[specialtyIndex]) {
          doctors.push({
            name: values[nameIndex],
            specialty: specialtyMap[values[specialtyIndex]?.toLowerCase()] || values[specialtyIndex] || 'OUTRA',
            phone: phoneIndex !== -1 ? (values[phoneIndex] || '') : ''
          });
        }
      }

      if (doctors.length === 0) {
        setImportResult({ success: false, error: 'Nenhum médico válido encontrado no CSV' });
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      createDoctorsMutation.mutate(doctors);
    } catch (error) {
      setImportResult({ success: false, error: error.message || 'Erro ao processar arquivo' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 shadow-sm">
      <h2 className="text-lg font-black mb-4 flex items-center gap-2 dark:text-white">
        <FileSpreadsheet className="text-green-600 dark:text-green-400" size={20} /> 
        Importar Médicos
      </h2>

      {!importResult && (
        <>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 text-white font-black py-3 rounded-xl hover:from-green-700 hover:to-emerald-700 dark:hover:from-green-600 dark:hover:to-emerald-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200 dark:shadow-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            <FileSpreadsheet size={18} />
            {isUploading ? 'A processar...' : 'Selecionar Ficheiro'}
          </button>
          <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Apenas arquivos CSV
          </p>

          <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="text-green-600 dark:text-green-400 flex-shrink-0" size={16} />
              <div>
                <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 mb-1">💡 Dica:</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">
                  Use o botão <span className="font-bold text-green-600 dark:text-green-400">"Modelo"</span> na lista abaixo para descarregar exemplo.
                </p>
              </div>
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