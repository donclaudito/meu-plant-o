import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function PricingSettings({ user, showToast }) {
  const [hourlyRate, setHourlyRate] = useState(150);
  const [shift12hValue, setShift12hValue] = useState(1800);
  const [shift24hValue, setShift24hValue] = useState(3000);
  const [loading, setLoading] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const userData = await base44.auth.me();
        setHourlyRate(userData.hourlyRate || 150);
        setShift12hValue(userData.shift12hValue || 1800);
        setShift24hValue(userData.shift24hValue || 3000);
      } catch (e) {
        console.error('Error loading settings:', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      showToast('Configurações salvas!');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ hourlyRate, shift12hValue, shift24hValue });
  };

  const calculateShiftValue = (hours) => {
    const calculatedHourlyRate = shift12hValue / 12;
    if (hours === 24) return shift24hValue;
    if (hours === 12) return shift12hValue;
    return Math.round(calculatedHourlyRate * hours);
  };
  
  const calculatedHourlyRate = shift12hValue / 12;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
      <h3 className="text-xl font-black mb-6 flex items-center gap-2">
        <DollarSign className="text-green-600" /> Valores e Tarifas
      </h3>
      
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Valor por Hora (R$)
            </label>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
              min="0"
              step="10"
            />
            <p className="text-[9px] text-slate-500 ml-1">Base para cálculo de 6h, 18h, etc.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Valor Plantão 12h (R$)
            </label>
            <input
              type="number"
              value={shift12hValue}
              onChange={(e) => setShift12hValue(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
              min="0"
              step="100"
            />
            <p className="text-[9px] text-slate-500 ml-1">Referência para 12h Dia/Noite</p>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Valor Plantão 24h (R$)
            </label>
            <input
              type="number"
              value={shift24hValue}
              onChange={(e) => setShift24hValue(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-100 rounded-2xl font-bold border-none focus:ring-2 focus:ring-blue-600"
              min="0"
              step="100"
            />
            <p className="text-[9px] text-slate-500 ml-1">Valor fixo para 24h</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h4 className="text-sm font-black text-blue-900 mb-3">Valores Calculados</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase">6h</p>
              <p className="text-lg font-black text-blue-900">R$ {calculateShiftValue(6)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase">12h</p>
              <p className="text-lg font-black text-blue-900">R$ {calculateShiftValue(12)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase">18h</p>
              <p className="text-lg font-black text-blue-900">R$ {calculateShiftValue(18)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase">24h</p>
              <p className="text-lg font-black text-blue-900">R$ {calculateShiftValue(24)}</p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={updateSettingsMutation.isPending}
          className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {updateSettingsMutation.isPending ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          Salvar Configurações
        </button>
      </form>
    </div>
  );
}