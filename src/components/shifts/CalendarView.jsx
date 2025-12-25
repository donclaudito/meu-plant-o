import React, { useState } from 'react';
import { Clock, Euro, Trash2, GripVertical } from 'lucide-react';

export default function CalendarView({ calendarDays, currentMonth, currentYear, onDayClick, onDeleteShift, onUpdateShiftDate }) {
  const today = new Date();
  const [draggedShift, setDraggedShift] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const getShiftColor = (shift) => {
    const type = shift.type;
    if (type === '6h Dia') return 'bg-sky-100 border-sky-200 text-sky-700';
    if (type === '6h Noite') return 'bg-indigo-100 border-indigo-200 text-indigo-700';
    if (type === '12h Dia') return 'bg-amber-100 border-amber-200 text-amber-700';
    if (type === '12h Noite') return 'bg-purple-100 border-purple-200 text-purple-700';
    if (type === '24h') return 'bg-rose-100 border-rose-200 text-rose-700';
    return 'bg-slate-100 border-slate-200 text-slate-700';
  };

  const handleDragStart = (e, shift) => {
    setDraggedShift(shift);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedShift(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDate) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedShift && targetDate && draggedShift.date !== targetDate) {
      onUpdateShiftDate(draggedShift.id, targetDate);
    }
    setDraggedShift(null);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm mb-8 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 rounded-t-[2.5rem]">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
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
            onDragOver={handleDragOver}
            onDrop={(e) => item.day && handleDrop(e, item.date)}
            className={`min-h-[140px] p-2 border-r border-b border-slate-100 transition-colors ${
              item.day ? 'hover:bg-blue-50/30 cursor-pointer' : 'bg-slate-50/30'
            } ${draggedShift && item.day ? 'bg-blue-50/20' : ''}`}
            style={{ position: 'relative', zIndex: activeTooltip?.cellIdx === idx ? 100 : 1 }}
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
                  {item.shifts.map((s, shiftIdx) => {
                    const isTopRows = Math.floor(idx / 7) < 2;
                    return (
                    <div 
                      key={s.id} 
                      className="relative"
                      draggable
                      onDragStart={(e) => handleDragStart(e, s)}
                      onDragEnd={handleDragEnd}
                      onClick={(e) => e.stopPropagation()}
                      onMouseEnter={() => setActiveTooltip({ shiftId: s.id, cellIdx: idx })}
                      onMouseLeave={() => setActiveTooltip(null)}
                    >
                      <div className={`text-[9px] p-2 rounded-xl border font-bold shadow-sm transition-all hover:scale-105 cursor-move flex items-start gap-1 ${
                        getShiftColor(s)
                      } ${s.paid ? 'ring-2 ring-green-500/40' : ''} ${draggedShift?.id === s.id ? 'opacity-40' : ''}`}>
                        <GripVertical size={10} className="opacity-40 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="truncate uppercase">{s.unit}</div>
                          <div className="flex justify-between mt-1 opacity-70">
                            <span>{s.hours}h</span>
                            <span>R${s.value}</span>
                          </div>
                        </div>
                      </div>
                      {activeTooltip?.shiftId === s.id && (
                        <div 
                          className={`absolute left-1/2 -translate-x-1/2 ${isTopRows ? 'top-full mt-2' : 'bottom-full mb-2'} w-56 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl z-[200] animate-in fade-in zoom-in-95 duration-200`}
                          onMouseEnter={() => setActiveTooltip({ shiftId: s.id, cellIdx: idx })}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-blue-400 uppercase">Detalhes</span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onDeleteShift(s.id, s.unit); setActiveTooltip(null); }} 
                              className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs font-bold leading-tight mb-1 text-white">{s.doctorName}</p>
                          <p className="text-[10px] opacity-60 mb-3">{s.unit} • {s.type}</p>
                          <div className="grid grid-cols-2 gap-3 text-[10px] font-black">
                            <div className="flex items-center gap-1.5 text-blue-300"><Clock size={12}/> {s.hours}h</div>
                            <div className="flex items-center gap-1.5 text-green-400">R$ {s.value}</div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10 text-[9px] text-white/50 font-medium flex items-center gap-1">
                            <GripVertical size={10} /> Arraste para mover
                          </div>
                          <div className={`absolute ${isTopRows ? 'bottom-full' : 'top-full'} left-1/2 -translate-x-1/2 border-8 border-transparent ${isTopRows ? 'border-b-slate-900' : 'border-t-slate-900'}`}></div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}