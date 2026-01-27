import React, { useState } from 'react';
import { Download, FileText, CheckCircle } from 'lucide-react';

export default function DoctorPDFExport({ shifts, doctors, extraIncomes, discounts, user }) {
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportDoctorPDF = () => {
    if (!selectedDoctor) return;

    setExporting(true);

    const doctorShifts = shifts.filter(s => s.doctorName === selectedDoctor);
    const doctorInfo = doctors.find(d => d.name === selectedDoctor);

    const shift6hValue = Number(user?.shift6hValue) || 1000;
    const shift12hValue = Number(user?.shift12hValue) || 1800;
    const shift24hValue = Number(user?.shift24hValue) || 3000;
    const baseHourlyRate = Number(user?.hourlyRate) || 150;

    let totalRevenue = 0;
    let totalHours = 0;
    let paidRevenue = 0;
    let pendingRevenue = 0;

    doctorShifts.forEach(shift => {
      const hours = Number(shift.hours) || 0;
      let value = Number(shift.value) || 0;

      if (value === 0) {
        if (hours === 24) value = shift24hValue;
        else if (hours === 12) value = shift12hValue;
        else if (hours === 6) value = shift6hValue;
        else value = baseHourlyRate * hours;
      }

      totalRevenue += value;
      totalHours += hours;

      if (shift.paid) {
        paidRevenue += value;
      } else {
        pendingRevenue += value;
      }
    });

    const doctorExtraIncomes = extraIncomes.filter(income => 
      income.description && income.description.toLowerCase().includes(selectedDoctor.toLowerCase())
    );

    const totalExtraIncome = doctorExtraIncomes.reduce((acc, income) => acc + (Number(income.value) || 0), 0);

    const globalDiscounts = discounts.filter(d => !d.type || d.type === '');
    const totalDiscounts = globalDiscounts.reduce((acc, d) => {
      const isPercentage = d.isPercentage === true;
      if (isPercentage) {
        return acc + (totalRevenue * (Number(d.value) || 0) / 100);
      }
      return acc + (Number(d.value) || 0);
    }, 0);

    const netTotal = Math.max(0, totalRevenue + totalExtraIncome - totalDiscounts);
    const hourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Individual - ${selectedDoctor}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #1e293b;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white;
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            margin: 5px 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .stat-card {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
          }
          .stat-label {
            font-size: 11px;
            color: #64748b;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #1e293b;
          }
          .section {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1e293b;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          th {
            background: #f8fafc;
            font-weight: bold;
            color: #475569;
            font-size: 11px;
            text-transform: uppercase;
          }
          tr:hover {
            background: #f8fafc;
          }
          .summary-box {
            background: linear-gradient(135deg, #ecfdf5, #d1fae5);
            border: 2px solid #22c55e;
            padding: 25px;
            border-radius: 15px;
            margin-top: 30px;
          }
          .summary-box h3 {
            margin: 0 0 15px 0;
            color: #166534;
            font-size: 20px;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          .summary-item {
            text-align: center;
          }
          .summary-label {
            font-size: 11px;
            color: #166534;
            font-weight: bold;
            text-transform: uppercase;
          }
          .summary-value {
            font-size: 28px;
            font-weight: bold;
            color: #166534;
            margin-top: 5px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #64748b;
            font-size: 11px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Relatório Individual de Desempenho</h1>
          <p><strong>Médico:</strong> ${selectedDoctor}</p>
          ${doctorInfo ? `<p><strong>Especialidade:</strong> ${doctorInfo.specialty}</p>` : ''}
          ${doctorInfo?.phone ? `<p><strong>Telefone:</strong> ${doctorInfo.phone}</p>` : ''}
          <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total de Plantões</div>
            <div class="stat-value">${doctorShifts.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Horas Trabalhadas</div>
            <div class="stat-value">${totalHours}h</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Receita Bruta</div>
            <div class="stat-value">R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Taxa Horária</div>
            <div class="stat-value">R$ ${hourlyRate.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📊 Status de Pagamentos</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 15px;">
            <div style="background: #dcfce7; padding: 20px; border-radius: 12px; border: 2px solid #22c55e;">
              <div class="stat-label" style="color: #166534;">Valores Pagos</div>
              <div style="font-size: 24px; font-weight: bold; color: #16a34a; margin-top: 5px;">
                R$ ${paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border: 2px solid #f59e0b;">
              <div class="stat-label" style="color: #92400e;">Valores Pendentes</div>
              <div style="font-size: 24px; font-weight: bold; color: #d97706; margin-top: 5px;">
                R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">📋 Detalhamento de Plantões</div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Hospital</th>
                <th>Tipo</th>
                <th>Horas</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${doctorShifts.sort((a, b) => a.date.localeCompare(b.date)).map(shift => `
                <tr>
                  <td>${new Date(shift.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td>${shift.unit}</td>
                  <td>${shift.type}</td>
                  <td>${shift.hours}h</td>
                  <td>R$ ${shift.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>${shift.paid ? '✅ Pago' : '⏳ Pendente'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${doctorExtraIncomes.length > 0 ? `
          <div class="section">
            <div class="section-title">💰 Receitas Extras</div>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                ${doctorExtraIncomes.map(income => `
                  <tr>
                    <td>${new Date(income.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>${income.type}</td>
                    <td>${income.description}</td>
                    <td>R$ ${income.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="summary-box">
          <h3>💵 Resumo Financeiro Final</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Receita de Plantões</div>
              <div class="summary-value">R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
            </div>
            ${totalExtraIncome > 0 ? `
              <div class="summary-item">
                <div class="summary-label">+ Receitas Extras</div>
                <div class="summary-value">R$ ${totalExtraIncome.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
              </div>
            ` : ''}
            ${totalDiscounts > 0 ? `
              <div class="summary-item">
                <div class="summary-label">- Descontos</div>
                <div class="summary-value">R$ ${totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
              </div>
            ` : ''}
            <div class="summary-item">
              <div class="summary-label">💚 Líquido Total</div>
              <div class="summary-value">R$ ${netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Relatório gerado automaticamente por Meu Plantão</p>
          <p>Este documento é apenas informativo e não substitui documentos oficiais</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
      setExporting(false);
    }, 500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="text-blue-600 dark:text-blue-400" size={24} />
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Exportar Relatório Individual em PDF
        </h3>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-800">
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 font-medium">
          Selecione um médico para gerar um relatório completo e detalhado com todos os plantões, receitas e estatísticas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1 block mb-2">
              Selecionar Médico
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500"
            >
              <option value="">Escolher médico...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={exportDoctorPDF}
              disabled={!selectedDoctor || exporting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {exporting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Gerando PDF...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Gerar Relatório PDF
                </>
              )}
            </button>
          </div>
        </div>

        {selectedDoctor && (
          <div className="mt-4 p-4 bg-white dark:bg-slate-700 rounded-xl">
            <div className="flex items-start gap-3">
              <CheckCircle className="text-green-600 dark:text-green-400 mt-1" size={20} />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Médico Selecionado: {selectedDoctor}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  O relatório incluirá todos os plantões, receitas extras, estatísticas de desempenho e resumo financeiro completo.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}