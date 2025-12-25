import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

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

  useEffect(() => {
    if (initialDate) {
      setNewShift(prev => ({ ...prev, date: initialDate }));
    }
  }, [initialDate]);

  const doctorsBySpecialty = doctors.filter(d => d.specialty === newShift.specialty);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(newShift);
    setNewShift({
      date: new Date().toISOString().split('T')[0],
      unit: '',
      doctorName: '',
      specialty: 'CIRURGIA GERAL',
      type: '12h Dia',
      value: 2000,
      paid: false,
      hours: 12
    });
  };

  const handleTypeChange = (val) => {
    let h = 12;
    if (val === "24h") h = 24;
    else if (val.includes("6h")) h = 6;
    setNewShift({ ...newShift, type: val, hours: h });
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (€)</label>
              <input 
                type="number" 
                required 
                value={newShift.value} 
                onChange={e => setNewShift({ ...newShift, value: Number(e.target.value) })} 
                className="w-full px-4 py-3 bg-slate-100 border-none rounded-2xl font-bold focus:ring-2 focus:ring-blue-600" 
              />
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