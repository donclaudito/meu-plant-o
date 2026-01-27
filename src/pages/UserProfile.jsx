import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Save, Plus, X, Loader2, DollarSign, Tags } from 'lucide-react';
import Toast from '@/components/common/Toast';

export default function UserProfile() {
  const [message, setMessage] = useState(null);
  const [newDiscountType, setNewDiscountType] = useState('');
  const [formData, setFormData] = useState({
    discountTypes: [],
    shift6hValue: '',
    shift12hValue: '',
    shift24hValue: '',
    hourlyRate: ''
  });

  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        discountTypes: user.discountTypes || [],
        shift6hValue: user.shift6hValue || '',
        shift12hValue: user.shift12hValue || '',
        shift24hValue: user.shift24hValue || '',
        hourlyRate: user.hourlyRate || ''
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      // Limpar campos vazios (enviar como null ou undefined)
      const cleanData = {
        discountTypes: data.discountTypes,
        shift6hValue: data.shift6hValue !== '' ? Number(data.shift6hValue) : undefined,
        shift12hValue: data.shift12hValue !== '' ? Number(data.shift12hValue) : undefined,
        shift24hValue: data.shift24hValue !== '' ? Number(data.shift24hValue) : undefined,
        hourlyRate: data.hourlyRate !== '' ? Number(data.hourlyRate) : undefined,
      };
      await base44.auth.updateMe(cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error) => {
      setMessage({ text: 'Erro ao atualizar perfil: ' + error.message, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
    }
  });

  const handleAddDiscountType = () => {
    if (newDiscountType.trim() && !formData.discountTypes.includes(newDiscountType.trim())) {
      setFormData({
        ...formData,
        discountTypes: [...formData.discountTypes, newDiscountType.trim()]
      });
      setNewDiscountType('');
    }
  };

  const handleRemoveDiscountType = (index) => {
    setFormData({
      ...formData,
      discountTypes: formData.discountTypes.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">A carregar perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-1">Meu Perfil</h1>
            <p className="text-blue-100 font-medium">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipos de Desconto Personalizados */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 dark:text-white">
            <Tags className="text-purple-600 dark:text-purple-400" size={24} />
            Tipos de Desconto Personalizados
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Adicione tipos de desconto personalizados que aparecerão nas opções de descontos globais.
          </p>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newDiscountType}
              onChange={(e) => setNewDiscountType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddDiscountType())}
              placeholder="Digite um novo tipo de desconto..."
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-purple-600 dark:focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={handleAddDiscountType}
              className="px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-2xl font-black hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Adicionar
            </button>
          </div>

          {formData.discountTypes.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase mb-2">
                Tipos Registados ({formData.discountTypes.length})
              </p>
              {formData.discountTypes.map((type, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl group hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <span className="font-bold text-slate-900 dark:text-white">{type}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDiscountType(index)}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-all"
                  >
                    <X size={16} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-2xl">
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                Nenhum tipo de desconto personalizado adicionado ainda.
              </p>
            </div>
          )}
        </div>

        {/* Valores de Plantão */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-xl font-black mb-4 flex items-center gap-2 dark:text-white">
            <DollarSign className="text-green-600 dark:text-green-400" size={24} />
            Valores Padrão de Plantão
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Configure os valores padrão para diferentes tipos de plantão. Deixe em branco para não definir.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Plantão 6h (€)
              </label>
              <input
                type="number"
                value={formData.shift6hValue}
                onChange={(e) => setFormData({ ...formData, shift6hValue: e.target.value })}
                placeholder="Ex: 900"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500"
                min="0"
                step="50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Plantão 12h (€)
              </label>
              <input
                type="number"
                value={formData.shift12hValue}
                onChange={(e) => setFormData({ ...formData, shift12hValue: e.target.value })}
                placeholder="Ex: 1800"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500"
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Plantão 24h (€)
              </label>
              <input
                type="number"
                value={formData.shift24hValue}
                onChange={(e) => setFormData({ ...formData, shift24hValue: e.target.value })}
                placeholder="Ex: 3000"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500"
                min="0"
                step="100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                Taxa Horária (€/h)
              </label>
              <input
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                placeholder="Ex: 150"
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border-none focus:ring-2 focus:ring-green-600 dark:focus:ring-green-500"
                min="0"
                step="10"
              />
            </div>
          </div>

          {(formData.shift6hValue || formData.hourlyRate) && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl p-4">
              <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 mb-2">ℹ️ Informação</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Estes valores serão usados como padrão ao criar novos plantões e para cálculos em relatórios.
              </p>
            </div>
          )}
        </div>

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={updateUserMutation.isPending}
          className="w-full bg-blue-600 dark:bg-blue-500 text-white font-black py-4 rounded-2xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 dark:shadow-blue-900/30 disabled:opacity-50"
        >
          {updateUserMutation.isPending ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} />
          )}
          {updateUserMutation.isPending ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </form>
    </div>
  );
}