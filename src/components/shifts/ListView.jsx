import React from 'react';
import { Trash2 } from 'lucide-react';

export default function ListView({ shifts, onTogglePaid, onDeleteShift }) {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-8">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4">Unidade / Médico</th>
            <th className="px-6 py-4 text-right">Valor</th>
            <th className="px-6 py-4 text-center">Status</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {shifts.map(s => (
            <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-5 font-black text-slate-700">
                {new Date(s.date).toLocaleDateString('pt-PT')}
              </td>
              <td className="px-6 py-5">
                <div className="font-bold text-slate-900">{s.unit}</div>
                <div className="text-[9px] text-blue-500 font-black uppercase mt-1">
                  {s.doctorName} • {s.type}
                </div>
              </td>
              <td className="px-6 py-5 font-black text-right">
                R$ {Number(s.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-5 text-center">
                <button 
                  onClick={() => onTogglePaid(s.id, !s.paid)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black border transition-all ${
                    s.paid 
                      ? 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100' 
                      : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                  }`}
                >
                  {s.paid ? 'PAGO' : 'PENDENTE'}
                </button>
              </td>
              <td className="px-6 py-5 text-right">
                <button 
                  onClick={() => onDeleteShift(s.id, s.unit)} 
                  className="text-slate-200 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
          {shifts.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                Nenhum plantão registado para este período
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}