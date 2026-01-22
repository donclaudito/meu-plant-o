import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';

export default function PixImportModal({ isOpen, onClose, doctors, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Confirm details
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [extractedData, setExtractedData] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', user?.email],
    queryFn: async () => {
      const allShifts = await base44.entities.Shift.list('-date');
      return allShifts.filter(s => s.created_by === user?.email);
    },
    enabled: !!user,
  });

  const availableDoctors = useMemo(() => {
      const uniqueDoctorsMap = new Map();
      shifts.forEach(s => {
        const normalizedName = s.doctorName.toUpperCase();
        if (!uniqueDoctorsMap.has(normalizedName)) {
          uniqueDoctorsMap.set(normalizedName, s.doctorName);
        }
      });
      return Array.from(uniqueDoctorsMap.values()).sort();
    }, [shifts]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    setError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFileUrl(file_url);
      setStep(2);
    } catch (err) {
      setError('Erro ao carregar ficheiro. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessReceipt = async () => {
    if (!selectedDoctor) {
      setError('Selecione um médico');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data } = await base44.functions.invoke('processPixReceipt', {
        fileUrl: uploadedFileUrl,
        doctorName: selectedDoctor,
        month: selectedMonth,
        year: selectedYear
      });

      setResult(data);
      setExtractedData(data);

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['manualPayments'] });
        queryClient.invalidateQueries({ queryKey: ['discounts'] });
        
        setTimeout(() => {
          onSuccess?.();
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar recibo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadedFileUrl(null);
    setSelectedDoctor('');
    setExtractedData(null);
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-purple-600" />
            Importar PIX
          </h3>
          <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {step === 1 && !result && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Carregue o comprovativo PIX para extrair automaticamente o valor e a data.</p>
              
              <label className="flex items-center justify-center gap-3 w-full py-8 border-2 border-dashed border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 rounded-2xl cursor-pointer hover:border-purple-500 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading ? (
                  <>
                    <Sparkles size={20} className="text-purple-600 animate-spin" />
                    <span className="font-black text-purple-600">A carregar...</span>
                  </>
                ) : (
                  <>
                    <Upload size={20} className="text-purple-600" />
                    <span className="font-black text-purple-600">Selecionar ficheiro</span>
                  </>
                )}
              </label>

              {selectedFile && (
                <p className="text-xs text-slate-500 text-center">Ficheiro selecionado: {selectedFile.name}</p>
              )}
            </div>
          )}

          {/* Step 2: Confirm Details */}
          {step === 2 && !result && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">Confirme os detalhes do pagamento PIX:</p>

              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Médico</label>
                <select
                  value={selectedDoctor}
                  onChange={(e) => setSelectedDoctor(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold border-none focus:ring-2 focus:ring-purple-600 text-slate-900 dark:text-white"
                >
                  <option value="">Selecione um médico</option>
                  {availableDoctors.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Mês</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold border-none focus:ring-2 focus:ring-purple-600 text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Ano</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold border-none focus:ring-2 focus:ring-purple-600 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button
                onClick={handleProcessReceipt}
                disabled={isProcessing || !selectedDoctor}
                className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Sparkles size={16} className="animate-spin" />
                    A processar...
                  </>
                ) : (
                  'Processar Recibo'
                )}
              </button>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
              </div>

              <div className="text-center">
                <h4 className="font-black text-lg text-slate-900 dark:text-white mb-4">Recibo Processado!</h4>
                
                <div className="space-y-3 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 font-bold uppercase mb-1">Valor PIX Recebido</p>
                    <p className="text-2xl font-black text-blue-900 dark:text-blue-200">
                      R$ {result.pixValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-100 dark:bg-slate-700 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Faturamento Bruto</p>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        R$ {result.grossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-xl">
                      <p className="text-[10px] text-red-700 dark:text-red-400 font-bold uppercase">Desconto Calculado</p>
                      <p className="text-lg font-black text-red-700 dark:text-red-300">
                        R$ {result.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {result.shiftsCount} plantão{result.shiftsCount !== 1 ? 'ões' : ''} registado{result.shiftsCount !== 1 ? 's' : ''} processado{result.shiftsCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center">
                A fechar automaticamente...
              </p>
            </div>
          )}

          {/* Error Result */}
          {result && !result.success && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
              </div>

              <div className="text-center">
                <h4 className="font-black text-lg text-red-700 dark:text-red-400 mb-2">Erro ao Processar</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">{result.error}</p>
              </div>

              <button
                onClick={() => {
                  setStep(1);
                  setResult(null);
                  setError(null);
                }}
                className="w-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-black py-3 rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}