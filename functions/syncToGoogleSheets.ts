import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month, year } = await req.json();

    // Get access token for Google Sheets
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Fetch shifts filtered by month/year
    const allShifts = await base44.entities.Shift.list('-date');
    const shifts = allShifts.filter(s => {
      const [shiftYear, shiftMonth] = s.date.split('-').map(Number);
      return s.created_by === user.email && 
             shiftMonth === month && 
             shiftYear === year;
    });

    if (shifts.length === 0) {
      return Response.json({ error: 'Nenhum plantão encontrado para o período selecionado' }, { status: 400 });
    }

    // Create spreadsheet
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const title = `Plantões - ${monthNames[month - 1]} ${year}`;

    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [{
          properties: { title: 'Plantões' }
        }]
      })
    });

    const spreadsheet = await createResponse.json();
    const spreadsheetId = spreadsheet.spreadsheetId;

    // Prepare data
    const headers = ['Data', 'Hospital', 'Médico', 'Especialidade', 'Tipo', 'Horas', 'Valor (€)', 'Status'];
    const rows = shifts.map(s => [
      new Date(s.date + 'T00:00:00').toLocaleDateString('pt-PT'),
      s.unit,
      s.doctorName,
      s.specialty,
      s.type,
      s.hours,
      s.value.toFixed(2),
      s.paid ? 'Pago' : 'Pendente'
    ]);

    // Calculate totals
    const totalHours = shifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    const totalValue = shifts.reduce((sum, s) => sum + (s.value || 0), 0);
    const totalPaid = shifts.filter(s => s.paid).reduce((sum, s) => sum + (s.value || 0), 0);
    const totalPending = totalValue - totalPaid;

    rows.push([]);
    rows.push(['TOTAIS', '', '', '', '', totalHours, totalValue.toFixed(2), '']);
    rows.push(['Total Pago', '', '', '', '', '', totalPaid.toFixed(2), '']);
    rows.push(['Total Pendente', '', '', '', '', '', totalPending.toFixed(2), '']);

    // Update spreadsheet with data
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Plantões!A1:H${rows.length + 1}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [headers, ...rows]
      })
    });

    // Format header row
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.4, blue: 0.8 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 8
              }
            }
          }
        ]
      })
    });

    return Response.json({
      success: true,
      spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      shiftCount: shifts.length
    });

  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});