import React, { useState } from 'react';
import { Clock, Euro, Trash2, GripVertical, Info } from 'lucide-react';

export default function CalendarView({ calendarDays, currentMonth, currentYear, onDayClick, onDeleteShift, onUpdateShiftDate, selectedShifts = [], onToggleSelect }) {
  const today = React.useMemo(() => new Date(), []);
  const [draggedShift, setDraggedShift] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Otimização: usar useCallback para prevenir re-renders desnecessários
  const handleDayClickMemo = React.useCallback((date) => {
    if (date) onDayClick(date);
  }, [onDayClick]);
  
  const handleDeleteMemo = React.useCallback((id, name) => {
    onDeleteShift(id, name);
  }, [onDeleteShift]);
  
  const handleToggleSelectMemo = React.useCallback((id) => {
    onToggleSelect(id);
  }, [onToggleSelect]);

  const getShiftOrder = (type) => {
    const order = {
      '12h Dia': 1,
      '6h Dia': 2,
      '6h Noite': 3,
      '12h Noite': 4,
      '24h': 5
    };
    return order[type] || 6;
  };

  const sortShifts = (shifts) => {
    return [...shifts].sort((a, b) => getShiftOrder(a.type) - getShiftOrder(b.type));
  };

  const getDoctorColor = React.useCallback((doctorName) => {
    const colors = [
      { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800' },
      { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800' },
      { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800' },
      { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800' },
      { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800' },
      { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800' },
      { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800' },
      { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800' },
      { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
      { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800' },
    ];
    
    let hash = 0;
    for (let i = 0; i < doctorName.length; i++) {
      hash = ((hash << 5) - hash) + doctorName.charCodeAt(i);
      hash = hash & hash;
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];
    return `${color.bg} border-2 ${color.border} ${color.text}`;
  }, []);

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
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm mb-8 overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-7 border-b-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 rounded-t-[2.5rem]">
          {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((item, idx) => {
            const isRightEdge = (idx + 1) % 7 === 0;
            const isTopRows = Math.floor(idx / 7) < 2;
            
            return (
            <div 
              key={idx} 
              onClick={() => handleDayClickMemo(item.date)}
              onDragOver={handleDragOver}
              onDrop={(e) => item.day && handleDrop(e, item.date)}
              className={`min-h-[120px] md:min-h-[140px] p-2 border-r-2 border-b-2 border-slate-300 dark:border-slate-600 transition-colors ${
                item.day ? 'hover:bg-blue-50/30 dark:hover:bg-blue-900/20 cursor-pointer' : 'bg-slate-50/30 dark:bg-slate-900/30'
              } ${draggedShift && item.day ? 'bg-blue-50/20 dark:bg-blue-900/20' : ''}`}
              style={{ position: 'relative', zIndex: activeTooltip?.cellIdx === idx ? 100 : 1 }}
            >
              {item.day && (
                <>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-black ${
                      item.day === today.getDate() && 
                      currentMonth === today.getMonth() && 
                      currentYear === today.getFullYear()
                        ? 'bg-blue-600 dark:bg-blue-500 text-white w-6 h-6 flex items-center justify-center rounded-full shadow-lg'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}>
                      {item.day}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {sortShifts(item.shifts).map((s, shiftIdx) => {
                      return (
                      <div 
                        key={s.id} 
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-1 items-start">
                          <div 
                            className={`text-[9px] p-2 rounded-xl font-bold shadow-sm transition-all hover:scale-105 cursor-move flex items-start gap-1 flex-1 ${
                              getDoctorColor(s.doctorName)
                            } ${s.paid ? 'ring-2 ring-green-500/40' : ''} ${draggedShift?.id === s.id ? 'opacity-40' : ''} ${selectedShifts.includes(s.id) ? 'ring-2 ring-blue-600' : ''}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, s)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => { e.stopPropagation(); handleToggleSelectMemo(s.id); }}
                          >
                            <GripVertical size={10} className="opacity-40 flex-shrink-0 mt-0.5 hidden md:block" />
                            <div className="flex-1 min-w-0">
                              <div className="truncate uppercase font-black text-[12px] text-slate-800 dark:text-slate-900">{s.doctorName}</div>
                              <div className="flex justify-between items-center mt-1 text-[8px]">
                                <span className="font-black text-slate-700 dark:text-slate-800">{s.hours}h</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActiveTooltip({ shiftId: s.id, cellIdx: idx }); }}
                            className="p-1.5 bg-slate-700 dark:bg-slate-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors flex-shrink-0"
                            title="Ver detalhes"
                          >
                            <Info size={10} />
                          </button>
                          </div>
                        {activeTooltip?.shiftId === s.id && (
                          <>
                            <div 
                              className="fixed inset-0 bg-black/50 z-[199]"
                              onClick={(e) => { e.stopPropagation(); setActiveTooltip(null); }}
                            ></div>
                            <div 
                              className="fixed left-[50%] top-[50%] w-[90vw] max-w-[300px] bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-2xl shadow-2xl z-[200] animate-in fade-in zoom-in-95 duration-200"
                              style={{ transform: 'translate(-50%, -50%)' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-black text-blue-400 uppercase">Detalhes</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteMemo(s.id, s.unit); setActiveTooltip(null); }} 
                                className="text-red-400 hover:text-red-300 transition-colors p-1 rounded hover:bg-red-400/10"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <p className="text-sm font-bold leading-tight mb-1 text-white">{s.doctorName}</p>
                            <p className="text-[10px] opacity-60 mb-3">{s.unit} • {s.type}</p>
                            <div className="text-[11px] font-black">
                              <div className="flex items-center gap-1.5 text-blue-300"><Clock size={12}/> {s.hours}h</div>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveTooltip(null); }}
                              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-bold text-xs uppercase transition-colors"
                            >
                              Fechar
                            </button>
                          </div>
                          </>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}