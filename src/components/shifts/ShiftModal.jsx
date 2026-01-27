import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';

const specialties = [
  "CIRURGIA GERAL", "CLÍNICA MÉDICA", "PEDIATRIA", "GINECOLOGIA", "ORTOPEDIA", "ANESTESIA", "OUTRA"
];

export default function ShiftModal({ isOpen, onClose, onSave, doctors, hospitals, initialDate }) {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [userSettings, setUserSettings] = useState({ hourlyRate: 150, shift12hValue: 1800, shift24hValue: 3000 });
  const [newShift, setNewShift] = useState({
    date: initialDate || new Date().toISOString().split('T')[0],
    unit: '',
    doctorName: '',
    specialty: 'CIRURGIA GERAL',
    type: '12h Dia',
    value: 1800,
    paid: false,
    hours: 12
  });
  const [showQuickAddDoctor, setShowQuickAddDoctor] = useState(false);
  const [quickDoctorName, setQuickDoctorName] = useState('');
  const [showQuickAddHospital, setShowQuickAddHospital] = useState(false);
  const [quickHospitalData, setQuickHospitalData] = useState({ name: '', city: '' });

  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        const settings = {
          shift6hValue: user.shift6hValue || 900,
          shift12hValue: user.shift12hValue || 1800,
          shift24hValue: user.shift24hValue || 3000
        };
        setUserSettings(settings);
        setNewShift(prev => ({ ...prev, value: settings.shift12hValue }));
      } catch (e) {
        console.error('Error loading user settings:', e);
      }
    };
    loadUserSettings();
  }, []);

  useEffect(() => {
    if (isOpen) {
      const dateToUse = initialDate || new Date().toISOString().split('T')[0];
      setNewShift(prev => ({ 
        ...prev, 
        date: dateToUse,
        unit: '',
        doctorName: '',
        value: userSettings.shift12hValue || 1800
      }));
    }
  }, [isOpen, initialDate, userSettings.shift12hValue]);

  const doctorsBySpecialty = doctors.filter(d => d.specialty === newShift.specialty);

  const handleQuickAddDoctor = async () => {
    if (!quickDoctorName.trim()) return;
    try {
      const newDoc = await base44.entities.Doctor.create({
        name: quickDoctorName,
        specialty: newShift.specialty
      });
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
      setNewShift({ ...newShift, doctorName: newDoc.name });
      setQuickDoctorName('');
      setShowQuickAddDoctor(false);
    } catch (error) {
      console.error('Erro ao adicionar médico:', error);
    }
  };

  const handleQuickAddHospital = async () => {
    if (!quickHospitalData.name.trim()) return;
    try {
      const newHosp = await base44.entities.Hospital.create(quickHospitalData);
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      setNewShift({ ...newShift, unit: newHosp.name });
      setQuickHospitalData({ name: '', city: '' });
      setShowQuickAddHospital(false);
    } catch (error) {
      console.error('Erro ao adicionar hospital:', error);
    }
  };

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
      calculatedValue = userSettings.shift6hValue;
    } else if (val.includes("12h")) {
      h = 12;
      calculatedValue = userSettings.shift12hValue;
    }
    
    setNewShift({ ...newShift, type: val, hours: h, value: Math.round(calculatedValue) });
  };

  const calculateSuggestedValue = () => {
    if (newShift.hours === 24) return userSettings.shift24hValue;
    if (newShift.hours === 12) return userSettings.shift12hValue;
    if (newShift.hours === 6) return userSettings.shift6hValue;
    const hourlyRate = userSettings.shift6hValue / 6;
    return Math.round(hourlyRate * newShift.hours);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center md:justify-center p-4 items-end md:items-center">
      <div className="bg-white dark:bg-slate-800 rounded-t-[2.5rem] md:rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in slide-in-from-bottom md:zoom-in-95">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-black text-2xl dark:text-white">Novo Plantão</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className={currentUser?.role === 'shift_editor' ? 'space-y-1' : 'grid grid-cols-2 gap-4'}>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Data</label>
              <input 
                type="date" 
                required 
                value={newShift.date} 
                onChange={e => setNewShift({ ...newShift, date: e.target.value })} 
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm" 
              />
            </div>
            {currentUser?.role !== 'shift_editor' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                  <span>Valor (R$)</span>
                  <button
                    type="button"
                    onClick={() => setNewShift({ ...newShift, value: calculateSuggestedValue() })}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 flex items-center gap-1 text-[9px]"
                  >
                    <Calculator size={10} /> Auto
                  </button>
                </label>
                <input 
                  type="number" 
                  required 
                  value={newShift.value} 
                  onChange={e => setNewShift({ ...newShift, value: Number(e.target.value) })} 
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500" 
                />
                {calculateSuggestedValue() !== newShift.value && (
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 ml-1">
                    Sugerido: R$ {calculateSuggestedValue().toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Especialidade</label>
              <select 
                value={newShift.specialty} 
                onChange={e => setNewShift({ ...newShift, specialty: e.target.value, doctorName: '' })} 
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
              >
                {specialties.map(s => <option key={s} value={s} className="text-slate-900 dark:text-white">{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Tipo</label>
              <select 
                value={newShift.type} 
                onChange={e => handleTypeChange(e.target.value)} 
                className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
              >
                <option value="12h Dia" className="text-slate-900 dark:text-white">12h Dia</option>
                <option value="12h Noite" className="text-slate-900 dark:text-white">12h Noite</option>
                <option value="24h" className="text-slate-900 dark:text-white">24h</option>
                <option value="6h Dia" className="text-slate-900 dark:text-white">6h Dia</option>
                <option value="6h Noite" className="text-slate-900 dark:text-white">6h Noite</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
              <span>Médico ({newShift.specialty})</span>
              <button
                type="button"
                onClick={() => setShowQuickAddDoctor(!showQuickAddDoctor)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 flex items-center gap-1 text-[9px]"
              >
                <Plus size={12} /> Adicionar
              </button>
            </label>
            {showQuickAddDoctor ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickDoctorName}
                  onChange={e => setQuickDoctorName(e.target.value)}
                  placeholder="Nome do médico"
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
                />
                <button
                  type="button"
                  onClick={handleQuickAddDoctor}
                  className="px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-2xl font-bold hover:bg-green-700 dark:hover:bg-green-600"
                >
                  <Plus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuickAddDoctor(false)}
                  className="px-4 py-3 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-400 dark:hover:bg-slate-500"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <>
                <select 
                  required 
                  value={newShift.doctorName} 
                  onChange={e => setNewShift({ ...newShift, doctorName: e.target.value })} 
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                >
                  <option value="" className="text-slate-500">Selecione o médico...</option>
                  {doctorsBySpecialty && doctorsBySpecialty.length > 0 ? (
                    doctorsBySpecialty.map(d => (
                      <option key={d.id} value={d.name} className="text-slate-900 dark:text-white">{d.name}</option>
                    ))
                  ) : (
                    <option disabled className="text-slate-400">Nenhum médico desta especialidade</option>
                  )}
                </select>
                {(!doctorsBySpecialty || doctorsBySpecialty.length === 0) && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 ml-1 mt-1">
                    ⚠️ Clique em "Adicionar" acima para cadastrar rapidamente
                  </p>
                )}
              </>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 flex items-center justify-between">
              <span>Hospital</span>
              <button
                type="button"
                onClick={() => setShowQuickAddHospital(!showQuickAddHospital)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 flex items-center gap-1 text-[9px]"
              >
                <Plus size={12} /> Adicionar
              </button>
            </label>
            {showQuickAddHospital ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={quickHospitalData.name}
                  onChange={e => setQuickHospitalData({ ...quickHospitalData, name: e.target.value })}
                  placeholder="Nome do hospital"
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickHospitalData.city}
                    onChange={e => setQuickHospitalData({ ...quickHospitalData, city: e.target.value })}
                    placeholder="Cidade (opcional)"
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleQuickAddHospital}
                    className="px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-2xl font-bold hover:bg-green-700 dark:hover:bg-green-600"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddHospital(false)}
                    className="px-4 py-3 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-400 dark:hover:bg-slate-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <select 
                  required 
                  value={newShift.unit} 
                  onChange={e => setNewShift({ ...newShift, unit: e.target.value })} 
                  className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
                >
                  <option value="" className="text-slate-500">Selecione o hospital...</option>
                  {hospitals && hospitals.length > 0 ? (
                    hospitals.map(h => (
                      <option key={h.id} value={h.name} className="text-slate-900 dark:text-white">{h.name}</option>
                    ))
                  ) : (
                    <option disabled className="text-slate-400">Nenhum hospital cadastrado</option>
                  )}
                </select>
                {(!hospitals || hospitals.length === 0) && (
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 ml-1 mt-1">
                    ⚠️ Clique em "Adicionar" acima para cadastrar rapidamente
                  </p>
                )}
              </>
            )}
          </div>
          <button 
            type="submit" 
            className="w-full py-5 bg-blue-600 dark:bg-blue-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 dark:shadow-blue-900/50 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} /> Salvar Plantão
          </button>
        </form>
      </div>
    </div>
  );
}