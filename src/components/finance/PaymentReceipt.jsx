import React, { useState } from 'react';
import { FileText, Copy, Printer, Share2, X } from 'lucide-react';

export default function PaymentReceipt({ stats, globalDiscounts, filteredShifts, extraIncomes, currentMonth, currentYear, user }) {
  const [showReceipt, setShowReceipt] = useState(false);
  const [copied, setCopied] = useState(false);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const generateReceiptText = () => {
    const date = new Date().toLocaleDateString('pt-BR');
    const period = `${monthNames[currentMonth]} ${currentYear}`;
    
    let text = `
═══════════════════════════════════════
           COMPROVANTE DE PAGAMENTO
═══════════════════════════════════════

Médico: ${user?.full_name || 'Não informado'}
Período: ${period}
Data de emissão: ${date}

───────────────────────────────────────
           DETALHAMENTO DE RECEITAS
───────────────────────────────────────

Plantões Realizados:
  • Quantidade: ${stats.count} plantões
  • Total Horas: ${stats.hours}h
  • Valor Bruto: R$ ${stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${extraIncomes.filter(i => {
  const incomeDate = new Date(i.date);
  return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
}).length > 0 ? `
Receitas Extras:
${extraIncomes.filter(i => {
  const incomeDate = new Date(i.date);
  return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
}).map(income => `  • ${income.type}: R$ ${Number(income.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`).join('\n')}
  • Total Receitas Extras: R$ ${stats.totalExtraIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : ''}
RECEITA BRUTA TOTAL: R$ ${stats.grossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

${globalDiscounts.length > 0 ? `
───────────────────────────────────────
              DESCONTOS APLICADOS
───────────────────────────────────────

${globalDiscounts.map(d => {
  const isPercentage = d.isPercentage === true;
  const discountValue = isPercentage 
    ? (stats.total * d.value / 100)
    : d.value;
  return `${d.description}:
  ${isPercentage ? `${d.value}% sobre plantões` : `Valor fixo`}
  - R$ ${discountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}).join('\n\n')}

TOTAL DE DESCONTOS: - R$ ${stats.totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
` : ''}
───────────────────────────────────────
           VALOR LÍQUIDO A RECEBER
───────────────────────────────────────

         R$ ${stats.netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}

═══════════════════════════════════════
  Este é um comprovante informativo
  Gerado por: Meu Plantão
═══════════════════════════════════════
`;
    return text;
  };

  const copyToClipboard = () => {
    const text = generateReceiptText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const printReceipt = () => {
    const text = generateReceiptText();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante de Pagamento</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 40px;
              white-space: pre-wrap;
              line-height: 1.6;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>${text}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const shareViaWhatsApp = () => {
    const text = generateReceiptText();
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
          <FileText className="text-purple-600 dark:text-purple-400" /> Comprovante de Pagamento
        </h3>
        {!showReceipt && (
          <button
            onClick={() => setShowReceipt(true)}
            className="flex items-center gap-2 bg-purple-600 dark:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors shadow-lg"
          >
            <FileText size={18} /> Gerar Holerite
          </button>
        )}
      </div>

      {showReceipt && (
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{generateReceiptText()}</pre>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Copy size={16} /> {copied ? 'Copiado!' : 'Copiar'}
            </button>

            <button
              onClick={printReceipt}
              className="flex items-center gap-2 bg-slate-600 dark:bg-slate-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
            >
              <Printer size={16} /> Imprimir
            </button>

            <button
              onClick={shareViaWhatsApp}
              className="flex items-center gap-2 bg-green-600 dark:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
            >
              <Share2 size={16} /> Enviar WhatsApp
            </button>

            <button
              onClick={() => setShowReceipt(false)}
              className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors ml-auto"
            >
              <X size={16} /> Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}