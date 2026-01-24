import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Wallet, Trash2, Calendar, Upload, Sparkles } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function DepositsModule({ currentMonth, currentYear, showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedReferenceMonth, setSelectedReferenceMonth] = useState(null);
  const [newDeposit, setNewDeposit] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    value: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });
  const [isExtracting, setIsExtracting] = useState(false);

  const queryClient = useQueryClient();

  const { data: deposits = [] } = useQuery({
    queryKey: ['deposits'],
    queryFn: () => base44.entities.Deposit.list('-date'),
  });

  const createDepositMutation = useMutation({
    mutationFn: (data) => base44.entities.Deposit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setShowForm(false);
      setNewDeposit({ date: new Date().toISOString().split('T')[0], description: '', value: 0 });
      showToast('Depósito registado!');
    },
  });

  const deleteDepositMutation = useMutation({
    mutationFn: (id) => base44.entities.Deposit.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
      showToast('Depósito removido!');
    },
  });

  const filteredDeposits = useMemo(() => {
    return deposits.filter(deposit => {
      const [year, month] = deposit.date.split('-').map(Number);
      
      if (selectedReferenceMonth !== null) {
        // Mês de referência dos plantões (ex: Dezembro)
        const refMonth = selectedReferenceMonth;
        const refYear = currentYear;
        
        // Mês de pagamento (mês seguinte ao de referência)
        let paymentMonth = refMonth + 2; // +1 para o mês seguinte, +1 porque month já está em 1-12
        let paymentYear = refYear;
        
        if (paymentMonth > 12) {
          paymentMonth = 1;
          paymentYear = refYear + 1;
        }
        
        return month === paymentMonth && year === paymentYear;
      }
      
      return month === currentMonth + 1 && year === currentYear;
    });
  }, [deposits, currentMonth, currentYear, selectedReferenceMonth]);

  const totalDeposits = useMemo(() => {
    return filteredDeposits.reduce((acc, deposit) => acc + (Number(deposit.value) || 0), 0);
  }, [filteredDeposits]);

  const handleSubmit = (e) => {
    e.preventDefault();
    createDepositMutation.mutate(newDeposit);
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
            date: { type: "string", description: "Data do depósito no formato YYYY-MM-DD" },
            value: { type: "number", description: "Valor do depósito em número" },
            description: { type: "string", description: "Descrição ou observações sobre o depósito" }
          },
          required: ["date", "value"]
        }
      });

      if (result.status === 'success' && result.output) {
        setNewDeposit({
          date: result.output.date || new Date().toISOString().split('T')[0],
          value: result.output.value || 0,
          description: result.output.description || ''
        });
        showToast('Dados extraídos com sucesso!');
      } else {
        showToast('Erro ao extrair dados do comprovante');
      }
    } catch (error) {
      showToast('Erro ao processar arquivo');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black flex items-center gap-2">
          <Wallet className="text-blue-600" /> Depósitos Bancários
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          {showForm ? 'Cancelar' : 'Adicionar'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-blue-50 p-6 rounded-2xl mb-6 border border-blue-100">
          <div className="mb-4">
            <label className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <input
                type="date"
                value={newDeposit.date}
                onChange={(e) => setNewDeposit({...newDeposit, date: e.target.value})}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
              <input
                type="number"
                value={newDeposit.value}
                onChange={(e) => setNewDeposit({...newDeposit, value: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <input
              type="text"
              value={newDeposit.description}
              onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
              className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
              placeholder="Descrição opcional"
            />
          </div>
          <button
            type="submit"
            disabled={createDepositMutation.isPending}
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Guardar Depósito
          </button>
        </form>
      )}

      <div className="mb-6">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">
          Filtrar por Mês de Referência dos Plantões
        </label>
        <select
          value={selectedReferenceMonth === null ? '' : selectedReferenceMonth}
          onChange={(e) => setSelectedReferenceMonth(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full px-4 py-3 bg-white rounded-2xl font-bold border border-slate-300 focus:ring-2 focus:ring-blue-600"
        >
          <option value="">Mês Atual ({monthNames[currentMonth]} {currentYear})</option>
          {monthNames.map((name, index) => (
            <option key={index} value={index}>
              {name} {currentYear} → Pago em {monthNames[(index + 1) % 12]} {index === 11 ? currentYear + 1 : currentYear}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 mb-6">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
          {selectedReferenceMonth !== null 
            ? `Depósitos de ${monthNames[(selectedReferenceMonth + 1) % 12]} ${selectedReferenceMonth === 11 ? currentYear + 1 : currentYear} (Ref: ${monthNames[selectedReferenceMonth]})`
            : 'Total Depositado'}
        </p>
        <p className="text-4xl font-black text-blue-700">R$ {totalDeposits.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="space-y-2">
        {filteredDeposits.map(deposit => (
          <div key={deposit.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors border border-slate-100">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-blue-600" />
              <div>
                <span className="text-xs font-black text-slate-900">{new Date(deposit.date + 'T00:00:00').toLocaleDateString('pt-PT')}</span>
                {deposit.description && <p className="text-[10px] text-slate-500 mt-1">{deposit.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-lg text-blue-700">R$ {deposit.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <button
                onClick={() => setDeleteConfirmation({ isOpen: true, id: deposit.id, name: 'Depósito' })}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredDeposits.length === 0 && (
          <p className="text-center text-slate-400 py-8">Nenhum depósito registado</p>
        )}
      </div>

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => deleteDepositMutation.mutate(deleteConfirmation.id)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}