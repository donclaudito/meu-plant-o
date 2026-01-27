import React, { useMemo } from 'react';
import { TrendingUp, Clock, DollarSign, Award, Activity } from 'lucide-react';

export default function DoctorKPIComparison({ shifts, doctors, user, filters, discounts }) {
  const doctorStats = useMemo(() => {
    const stats = {};
    
    const shift6hValue = Number(user?.shift6hValue) || 1000;
    const shift12hValue = Number(user?.shift12hValue) || 1800;
    const shift24hValue = Number(user?.shift24hValue) || 3000;
    const baseHourlyRate = Number(user?.hourlyRate) || 150;

    // Criar lista de nomes normalizados de médicos cadastrados
    const registeredDoctors = new Set(
      doctors.map(d => d.name.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );

    shifts.forEach(shift => {
      if (!shift || !shift.doctorName) return;
      
      // Normalizar nome do médico do plantão
      const normalizedShiftDoctor = shift.doctorName.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Verificar se o médico está cadastrado
      if (!registeredDoctors.has(normalizedShiftDoctor)) return;
      
      // Aplicar filtro de médico se selecionado
      if (filters?.doctorName && filters.doctorName !== 'TODOS') {
        const normalizedFilterDoctor = filters.doctorName.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (normalizedShiftDoctor !== normalizedFilterDoctor) return;
      }
      
      const name = normalizedShiftDoctor;
      if (!stats[name]) {
        stats[name] = {
          name,
          totalShifts: 0,
          totalHours: 0,
          totalRevenue: 0,
          paidRevenue: 0,
          pendingRevenue: 0,
          avgShiftValue: 0,
          hourlyRate: 0,
          specialty: shift.specialty,
          shifts12h: 0,
          shifts6h: 0,
          shifts24h: 0,
          totalDiscounts: 0,
          netRevenue: 0
        };
      }

      const shiftHours = Number(shift.hours) || 0;
      const shiftValue = Number(shift.value) || 0;
      
      let calculatedValue = shiftValue;
      if (shiftValue === 0) {
        if (shiftHours === 24) calculatedValue = shift24hValue;
        else if (shiftHours === 12) calculatedValue = shift12hValue;
        else if (shiftHours === 6) calculatedValue = shift6hValue;
        else calculatedValue = baseHourlyRate * shiftHours;
      }

      stats[name].totalShifts++;
      stats[name].totalHours += shiftHours;
      stats[name].totalRevenue += calculatedValue;
      
      if (shift.paid) {
        stats[name].paidRevenue += calculatedValue;
      } else {
        stats[name].pendingRevenue += calculatedValue;
      }

      if (shiftHours === 12) stats[name].shifts12h++;
      else if (shiftHours === 6) stats[name].shifts6h++;
      else if (shiftHours === 24) stats[name].shifts24h++;
    });

    // Calcular totais gerais para aplicar descontos proporcionalmente
    const totalRevenueAllDoctors = Object.values(stats).reduce((sum, d) => sum + d.totalRevenue, 0);
    
    // Calcular descontos globais (sem tipo específico)
    const globalDiscounts = (discounts || []).filter(d => !d.type || d.type === '');
    
    const totalGlobalDiscounts = globalDiscounts.reduce((acc, d) => {
      const isPercentage = d.isPercentage === true;
      if (isPercentage) {
        return acc + (totalRevenueAllDoctors * (Number(d.value) || 0) / 100);
      }
      return acc + (Number(d.value) || 0);
    }, 0);
    
    // Aplicar descontos proporcionalmente por médico
    Object.values(stats).forEach(doctor => {
      doctor.avgShiftValue = doctor.totalShifts > 0 ? doctor.totalRevenue / doctor.totalShifts : 0;
      doctor.hourlyRate = doctor.totalHours > 0 ? doctor.totalRevenue / doctor.totalHours : 0;
      
      // Desconto proporcional à receita do médico
      if (totalRevenueAllDoctors > 0) {
        doctor.totalDiscounts = totalGlobalDiscounts * (doctor.totalRevenue / totalRevenueAllDoctors);
      } else {
        doctor.totalDiscounts = 0;
      }
      
      doctor.netRevenue = Math.max(0, doctor.totalRevenue - doctor.totalDiscounts);
    });

    return Object.values(stats).sort((a, b) => b.netRevenue - a.netRevenue);
  }, [shifts, doctors, user, filters, discounts]);

  const topPerformer = doctorStats[0];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
        <Award className="text-blue-600 dark:text-blue-400" size={24} />
        Comparação de KPIs por Médico
      </h3>

      {doctorStats.length === 0 ? (
        <p className="text-center text-slate-400 dark:text-slate-500 py-8">Nenhum dado disponível</p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {doctorStats.map((doctor, index) => (
              <div
                key={doctor.name}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  index === 0
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300 dark:border-yellow-700 shadow-lg'
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Award className="text-yellow-600 dark:text-yellow-400" size={20} />}
                    <span className="text-xs font-black text-slate-500 dark:text-slate-400">
                      {index === 0 ? '🏆 TOP' : `#${index + 1}`}
                    </span>
                  </div>
                  <Activity className="text-blue-600 dark:text-blue-400" size={18} />
                </div>

                <h4 className="font-black text-lg mb-1 text-slate-900 dark:text-white truncate">
                  {doctor.name}
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mb-4 uppercase">
                  {doctor.specialty}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <DollarSign size={14} /> Receita Bruta
                    </span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                      R$ {doctor.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>

                  {doctor.totalDiscounts > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        Descontos
                      </span>
                      <span className="text-sm font-black text-red-600 dark:text-red-400">
                        - R$ {doctor.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                    <span className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1 font-black">
                      💰 Líquido
                    </span>
                    <span className="text-sm font-black text-green-600 dark:text-green-400">
                      R$ {doctor.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <TrendingUp size={14} /> Plantões
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {doctor.totalShifts}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <Clock size={14} /> Horas
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {doctor.totalHours}h
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        Valor/Hora
                      </span>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        R$ {doctor.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        Média/Plantão
                      </span>
                      <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                        R$ {doctor.avgShiftValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                    <div className="flex gap-2 text-[10px] font-bold">
                      <div className="flex-1 text-center bg-blue-100 dark:bg-blue-900/30 rounded-lg py-1">
                        <div className="text-blue-700 dark:text-blue-400">{doctor.shifts12h}</div>
                        <div className="text-blue-600 dark:text-blue-500">12h</div>
                      </div>
                      <div className="flex-1 text-center bg-green-100 dark:bg-green-900/30 rounded-lg py-1">
                        <div className="text-green-700 dark:text-green-400">{doctor.shifts6h}</div>
                        <div className="text-green-600 dark:text-green-500">6h</div>
                      </div>
                      <div className="flex-1 text-center bg-purple-100 dark:bg-purple-900/30 rounded-lg py-1">
                        <div className="text-purple-700 dark:text-purple-400">{doctor.shifts24h}</div>
                        <div className="text-purple-600 dark:text-purple-500">24h</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {topPerformer && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3 mb-4">
                <Award className="text-blue-600 dark:text-blue-400" size={28} />
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">
                    Melhor Desempenho Geral
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {topPerformer.name} - {topPerformer.specialty}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Receita Bruta</p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    R$ {topPerformer.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                {topPerformer.totalDiscounts > 0 && (
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Descontos</p>
                    <p className="text-2xl font-black text-red-600 dark:text-red-400">
                      R$ {topPerformer.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">💰 Líquido</p>
                  <p className="text-2xl font-black text-green-600 dark:text-green-400">
                    R$ {topPerformer.netRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total de Plantões</p>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {topPerformer.totalShifts}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Horas Trabalhadas</p>
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {topPerformer.totalHours}h
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Taxa Horária</p>
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    R$ {topPerformer.hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}