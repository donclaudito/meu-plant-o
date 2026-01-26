import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { month, year } = await req.json();

    // Get Google Sheets access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

    // Fetch shifts for the user
    const allShifts = await base44.asServiceRole.entities.Shift.filter({
      created_by: user.email
    });

    // Filter by month/year if provided
    let shifts = allShifts;
    if (month !== undefined && year !== undefined) {
      shifts = allShifts.filter(s => {
        const [shiftYear, shiftMonth] = s.date.split('-').map(Number);
        return shiftMonth === month + 1 && shiftYear === year;
      });
    }

    // Sort by date
    shifts.sort((a, b) => a.date.localeCompare(b.date));

    // Create spreadsheet title
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const title = month !== undefined && year !== undefined
      ? `Plantões - ${monthNames[month]} ${year}`
      : `Plantões - ${user.full_name || user.email}`;

    // Create new spreadsheet
    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: title
        },
        sheets: [{
          properties: {
            title: 'Plantões',
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }]
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      return Response.json({ error: 'Erro ao criar planilha', details: error }, { status: 500 });
    }

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
      s.value,
      s.paid ? 'Pago' : 'Pendente'
    ]);

    const allRows = [headers, ...rows];

    // Add totals row
    const totalHours = shifts.reduce((sum, s) => sum + (s.hours || 0), 0);
    const totalValue = shifts.reduce((sum, s) => sum + (s.value || 0), 0);
    const paidValue = shifts.filter(s => s.paid).reduce((sum, s) => sum + (s.value || 0), 0);
    const pendingValue = shifts.filter(s => !s.paid).reduce((sum, s) => sum + (s.value || 0), 0);

    allRows.push([]);
    allRows.push(['TOTAIS', '', '', '', '', totalHours, totalValue, '']);
    allRows.push(['Pago', '', '', '', '', '', paidValue, '']);
    allRows.push(['Pendente', '', '', '', '', '', pendingValue, '']);

    // Write data to sheet
    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Plantões!A1:H${allRows.length}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: allRows
        })
      }
    );

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      return Response.json({ error: 'Erro ao escrever dados', details: error }, { status: 500 });
    }

    // Format the spreadsheet
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
                  backgroundColor: { red: 0.2, green: 0.4, blue: 0.9 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    fontSize: 11,
                    bold: true
                  },
                  horizontalAlignment: 'CENTER'
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
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
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: allRows.length - 3,
                endRowIndex: allRows.length
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    bold: true
                  },
                  backgroundColor: { red: 0.95, green: 0.95, blue: 0.95 }
                }
              },
              fields: 'userEnteredFormat(textFormat,backgroundColor)'
            }
          }
        ]
      })
    });

    return Response.json({
      success: true,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      shiftsCount: shifts.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});