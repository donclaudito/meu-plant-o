import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download } from 'lucide-react';
import ReportFilters from '@/components/reports/ReportFilters';
import DoctorKPIComparison from '@/components/reports/DoctorKPIComparison';
import DoctorTrendCharts from '@/components/reports/DoctorTrendCharts';
import DoctorPDFExport from '@/components/reports/DoctorPDFExport';

export default function Reports() {
  const [filters, setFilters] = useState({
    month: '',
    doctorName: 'TODOS',
    unit: 'TODOS',
    specialty: 'TODAS',
    type: 'TODOS'
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Shift.list('-date');
      return all.filter(s => s.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Doctor.list('name');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Hospital.list('name');
      return all.filter(h => h.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: extraIncomes = [] } = useQuery({
    queryKey: ['extraIncomes', user?.email],
    queryFn: async () => {
      const all = await base44.entities.ExtraIncome.list('-date');
      return all.filter(i => i.created_by === user?.email);
    },
    enabled: !!user,
  });

  const { data: discounts = [] } = useQuery({
    queryKey: ['discounts', user?.email],
    queryFn: async () => {
      const all = await base44.entities.Discount.list('-date');
      return all.filter(d => d.created_by === user?.email);
    },
    enabled: !!user,
  });

  const filteredShifts = useMemo(() => {
    return shifts.filter(shift => {
      if (!shift || !shift.date) return false;
      
      if (filters.month) {
        const [filterYear, filterMonth] = filters.month.split('-').map(Number);
        const [year, month] = shift.date.split('-').map(Number);
        if (year !== filterYear || month !== filterMonth) {
          return false;
        }
      }
      
      if (filters.doctorName && filters.doctorName !== 'TODOS') {
        const normalizedFilterDoctor = filters.doctorName.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedDoctorName = (shift.doctorName || '').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedDoctorName !== normalizedFilterDoctor) return false;
      }
      
      if (filters.unit && filters.unit !== 'TODOS' && shift.unit !== filters.unit) return false;
      if (filters.specialty && filters.specialty !== 'TODAS' && shift.specialty !== filters.specialty) return false;
      if (filters.type && filters.type !== 'TODOS' && shift.type !== filters.type) return false;
      return true;
    });
  }, [shifts, filters]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 dark:text-slate-500 font-bold">A carregar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 p-6 md:p-8 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-2 flex items-center gap-3">
              <FileText size={32} /> Relatórios e Análises
            </h1>
            <p className="text-blue-100 font-medium">
              Análise detalhada de desempenho e tendências
            </p>
          </div>
        </div>
      </div>

      <ReportFilters 
        filters={filters} 
        setFilters={setFilters} 
        doctors={doctors}
        hospitals={hospitals}
      />

      <DoctorKPIComparison 
        shifts={shifts}
        doctors={doctors}
        user={user}
      />

      <DoctorTrendCharts 
        shifts={shifts}
        doctors={doctors}
      />

      <DoctorPDFExport 
        shifts={filteredShifts}
        doctors={doctors}
        extraIncomes={extraIncomes}
        discounts={discounts}
        user={user}
      />
    </div>
  );
}