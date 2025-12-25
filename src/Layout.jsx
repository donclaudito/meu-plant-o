import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { 
  Hospital, 
  Calendar as CalendarIcon, 
  Wallet, 
  Stethoscope, 
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Layout({ children, currentPageName }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const changeMonth = (offset) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const navItems = [
    { page: 'Shifts', label: 'PLANTÕES', icon: CalendarIcon },
    { page: 'Finance', label: 'FINANCEIRO', icon: Wallet },
    { page: 'Doctors', label: 'MÉDICOS', icon: Stethoscope },
    { page: 'Hospitals', label: 'HOSPITAIS', icon: Building2 },
    { page: 'Settings', label: 'DEFINIÇÕES', icon: Hospital },
  ];

  const childWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { currentMonth, currentYear });
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-28">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to={createPageUrl('Shifts')} className="flex items-center gap-4 cursor-pointer">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                <Hospital size={22} />
              </div>
              <h1 className="font-black text-xl tracking-tight hidden sm:block">Meu Plantão</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              {navItems.map(item => (
                <Link 
                  key={item.page}
                  to={createPageUrl(item.page)} 
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    currentPageName === item.page 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
            <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-xl transition-all">
              <ChevronLeft size={20} />
            </button>
            <span className="px-4 text-[10px] font-black uppercase min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-xl transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8">
        {childWithProps}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 flex justify-around z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                currentPageName === item.page 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-slate-400'
              }`}
            >
              <Icon size={22} />
              <span className="text-[8px] font-black mt-1 uppercase">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}