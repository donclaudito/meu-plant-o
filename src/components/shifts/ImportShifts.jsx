import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react';

export default function ImportShifts({ showToast }) {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const createShiftsMutation = useMutation({
    mutationFn: async (shifts) => {
      return await base44.entities.Shift.bulkCreate(shifts);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setImportResult({ success: true, count: data.length });
      showToast(`${data.length} plantões importados com sucesso!`);
      setTimeout(() => setImportResult(null), 5000);
    },
  });

  const downloadTemplate = () => {
    const csvContent = `date,unit,doctorName,specialty,type,value,hours,paid
2025-01-15,Hospital Central,Dr. Silva,CIRURGIA GERAL,12h Dia,1800,12,false
2025-01-16,Clínica Norte,Dra. Costa,PEDIATRIA,24h,3000,24,true`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_plantoes.csv';
    link.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const jsonSchema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data no formato YYYY-MM-DD" },
            unit: { type: "string", description: "Nome do hospital/unidade" },
            doctorName: { type: "string", description: "Nome do médico" },
            specialty: { type: "string", description: "Especialidade" },
            type: { type: "string", description: "Tipo: 12h Dia, 12h Noite, 24h, 6h Dia, 6h Noite" },
            value: { type: "number", description: "Valor em euros" },
            hours: { type: "number", description: "Horas trabalhadas" },
            paid: { type: "boolean", description: "Se foi pago (true/false)" }
          },
          required: ["date", "unit", "doctorName", "specialty", "type", "value", "hours"]
        }
      };

      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: jsonSchema
      });

      if (result.status === 'success' && result.output) {
        const shifts = result.output.map(shift => ({
          ...shift,
          paid: shift.paid || false
        }));
        createShiftsMutation.mutate(shifts);
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-[2.5rem] border-2 border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black flex items-center gap-2 dark:text-white">
          <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={24} /> 
          Importar Plantões do Google Sheets
        </h2>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors text-xs font-bold border border-blue-200 dark:border-blue-700 shadow-sm"
          title="Descarregar modelo CSV"
        >
          <Download size={14} />
          Modelo
        </button>
      </div>

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
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-black py-5 rounded-2xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200 dark:shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={24} />
            {isUploading ? 'A processar ficheiro...' : 'Selecionar Ficheiro do Google Sheets'}
          </button>
          <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Aceita CSV, Excel, imagem ou PDF exportado do Google Sheets
          </p>

          <div className="mt-6 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
              <div>
                <p className="text-xs font-black text-slate-700 dark:text-slate-300 mb-1">💡 Dica Rápida:</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Clique no botão <span className="font-bold text-blue-600 dark:text-blue-400">"Modelo"</span> acima para descarregar um ficheiro de exemplo. Edite-o no Google Sheets ou Excel e depois faça o upload aqui.
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
                  {importResult.count} plantões importados!
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