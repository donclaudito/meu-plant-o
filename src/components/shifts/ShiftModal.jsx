import React, { useState, useEffect } from 'react';
import { X, Save, Calculator } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

export default function ShiftModal({ isOpen, onClose, onSave, doctors, hospitals, initialDate }) {
  const [newShift, setNewShift] = useState({
    date: new Date().toISOString().split('T')[0],
    unit: '',
    doctorName: '',
    specialty: 'CIRURGIA GERAL',
    type: '12h Dia',
    value: 2000,
    paid: false,
    hours: 12
  });
  const [userSettings, setUserSettings] = useState({ hourlyRate: 150, shift12hValue: 1800, shift24hValue: 3000 });

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const user = await base44.auth.me();
        setUserSettings({
          hourlyRate: user.hourlyRate || 150,
          shift12hValue: user.shift12hValue || 1800,
          shift24hValue: user.shift24hValue || 3000
        });
      } catch (e) {
        console.error('Error loading user settings:', e);
      }
    };
    loadUserSettings();
  }, []);

  useEffect(() => {
    if (initialDate) {
      setNewShift(prev => ({ ...prev, date: initialDate }));
    }
  }, [initialDate]);

  const doctorsBySpecialty = doctors.filter(d => d.specialty === newShift.specialty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(newShift);
    onClose();
  };

  const handleTypeChange = (val) => {
    let h = 12;
    let calculatedValue = userSettings.shift12hValue;
    
    if (val === "24h") {
      h = 24;
      calculatedValue = userSettings.shift24hValue;
    } else if (val.includes("6h")) {
      h = 6;
      calculatedValue = userSettings.hourlyRate * 6;
    } else if (val.includes("12h")) {
      h = 12;
      calculatedValue = userSettings.shift12hValue;
    }
    
    setNewShift({ ...newShift, type: val, hours: h, value: Math.round(calculatedValue) });
  };

  const calculateSuggestedValue = () => {
    if (newShift.hours === 24) return userSettings.shift24hValue;
    if (newShift.hours === 12) return userSettings.shift12hValue;
    return Math.round(userSettings.hourlyRate * newShift.hours);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-black text-2xl">Novo Plantão</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
              <input 
                type="date" 
                required 
                value={newShift.date} 
                onChange={e => setNewShift({ ...newShift, date: e.target.value })} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                <span>Valor (R$)</span>
                <button
                  type="button"
                  onClick={() => setNewShift({ ...newShift, value: calculateSuggestedValue() })}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[9px]"
                >
                  <Calculator size={10} /> Auto
                </button>
              </label>
              <input 
                type="number" 
                required 
                value={newShift.value} 
                onChange={e => setNewShift({ ...newShift, value: Number(e.target.value) })} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600" 
              />
              {calculateSuggestedValue() !== newShift.value && (
                <p className="text-[9px] text-slate-500 ml-1">
                  Sugerido: R$ {calculateSuggestedValue().toLocaleString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade</label>
              <select 
                value={newShift.specialty} 
                onChange={e => setNewShift({ ...newShift, specialty: e.target.value, doctorName: '' })} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600"
              >
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
              <select 
                value={newShift.type} 
                onChange={e => handleTypeChange(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600"
              >
                <option value="12h Dia">12h Dia</option>
                <option value="12h Noite">12h Noite</option>
                <option value="24h">24h</option>
                <option value="6h Dia">6h Dia</option>
                <option value="6h Noite">6h Noite</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Médico ({newShift.specialty})
            </label>
            <select 
              required 
              value={newShift.doctorName} 
              onChange={e => setNewShift({ ...newShift, doctorName: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Selecione o médico...</option>
              {doctorsBySpecialty.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hospital</label>
            <select 
              required 
              value={newShift.unit} 
              onChange={e => setNewShift({ ...newShift, unit: e.target.value })} 
              className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Selecione o hospital...</option>
              {hospitals.map(h => (
                <option key={h.id} value={h.name}>{h.name}</option>
              ))}
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> Salvar Plantão
          </button>
        </form>
      </div>
    </div>
  );
}