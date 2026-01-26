import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileSpreadsheet, CheckCircle, AlertCircle, Download, Link as LinkIcon } from 'lucide-react';

export default function ImportShifts({ showToast }) {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importMode, setImportMode] = useState('file'); // 'file' or 'sheets'
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [isImportingSheets, setIsImportingSheets] = useState(false);
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

  const handleGoogleSheetsImport = async () => {
    if (!spreadsheetUrl.trim()) {
      setImportResult({ success: false, error: 'Por favor, insira a URL da planilha' });
      return;
    }

    // Extract spreadsheet ID from URL
    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      setImportResult({ success: false, error: 'URL inválida. Use o link completo do Google Sheets' });
      return;
    }

    const spreadsheetId = match[1];
    setIsImportingSheets(true);
    setImportResult(null);

    try {
      const response = await base44.functions.invoke('importFromGoogleSheets', { spreadsheetId });
      
      if (response.data.success) {
        setImportResult({ success: true, count: response.data.count, errors: response.data.errors });
        showToast(`${response.data.count} plantões importados!`);
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        setSpreadsheetUrl('');
        setTimeout(() => setImportResult(null), 5000);
      } else {
        setImportResult({ success: false, error: response.data.error || 'Erro ao importar' });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ 
        success: false, 
        error: error.response?.data?.error || error.message || 'Erro ao importar. Verifique se a planilha está compartilhada publicamente ou com sua conta Google.' 
      });
    } finally {
      setIsImportingSheets(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black flex items-center gap-2 dark:text-white">
          <FileSpreadsheet className="text-blue-600 dark:text-blue-400" size={20} /> 
          Importar Plantões
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
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setImportMode('file')}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs transition-all ${
                importMode === 'file'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              📄 Ficheiro
            </button>
            <button
              onClick={() => setImportMode('sheets')}
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs transition-all ${
                importMode === 'sheets'
                  ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              }`}
            >
              📊 Google Sheets
            </button>
          </div>

          {importMode === 'file' ? (
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
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-black py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FileSpreadsheet size={18} />
                {isUploading ? 'A processar...' : 'Selecionar Ficheiro'}
              </button>
              <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2 font-medium">
                CSV, Excel, imagem ou PDF
              </p>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <input
                  type="text"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  placeholder="Cole o link do Google Sheets aqui..."
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 font-medium text-sm"
                />
                <button
                  onClick={handleGoogleSheetsImport}
                  disabled={isImportingSheets || !spreadsheetUrl.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-black py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 dark:hover:from-blue-600 dark:hover:to-indigo-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <LinkIcon size={18} />
                  {isImportingSheets ? 'A importar...' : 'Importar do Google Sheets'}
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Cole a URL completa da planilha do Google Sheets
              </p>
            </>
          )}

          <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={16} />
              <div>
                <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 mb-1">💡 Dica:</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">
                  {importMode === 'file' 
                    ? 'Clique em "Modelo" para descarregar o exemplo.'
                    : 'A planilha deve ter colunas: Data, Hospital, Médico, Especialidade, Tipo, Horas, Valor, Status'}
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
              <div className="flex-1">
                <p className="font-black text-green-700 dark:text-green-300 text-lg">
                  {importResult.count} plantões importados!
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Os dados foram adicionados com sucesso
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-yellow-600 dark:text-yellow-400 cursor-pointer">
                      ⚠️ {importResult.errors.length} linhas com avisos
                    </summary>
                    <ul className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-1 ml-4 list-disc">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && <li>... e mais {importResult.errors.length - 5}</li>}
                    </ul>
                  </details>
                )}
              </div>
            </>
          ) : (
            <>
              <AlertCircle className="text-red-600 dark:text-red-400" size={32} />
              <div className="flex-1">
                <p className="font-black text-red-700 dark:text-red-300">Erro na importação</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 whitespace-pre-wrap">{importResult.error}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}