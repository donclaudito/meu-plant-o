import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Settings as SettingsIcon } from 'lucide-react';
import PricingSettings from '@/components/settings/PricingSettings';
import RecurringRules from '@/components/settings/RecurringRules';
import DiscountsModule from '@/components/finance/DiscountsModule';
import DiscountTypes from '@/components/settings/DiscountTypes';
import Toast from '@/components/common/Toast';

export default function Settings({ currentMonth = new Date().getMonth(), currentYear = new Date().getFullYear() }) {
  const [message, setMessage] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => base44.entities.Doctor.list('name'),
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: () => base44.entities.Hospital.list('name'),
  });

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Toast message={message?.text} type={message?.type} />

      <div className="flex items-center gap-3">
        <SettingsIcon className="text-blue-600" size={32} />
        <h2 className="text-3xl font-black text-slate-900">Configurações</h2>
      </div>

      <PricingSettings user={user} showToast={showToast} />
      
      <DiscountTypes user={user} showToast={showToast} />
      
      <DiscountsModule 
        currentMonth={currentMonth} 
        currentYear={currentYear}
        discountTypes={user?.discountTypes || []}
      />
      
      <RecurringRules doctors={doctors} hospitals={hospitals} showToast={showToast} />
    </div>
  );
}