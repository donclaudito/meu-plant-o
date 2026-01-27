import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
        Hospital, 
        Calendar as CalendarIcon, 
        Wallet, 
        Stethoscope, 
        Building2,
        ChevronLeft,
        ChevronRight,
        Moon,
        Sun,
        LogOut,
        User,
        Trash2,
        FileText
      } from 'lucide-react';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function Layout({ children, currentPageName }) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = async () => {
    // Limpar todo o cache e estado da aplicação
    queryClient.clear();
    localStorage.clear();
    sessionStorage.clear();
    await base44.auth.logout();
    window.location.reload();
  };

  const handleUninstall = async () => {
    if (confirm('Tem a certeza que deseja desinstalar a aplicação? Todos os dados locais serão removidos.')) {
      // Limpar todos os dados
      queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      // Desregistar service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Limpar cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      alert('Aplicação desinstalada. Por favor, feche esta janela.');
      window.close();
    }
  };

  const getUserDisplayName = () => {
    if (!user) return 'Médico';
    return user.full_name || user.email?.split('@')[0] || 'Médico';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const changeMonth = (offset) => {
    let newMonth = currentMonth + offset;
    let newYear = currentYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const allNavItems = [
    { page: 'Shifts', label: 'PLANTÕES', icon: CalendarIcon },
    { page: 'Finance', label: 'FINANCEIRO', icon: Wallet },
    { page: 'Deposits', label: 'DEPÓSITOS', icon: Building2 },
    { page: 'Reports', label: 'RELATÓRIOS', icon: FileText },
    { page: 'Doctors', label: 'MÉDICOS', icon: Stethoscope },
    { page: 'Hospitals', label: 'HOSPITAIS', icon: Building2 },
    { page: 'Settings', label: 'DEFINIÇÕES', icon: Hospital },
  ];

  const navItems = user?.role === 'shift_editor' 
    ? allNavItems.filter(item => item.page === 'Shifts')
    : allNavItems;

  const childWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { currentMonth, currentYear });
    }
    return child;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-24 lg:pb-0 transition-colors duration-200">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-8">
            <Link to={createPageUrl('Shifts')} className="flex items-center gap-3 cursor-pointer">
              <div className="bg-blue-600 dark:bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                <Hospital size={22} />
              </div>
              <h1 className="font-black text-xl tracking-tight hidden sm:block dark:text-white">Meu Plantão</h1>
            </Link>
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-2xl border border-slate-200 dark:border-slate-600">
              {navItems.map(item => (
                <Link 
                  key={item.page}
                  to={createPageUrl(item.page)} 
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    currentPageName === item.page 
                      ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' 
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-slate-600 dark:text-slate-400" />}
            </button>
            
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-2xl p-1 border border-slate-200 dark:border-slate-600">
              <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-xl transition-all">
                <ChevronLeft size={20} />
              </button>
              <span className="px-2 md:px-4 text-[10px] font-black uppercase min-w-[100px] md:min-w-[140px] text-center">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded-xl transition-all">
                <ChevronRight size={20} />
                </button>
                </div>

                {user && (
                  <div className="flex items-center gap-2 ml-3">
                    <div className="hidden sm:flex flex-col items-end">
                      <span className="text-xs font-black text-slate-900 dark:text-white">{getUserDisplayName()}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500">{user.email}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg">
                      {getUserInitials()}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600"
                      title="Sair da conta"
                    >
                      <LogOut size={14} />
                      <span className="hidden lg:inline">Sair</span>
                    </button>
                  </div>
                )}
                </div>
                </div>
                </header>

      <main className="max-w-full mx-auto px-3 md:px-4 lg:px-6 pt-4 md:pt-6 lg:pt-8">
        {childWithProps}
      </main>

      {user && (
        <div className="hidden md:block fixed bottom-4 left-4 text-[9px] text-slate-400 dark:text-slate-600 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity">
          {user.email}
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 flex justify-around z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.15)] backdrop-blur-md">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex flex-col items-center p-3 rounded-2xl transition-all ${
                currentPageName === item.page 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon size={22} />
              <span className="text-[8px] font-black mt-1 uppercase">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
        <button
          onClick={handleUninstall}
          className="flex flex-col items-center p-3 rounded-2xl transition-all text-red-500 dark:text-red-400"
          title="Desinstalar"
        >
          <Trash2 size={22} />
          <span className="text-[8px] font-black mt-1 uppercase">DESINST</span>
        </button>
      </div>
    </div>
  );
}