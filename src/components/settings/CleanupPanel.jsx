import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function CleanupPanel({ onComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);

  const runCleanup = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      // 1. Desduplicar médicos
      const doctorsResponse = await base44.functions.invoke('deduplicateDoctors', {});
      
      // 2. Reset de descontos
      const discountsResponse = await base44.functions.invoke('resetGlobalDiscounts', {});

      setResults({
        success: true,
        doctors: doctorsResponse.data,
        discounts: discountsResponse.data
      });

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      setResults({
        success: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-8 rounded-[2.5rem] border-2 border-red-300 dark:border-red-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-red-900 dark:text-red-200 flex items-center gap-2">
            <Trash2 className="text-red-600 dark:text-red-400" /> Limpeza Profunda do Banco de Dados
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2">
            Esta operação irá: (1) Mesclar médicos duplicados, (2) Resetar descontos globais para os padrões
          </p>
        </div>
      </div>

      {!results ? (
        <button
          onClick={runCleanup}
          disabled={isRunning}
          className="w-full py-4 bg-red-600 dark:bg-red-500 text-white rounded-2xl font-black text-sm uppercase hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw size={20} className="animate-spin" /> Executando Limpeza...
            </>
          ) : (
            <>
              <Trash2 size={20} /> Executar Limpeza Profunda
            </>
          )}
        </button>
      ) : (
        <div className={`p-6 rounded-2xl ${results.success ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600' : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600'}`}>
          {results.success ? (
            <>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                <h4 className="text-lg font-black text-green-900 dark:text-green-200">Limpeza Concluída com Sucesso!</h4>
              </div>
              <div className="space-y-3 text-sm text-green-800 dark:text-green-300">
                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <p className="font-bold">✓ Médicos Desduplicados:</p>
                  <p className="ml-4">• {results.doctors.removedDoctors?.length || 0} duplicatas removidas</p>
                  <p className="ml-4">• {results.doctors.updatedShiftsCount || 0} plantões atualizados</p>
                  <p className="ml-4">• {results.doctors.uniqueDoctorsCount || 0} médicos únicos mantidos</p>
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl">
                  <p className="font-bold">✓ Descontos Resetados:</p>
                  <p className="ml-4">• {results.discounts.deletedCount || 0} descontos antigos removidos</p>
                  <p className="ml-4">• 3 descontos padrão recriados (Imposto 15%, Contador, Taxa Sistema)</p>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 w-full py-3 bg-green-600 dark:bg-green-500 text-white rounded-xl font-black text-xs uppercase hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
              >
                Recarregar Página
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
                <h4 className="text-lg font-black text-red-900 dark:text-red-200">Erro na Limpeza</h4>
              </div>
              <p className="text-sm text-red-800 dark:text-red-300">{results.error}</p>
              <button
                onClick={() => setResults(null)}
                className="mt-4 w-full py-3 bg-red-600 dark:bg-red-500 text-white rounded-xl font-black text-xs uppercase hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Tentar Novamente
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}