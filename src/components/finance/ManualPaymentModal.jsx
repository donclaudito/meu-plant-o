import React, { useState } from 'react';
import { X, CheckCircle, Upload, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ManualPaymentModal({ isOpen, onClose, onSave }) {
  const [newPayment, setNewPayment] = useState({
    date: new Date().toISOString().split('T')[0],
    value: 0,
    description: ''
  });
  const [isExtracting, setIsExtracting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(newPayment);
    setNewPayment({ date: new Date().toISOString().split('T')[0], value: 0, description: '' });
    onClose();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: "object",
          properties: {
            date: { type: "string", description: "Data do pagamento no formato YYYY-MM-DD" },
            value: { type: "number", description: "Valor do pagamento em número" },
            description: { type: "string", description: "Descrição ou observações sobre o pagamento" }
          },
          required: ["date", "value"]
        }
      });

      if (result.status === 'success' && result.output) {
        setNewPayment({
          date: result.output.date || new Date().toISOString().split('T')[0],
          value: result.output.value || 0,
          description: result.output.description || ''
        });
      }
    } catch (error) {
      console.error('Erro ao processar arquivo');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-2xl">Registar Pagamento Recebido</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="mb-4">
            <label className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-black text-xs uppercase cursor-pointer hover:from-green-700 hover:to-emerald-700 transition-all">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isExtracting}
              />
              {isExtracting ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  A extrair dados...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Carregar Comprovante (IA)
                </>
              )}
            </label>
            <p className="text-[9px] text-slate-500 text-center mt-2">JPG, PNG ou PDF • A IA extrairá data e valor automaticamente</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <input 
                type="date" 
                required 
                value={newPayment.date} 
                onChange={e => setNewPayment({ ...newPayment, date: e.target.value })} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-green-600" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
              <input 
                type="number" 
                required 
                value={newPayment.value} 
                onChange={e => setNewPayment({ ...newPayment, value: Number(e.target.value) })} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-green-600"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <input 
              type="text" 
              value={newPayment.description} 
              onChange={e => setNewPayment({ ...newPayment, description: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-green-600"
              placeholder="Descrição opcional"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-5 bg-green-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-green-100 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} /> Registar Pagamento
          </button>
        </form>
      </div>
    </div>
  );
}