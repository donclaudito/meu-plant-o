import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings as SettingsIcon } from 'lucide-react';
import PricingSettings from '@/components/settings/PricingSettings';
import DiscountsModule from '@/components/settings/DiscountsModule';
import CleanupPanel from '@/components/settings/CleanupPanel';
import Toast from '@/components/common/Toast';

export default function Settings({ currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear() }) {
  const [message, setMessage] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list('name');
      
      // Deduplicar médicos por nome normalizado
      const uniqueDoctors = all.reduce((acc, doctor) => {
        const normalizedName = doctor.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (!acc.some(d => d.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalizedName)) {
          acc.push(doctor);
        }
        return acc;
      }, []);
      
      return uniqueDoctors;
    },
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.list('name'),
  });

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCleanupComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['doctors'] });
    queryClient.invalidateQueries({ queryKey: ['discounts'] });
    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    showToast('Limpeza concluída! Recarregue a página para ver as alterações.', 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      <div className="flex items-center gap-3">
        <SettingsIcon className="text-blue-600 dark:text-blue-400" size={32} />
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Configurações</h2>
      </div>

      {user?.role === 'admin' && (
        <CleanupPanel onComplete={handleCleanupComplete} />
      )}

      <PricingSettings user={user} showToast={showToast} />
      
      <DiscountsModule 
        currentMonth={currentMonth} 
        currentYear={currentYear}
      />
    </div>
  );
}