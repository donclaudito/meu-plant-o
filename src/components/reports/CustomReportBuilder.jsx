import React, { useState } from 'react';
import { FileText, Download, CheckSquare, Square } from 'lucide-react';

export default function CustomReportBuilder({ stats, shifts, doctors, hospitals }) {
  const [selectedMetrics, setSelectedMetrics] = useState({
    shifts: true,
    hours: true,
    total: true,
    paid: true,
    pending: true,
    grossTotal: true,
    extraIncome: true,
    discounts: true,
    netTotal: true,
    byDoctor: true,
    byHospital: true,
    byType: true,
  });

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const generateCustomReport = () => {
    let reportHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Personalizado - Meu Plantão</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #2563eb; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #1e293b; margin-top: 30px; font-size: 20px; }
          .metric-section { background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #3b82f6; }
          .metric-label { font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .metric-value { font-size: 28px; font-weight: bold; color: #1e293b; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #3b82f6; color: white; padding: 12px; text-align: left; font-size: 11px; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          tr:nth-child(even) { background: #f8fafc; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>📊 Relatório Personalizado</h1>
        <p style="color: #64748b; margin-bottom: 30px;">Gerado em ${new Date().toLocaleString('pt-PT')}</p>
    `;

    if (selectedMetrics.shifts || selectedMetrics.hours || selectedMetrics.total) {
      reportHTML += `<h2>Resumo Geral</h2><div class="grid">`;
      if (selectedMetrics.shifts) {
        reportHTML += `
          <div class="metric-section">
            <div class="metric-label">Total de Plantões</div>
            <div class="metric-value">${stats.count}</div>
          </div>
        `;
      }
      if (selectedMetrics.hours) {
        reportHTML += `
          <div class="metric-section">
            <div class="metric-label">Horas Trabalhadas</div>
            <div class="metric-value">${stats.hours}h</div>
          </div>
        `;
      }
      if (selectedMetrics.total) {
        reportHTML += `
          <div class="metric-section">
            <div class="metric-label">Faturamento Plantões</div>
            <div class="metric-value">€ ${stats.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      reportHTML += `</div>`;
    }

    if (selectedMetrics.grossTotal || selectedMetrics.extraIncome || selectedMetrics.discounts || selectedMetrics.netTotal) {
      reportHTML += `<h2>Análise Financeira</h2><div class="grid">`;
      if (selectedMetrics.grossTotal) {
        reportHTML += `
          <div class="metric-section">
            <div class="metric-label">Faturamento Bruto Total</div>
            <div class="metric-value">€ ${stats.grossTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      if (selectedMetrics.extraIncome) {
        reportHTML += `
          <div class="metric-section">
            <div class="metric-label">Receitas Extras</div>
            <div class="metric-value">€ ${stats.totalExtraIncome.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      if (selectedMetrics.discounts) {
        reportHTML += `
          <div class="metric-section">
            <div class="metric-label">Descontos</div>
            <div class="metric-value">€ ${stats.totalDiscounts.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      if (selectedMetrics.netTotal) {
        reportHTML += `
          <div class="metric-section" style="border-left-color: #10b981;">
            <div class="metric-label">Líquido Total</div>
            <div class="metric-value" style="color: #10b981;">€ ${stats.netTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      reportHTML += `</div>`;
    }

    if (selectedMetrics.paid || selectedMetrics.pending) {
      reportHTML += `<h2>Status de Pagamentos</h2><div class="grid">`;
      if (selectedMetrics.paid) {
        reportHTML += `
          <div class="metric-section" style="border-left-color: #10b981;">
            <div class="metric-label">Valores Pagos</div>
            <div class="metric-value" style="color: #10b981;">€ ${stats.paid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      if (selectedMetrics.pending) {
        reportHTML += `
          <div class="metric-section" style="border-left-color: #f59e0b;">
            <div class="metric-label">Valores Pendentes</div>
            <div class="metric-value" style="color: #f59e0b;">€ ${stats.pending.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
          </div>
        `;
      }
      reportHTML += `</div>`;
    }

    if (selectedMetrics.byDoctor && Object.keys(stats.byDoctor).length > 0) {
      reportHTML += `
        <h2>Desempenho por Médico</h2>
        <table>
          <thead>
            <tr>
              <th>Médico</th>
              <th>Especialidade</th>
              <th>Plantões</th>
              <th>Horas</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Pendente</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.byDoctor).map(([name, data]) => `
              <tr>
                <td><strong>${name}</strong></td>
                <td>${data.specialty}</td>
                <td>${data.count}</td>
                <td>${data.hours}h</td>
                <td>€ ${data.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                <td>€ ${data.paid.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
                <td>€ ${data.pending.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (selectedMetrics.byHospital && Object.keys(stats.byUnit).length > 0) {
      reportHTML += `
        <h2>Desempenho por Hospital</h2>
        <table>
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Plantões</th>
              <th>Horas</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.byUnit).map(([unit, data]) => `
              <tr>
                <td><strong>${unit}</strong></td>
                <td>${data.count}</td>
                <td>${data.hours}h</td>
                <td>€ ${data.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (selectedMetrics.byType && Object.keys(stats.byType).length > 0) {
      reportHTML += `
        <h2>Desempenho por Tipo de Plantão</h2>
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Quantidade</th>
              <th>Horas</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(stats.byType).map(([type, data]) => `
              <tr>
                <td><strong>${type}</strong></td>
                <td>${data.count}</td>
                <td>${data.hours}h</td>
                <td>€ ${data.total.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    reportHTML += `
        <div style="margin-top: 40px; text-align: center; color: #64748b; font-size: 11px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p>Relatório gerado automaticamente por Meu Plantão</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url);
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const metricsList = [
    { key: 'shifts', label: 'Total de Plantões', category: 'Geral' },
    { key: 'hours', label: 'Horas Trabalhadas', category: 'Geral' },
    { key: 'total', label: 'Faturamento Plantões', category: 'Geral' },
    { key: 'grossTotal', label: 'Faturamento Bruto Total', category: 'Financeiro' },
    { key: 'extraIncome', label: 'Receitas Extras', category: 'Financeiro' },
    { key: 'discounts', label: 'Descontos', category: 'Financeiro' },
    { key: 'netTotal', label: 'Líquido Total', category: 'Financeiro' },
    { key: 'paid', label: 'Valores Pagos', category: 'Pagamentos' },
    { key: 'pending', label: 'Valores Pendentes', category: 'Pagamentos' },
    { key: 'byDoctor', label: 'Desempenho por Médico', category: 'Análises' },
    { key: 'byHospital', label: 'Desempenho por Hospital', category: 'Análises' },
    { key: 'byType', label: 'Desempenho por Tipo', category: 'Análises' },
  ];

  const categories = [...new Set(metricsList.map(m => m.category))];

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-xl font-black mb-6 dark:text-white flex items-center gap-2">
        <FileText className="text-blue-600 dark:text-blue-400" /> Relatório Personalizado
      </h3>

      <div className="space-y-6">
        {categories.map(category => (
          <div key={category}>
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {metricsList
                .filter(m => m.category === category)
                .map(metric => (
                  <button
                    key={metric.key}
                    onClick={() => toggleMetric(metric.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                      selectedMetrics[metric.key]
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-600 dark:border-blue-500'
                        : 'bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {selectedMetrics[metric.key] ? (
                      <CheckSquare size={20} className="text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Square size={20} className="text-slate-400 dark:text-slate-500" />
                    )}
                    <span className={`text-sm font-bold ${
                      selectedMetrics[metric.key]
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {metric.label}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={generateCustomReport}
        className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-lg"
      >
        <Download size={18} /> Gerar e Imprimir Relatório
      </button>
    </div>
  );
}