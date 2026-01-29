import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Trash2, Calendar, Upload, Sparkles } from 'lucide-react';
import DeleteConfirmation from '@/components/common/DeleteConfirmation';

const incomeTypes = ["Consulta SUS", "Cirurgia CO", "Ambulatório", "Cirurgia", "Bónus", "Aposentadoria", "Outro"];

export default function ExtraIncomeModule({ currentMonth, currentYear, showToast, doctors = [] }) {
  const [showForm, setShowForm] = useState(false);
  const [newIncome, setNewIncome] = useState({
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    doctorName: '',
    type: 'Consulta SUS',
    description: '',
    value: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: '', name: '' });
  const [isExtracting, setIsExtracting] = useState(false);

  const queryClient = useQueryClient();

  const { data: extraIncomes = [] } = useQuery({
    queryKey: ['extraIncomes'],
    queryFn: () => base44.entities.ExtraIncome.list('-date'),
  });

  const createIncomeMutation = useMutation({
    mutationFn: (data) => base44.entities.ExtraIncome.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraIncomes'] });
      setShowForm(false);
      setNewIncome({ date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`, doctorName: '', type: 'Consulta SUS', description: '', value: 0 });
      showToast('Receita adicionada!');
    },
  });

  const deleteIncomeMutation = useMutation({
    mutationFn: (id) => base44.entities.ExtraIncome.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extraIncomes'] });
      setDeleteConfirmation({ isOpen: false, id: '', name: '' });
      showToast('Receita removida!');
    },
  });

  const filteredIncomes = useMemo(() => {
    return extraIncomes.filter(income => {
      const [year, month] = income.date.split('-').map(Number);
      return month === currentMonth + 1 && year === currentYear;
    });
  }, [extraIncomes, currentMonth, currentYear]);

  const totalExtra = useMemo(() => {
    return filteredIncomes.reduce((acc, income) => acc + (Number(income.value) || 0), 0);
  }, [filteredIncomes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert YYYY-MM to YYYY-MM-01 for storage
    const incomeData = {
      ...newIncome,
      date: `${newIncome.date}-01`
    };
    createIncomeMutation.mutate(incomeData);
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
            date: { type: "string", description: "Data da receita no formato YYYY-MM-DD" },
            value: { type: "number", description: "Valor da receita em número" },
            type: { 
              type: "string", 
              enum: ["Ambulatório", "Cirurgia", "Bónus", "Aposentadoria", "Outro"],
              description: "Tipo de receita: Ambulatório para consultas, Cirurgia para procedimentos cirúrgicos, Bónus para pagamentos extras, Aposentadoria para pensão, Outro para demais"
            },
            description: { type: "string", description: "Descrição ou observações sobre a receita" }
          },
          required: ["date", "value", "type"]
        }
      });

      if (result.status === 'success' && result.output) {
        // Extract year and month from the date
        const extractedDate = result.output.date || new Date().toISOString().split('T')[0];
        const [year, month] = extractedDate.split('-');
        setNewIncome({
          date: `${year}-${month}`,
          value: result.output.value || 0,
          type: result.output.type || 'Outro',
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
          <DollarSign className="text-green-600" /> Receitas Extras
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase hover:bg-green-700 transition-colors"
        >
          <Plus size={14} />
          {showForm ? 'Cancelar' : 'Adicionar'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-green-50 p-6 rounded-2xl mb-6 border border-green-100">
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
            <p className="text-[9px] text-slate-500 text-center mt-2">JPG, PNG ou PDF • A IA extrairá data, valor e tipo automaticamente</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Médico Responsável</label>
              <select
                value={newIncome.doctorName}
                onChange={(e) => setNewIncome({...newIncome, doctorName: e.target.value})}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600"
                required
              >
                <option value="">Selecione</option>
                {doctors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês e Ano</label>
              <input
                type="month"
                value={newIncome.date}
                onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
              <select
                value={newIncome.type}
                onChange={(e) => setNewIncome({...newIncome, type: e.target.value})}
                className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600"
              >
                {incomeTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
            <input
              type="text"
              value={newIncome.description}
              onChange={(e) => setNewIncome({...newIncome, description: e.target.value})}
              className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600"
              placeholder="Descrição opcional"
            />
          </div>
          <div className="mb-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
            <input
              type="number"
              value={newIncome.value}
              onChange={(e) => setNewIncome({...newIncome, value: Number(e.target.value)})}
              className="w-full px-4 py-3 bg-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600"
              step="0.01"
              min="0"
              required
            />
          </div>
          <button
            type="submit"
            disabled={createIncomeMutation.isPending}
            className="w-full bg-green-600 text-white font-black py-4 rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            Guardar Receita
          </button>
        </form>
      )}

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200 mb-6">
        <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2">Total Receitas Extras</p>
        <p className="text-4xl font-black text-green-700">R$ {totalExtra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      </div>

      <div className="space-y-2">
        {filteredIncomes.map(income => (
          <div key={income.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-green-50 transition-colors border border-slate-100">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-green-600" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">{new Date(income.date + 'T00:00:00').toLocaleDateString('pt-PT')}</span>
                  <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{income.type}</span>
                </div>
                <p className="text-[10px] font-bold text-blue-600 mt-1">{income.doctorName}</p>
                {income.description && <p className="text-[10px] text-slate-500 mt-1">{income.description}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-black text-lg text-green-700">R$ {income.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              <button
                onClick={() => setDeleteConfirmation({ isOpen: true, id: income.id, name: income.type })}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredIncomes.length === 0 && (
          <p className="text-center text-slate-400 py-8">Nenhuma receita extra registada</p>
        )}
      </div>

      <DeleteConfirmation 
        isOpen={deleteConfirmation.isOpen}
        name={deleteConfirmation.name}
        onConfirm={() => deleteIncomeMutation.mutate(deleteConfirmation.id)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}