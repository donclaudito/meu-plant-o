import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { spreadsheetId } = await req.json();

    if (!spreadsheetId) {
      return Response.json({ error: 'ID da planilha é obrigatório' }, { status: 400 });
    }

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Read data from spreadsheet
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:H`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'Erro ao ler planilha', details: error }, { status: 500 });
    }

    const data = await response.json();
    const rows = data.values || [];

    if (rows.length < 2) {
      return Response.json({ error: 'Planilha vazia ou sem dados' }, { status: 400 });
    }

    // Parse headers
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dateIndex = headers.findIndex(h => h === 'data' || h === 'date');
    const unitIndex = headers.findIndex(h => h === 'hospital' || h === 'unit' || h === 'unidade');
    const doctorIndex = headers.findIndex(h => h === 'médico' || h === 'doctor' || h === 'doctorname');
    const specialtyIndex = headers.findIndex(h => h === 'especialidade' || h === 'specialty');
    const typeIndex = headers.findIndex(h => h === 'tipo' || h === 'type');
    const hoursIndex = headers.findIndex(h => h === 'horas' || h === 'hours');
    const valueIndex = headers.findIndex(h => h.includes('valor') || h === 'value');
    const statusIndex = headers.findIndex(h => h === 'status' || h === 'paid' || h === 'pago');

    if (dateIndex === -1 || unitIndex === -1 || doctorIndex === -1 || specialtyIndex === -1) {
      return Response.json({ 
        error: 'Planilha deve conter colunas: Data, Hospital, Médico, Especialidade' 
      }, { status: 400 });
    }

    // Parse shifts
    const shifts = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[dateIndex] || !row[unitIndex] || !row[doctorIndex]) continue;

      // Parse date (handle both DD/MM/YYYY and YYYY-MM-DD)
      let dateStr = row[dateIndex];
      if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      // Parse value (remove currency symbols)
      const valueStr = row[valueIndex] || '0';
      const value = parseFloat(valueStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;

      // Parse hours
      const hours = parseFloat(row[hoursIndex]) || 12;

      // Parse paid status
      const statusStr = (row[statusIndex] || 'false').toLowerCase();
      const paid = statusStr === 'true' || statusStr === 'pago' || statusStr === 'sim';

      shifts.push({
        date: dateStr,
        unit: row[unitIndex],
        doctorName: row[doctorIndex],
        specialty: row[specialtyIndex] || 'OUTRA',
        type: row[typeIndex] || '12h Dia',
        value: value,
        hours: hours,
        paid: paid
      });
    }

    if (shifts.length === 0) {
      return Response.json({ error: 'Nenhum plantão válido encontrado' }, { status: 400 });
    }

    // Create shifts in database
    await base44.entities.Shift.bulkCreate(shifts);

    return Response.json({
      success: true,
      count: shifts.length
    });

  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});