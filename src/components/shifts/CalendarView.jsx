import React from 'react';
import { Clock, Euro, Trash2 } from 'lucide-react';

export default function CalendarView({ calendarDays, currentMonth, currentYear, onDayClick, onDeleteShift }) {
  const today = new Date();

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 rounded-t-[2.5rem]">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
          <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((item, idx) => (
          <div 
            key={idx} 
            onClick={() => item.day && onDayClick(item.date)}
            className={`min-h-[140px] p-2 border-r border-b border-slate-100 transition-colors ${
              item.day ? 'hover:bg-blue-50/30 cursor-pointer' : 'bg-slate-50/30'
            }`}
          >
            {item.day && (
              <>
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-xs font-black ${
                    item.day === today.getDate() && 
                    currentMonth === today.getMonth() && 
                    currentYear === today.getFullYear()
                      ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg'
                      : 'text-slate-400'
                  }`}>
                    {item.day}
                  </span>
                </div>
                <div className="space-y-1">
                  {item.shifts.map(s => (
                    <div key={s.id} className="group relative">
                      <div className={`text-[9px] p-2 rounded-xl border font-bold shadow-sm transition-all hover:scale-105 ${
                        s.paid 
                          ? 'bg-green-50 border-green-100 text-green-700' 
                          : 'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        <div className="truncate uppercase">{s.unit}</div>
                        <div className="flex justify-between mt-1 opacity-70">
                          <span>{s.hours}h</span>
                          <span>€{s.value}</span>
                        </div>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] font-black text-blue-400 uppercase">Detalhes</span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteShift(s.id, s.unit); }} 
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-xs font-bold leading-tight mb-1">{s.doctorName}</p>
                        <p className="text-[10px] opacity-70 mb-2">{s.unit} • {s.type}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-black">
                          <div className="flex items-center gap-1"><Clock size={10}/> {s.hours}h</div>
                          <div className="flex items-center gap-1 text-green-400"><Euro size={10}/> {s.value}</div>
                        </div>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}