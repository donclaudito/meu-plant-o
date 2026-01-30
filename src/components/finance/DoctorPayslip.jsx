import React, { useMemo, useState } from 'react';
import { FileText, Stethoscope, ChevronDown, ChevronUp, Award } from 'lucide-react';

export default function DoctorPayslip({ doctorName, shifts, extraIncomes, discounts, doctorDiscount, doctorDiscountReason, currentMonth, currentYear, filters, isApproved }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const normalizeDoctorName = (name) => {
    if (!name) return '';
    return name.trim().toUpperCase().replace(/^DR\.\s*/i, '').replace(/^DRA\.\s*/i, '');
  };
  
  const summary = useMemo(() => {
    // Filtrar shifts do médico (normalizado - sem prefixo)
    const normalizedFilterName = normalizeDoctorName(doctorName);
    const doctorShifts = shifts.filter(s => 
      normalizeDoctorName(s.doctorName) === normalizedFilterName
    );
    
    // Filtrar receitas extras do médico (normalizado - sem prefixo)
    const doctorExtras = extraIncomes.filter(e => 
      normalizeDoctorName(e.doctorName) === normalizedFilterName
    );
    
    // Total BRUTO de plantões (usar grossValue ou value)
    const totalShiftsBruto = doctorShifts.reduce((acc, s) => 
      acc + (Number(s.grossValue) || Number(s.value) || 0), 0
    );
    
    // Total de receitas extras
    const totalExtras = doctorExtras.reduce((acc, e) => 
      acc + (Number(e.value) || 0), 0
    );
    
    // Total BRUTO (Plantões + Extras)
    const totalBruto = totalShiftsBruto + totalExtras;
    
    // Cálculo CORRETO: Imposto sobre BRUTO (Plantões + Extras) * 15%
    const impostoCalculado = totalBruto * 0.15;
    
    // Outros descontos (Contador, etc.) - Desconto total MENOS o imposto já calculado
    const outrosDescontos = Math.max(0, (Number(discounts) || 0) - impostoCalculado);

    // Desconto personalizado do médico
    const personalDiscount = Number(doctorDiscount) || 0;

    // Valor Líquido = Bruto - (Imposto + Contador + Desconto Adicional)
    const netTotal = Math.max(0, totalBruto - impostoCalculado - outrosDescontos - personalDiscount);
    
    return {
      doctorShifts,
      doctorExtras,
      totalShiftsBruto,
      totalExtras,
      totalBruto,
      impostoCalculado,
      outrosDescontos,
      personalDiscount,
      netTotal
    };
  }, [doctorName, shifts, extraIncomes, discounts, doctorDiscount]);

  if (!doctorName || doctorName === 'TODOS') {
    return null;
  }

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Obter o médico completo da lista para ter acesso ao CRM
  const doctor = shifts.find(s => s.doctorName?.toUpperCase() === doctorName.toUpperCase());

  const auditId = Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-300 shadow-2xl mb-6 payslip-container">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .payslip-container, .payslip-container * { visibility: visible; }
          .payslip-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 40px !important;
          }
          .no-print { display: none !important; }
          * { background: white !important; color: black !important; }
          h1, h2, h3, h4, p, span, div { color: black !important; }
        }
      `}</style>

      {/* CABEÇALHO PROFISSIONAL */}
      <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-300 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Award size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-1">CONTRACHEQUE HOSPITALAR</h2>
              <p className="text-lg text-slate-700 font-bold">{doctorName}</p>
              <p className="text-sm text-slate-600 font-bold flex items-center gap-2">
                <Stethoscope size={16} /> CRM: {doctor?.crm || 'Não informado'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Referência</p>
            <p className="text-2xl font-black text-slate-900">{monthNames[currentMonth]} {currentYear}</p>
            <p className="text-xs text-slate-600 mt-1">
              Período: 01/{String(currentMonth + 1).padStart(2, '0')} a {new Date(currentYear, currentMonth + 1, 0).getDate()}/{String(currentMonth + 1).padStart(2, '0')}/{currentYear}
            </p>
          </div>
        </div>
      </div>

      {/* CORPO - TABELA DE RECEITAS */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl mb-6 overflow-hidden">
        <div className="bg-slate-200 px-6 py-3 border-b-2 border-slate-300">
          <h3 className="text-lg font-black text-slate-900">📋 RECEITAS DO PERÍODO</h3>
        </div>
        
        {/* Plantões */}
        <div className="p-6">
          <h4 className="text-sm font-black text-slate-900 mb-3 uppercase flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            Plantões Realizados ({summary.doctorShifts.length})
          </h4>
          {summary.doctorShifts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 font-black text-slate-700">DATA</th>
                  <th className="text-left py-2 font-black text-slate-700">LOCAL</th>
                  <th className="text-left py-2 font-black text-slate-700">TIPO</th>
                  <th className="text-right py-2 font-black text-slate-700">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {summary.doctorShifts.map(shift => (
                  <tr key={shift.id} className="border-b border-slate-200">
                    <td className="py-2 font-bold text-slate-900">
                      {new Date(shift.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="py-2 text-slate-700">{shift.unit}</td>
                    <td className="py-2 text-slate-700">{shift.type}</td>
                    <td className="py-2 text-right font-black text-blue-600">
                      R$ {(Number(shift.grossValue) || Number(shift.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan="3" className="py-3 font-black text-slate-900 uppercase">Subtotal Plantões:</td>
                  <td className="py-3 text-right font-black text-blue-600 text-lg">
                    R$ {summary.totalShiftsBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 italic py-4">Nenhum plantão registrado</p>
          )}
        </div>

        {/* Receitas Extras */}
        {summary.doctorExtras.length > 0 && (
          <div className="p-6 border-t-2 border-slate-300">
            <h4 className="text-sm font-black text-slate-900 mb-3 uppercase flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Receitas Extras ({summary.doctorExtras.length})
            </h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 font-black text-slate-700">DATA</th>
                  <th className="text-left py-2 font-black text-slate-700">ITEM</th>
                  <th className="text-left py-2 font-black text-slate-700">DESCRIÇÃO</th>
                  <th className="text-right py-2 font-black text-slate-700">VALOR</th>
                </tr>
              </thead>
              <tbody>
                {summary.doctorExtras.map(extra => (
                  <tr key={extra.id} className="border-b border-slate-200">
                    <td className="py-2 font-bold text-slate-900">
                      {new Date(extra.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                    </td>
                    <td className="py-2 text-slate-700">{extra.type}</td>
                    <td className="py-2 text-slate-700 text-xs">{extra.description || '-'}</td>
                    <td className="py-2 text-right font-black text-green-600">
                      + R$ {(Number(extra.value) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan="3" className="py-3 font-black text-slate-900 uppercase">Subtotal Extras:</td>
                  <td className="py-3 text-right font-black text-green-600 text-lg">
                    + R$ {summary.totalExtras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TOTAL BRUTO */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border-2 border-blue-300 mb-6">
        <div className="flex justify-between items-center">
          <p className="text-sm font-black text-blue-900 uppercase tracking-widest">💵 Total Bruto (Plantões + Extras)</p>
          <span className="text-4xl font-black text-blue-700">
            R$ {summary.totalBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SEÇÃO DE DESCONTOS */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl mb-6 overflow-hidden">
        <div className="bg-slate-200 px-6 py-3 border-b-2 border-slate-300">
          <h3 className="text-lg font-black text-slate-900">📉 DESCONTOS APLICADOS</h3>
        </div>
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="text-left py-2 font-black text-slate-700">DESCRIÇÃO</th>
                <th className="text-right py-2 font-black text-slate-700">VALOR</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-2 text-slate-700">Impostos (15% sobre Bruto Total)</td>
                <td className="py-2 text-right font-black text-red-600">
                  - R$ {summary.impostoCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {summary.outrosDescontos > 0 && (
                <tr className="border-b border-slate-200">
                  <td className="py-2 text-slate-700">Contador / Outros Descontos Fixos</td>
                  <td className="py-2 text-right font-black text-red-600">
                    - R$ {summary.outrosDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              {summary.personalDiscount > 0 && (
                <tr className="border-b border-slate-200 bg-amber-50">
                  <td className="py-3 text-slate-900 font-bold">
                    Desconto Adicional (Ajuste ADM)
                    <br />
                    <span className="text-xs text-amber-700 font-normal">Motivo: {doctorDiscountReason || 'Não informado'}</span>
                  </td>
                  <td className="py-3 text-right font-black text-red-600">
                    - R$ {summary.personalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr className="bg-slate-100 border-t-2 border-slate-300">
                <td className="py-3 font-black text-slate-900 uppercase">Total de Descontos:</td>
                <td className="py-3 text-right font-black text-red-600 text-lg">
                  - R$ {(summary.impostoCalculado + summary.outrosDescontos + summary.personalDiscount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Líquido Final */}
      <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-8 rounded-2xl border-2 border-green-400 mt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-black text-green-900 uppercase tracking-widest">💰 Valor Líquido a Receber</p>
            <p className="text-sm text-green-800 mt-2 font-bold">Bruto - (Imposto + Contador + Ajustes)</p>
          </div>
          <span className="text-5xl font-black text-green-700">
            R$ {summary.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* RODAPÉ DE AUTORIDADE */}
      {isApproved && (
        <div className="bg-white border-2 border-green-500 rounded-2xl p-6 mt-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <CheckCircle size={32} className="text-green-600" />
            <h4 className="text-2xl font-black text-green-900">✅ AUDITADO E ASSINADO</h4>
          </div>
          <p className="text-lg font-bold text-slate-900">DR. LAVOISIER (ADM MASTER)</p>
          <p className="text-sm text-slate-600 mt-2">ID de Autenticação: {auditId}</p>
          <p className="text-xs text-slate-500 mt-1">Data: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
        </div>
      )}

      {/* Botão de Impressão */}
      <div className="mt-6 text-center no-print">
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-lg uppercase shadow-lg transition-all"
        >
          🖨️ Imprimir / Salvar PDF
        </button>
      </div>
    </div>
  );
}