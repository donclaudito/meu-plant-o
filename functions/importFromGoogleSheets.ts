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

    // Read data from spreadsheet - get more columns to ensure we capture all data
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google Sheets API error:', errorText);
      return Response.json({ 
        success: false,
        error: 'Erro ao ler planilha. Verifique se a planilha está compartilhada ou se você tem permissão de acesso.',
        details: errorText 
      }, { status: 500 });
    }

    const data = await response.json();
    const rows = data.values || [];
    
    console.log('Rows fetched from spreadsheet:', rows.length);

    if (rows.length < 2) {
      return Response.json({ 
        success: false,
        error: 'Planilha vazia ou sem dados. Certifique-se de que há pelo menos uma linha de cabeçalho e uma linha de dados.' 
      }, { status: 400 });
    }

    // Parse headers
    const headers = rows[0].map(h => String(h).toLowerCase().trim());
    console.log('Headers found:', headers);
    
    const dateIndex = headers.findIndex(h => h === 'data' || h === 'date');
    const unitIndex = headers.findIndex(h => h === 'hospital' || h === 'unit' || h === 'unidade');
    const doctorIndex = headers.findIndex(h => h === 'médico' || h === 'doctor' || h === 'doctorname' || h === 'nome');
    const specialtyIndex = headers.findIndex(h => h === 'especialidade' || h === 'specialty');
    const typeIndex = headers.findIndex(h => h === 'tipo' || h === 'type');
    const hoursIndex = headers.findIndex(h => h === 'horas' || h === 'hours');
    const valueIndex = headers.findIndex(h => h.includes('valor') || h === 'value' || h === 'preço' || h === 'preco');
    const statusIndex = headers.findIndex(h => h === 'status' || h === 'paid' || h === 'pago');

    console.log('Column indexes:', { dateIndex, unitIndex, doctorIndex, specialtyIndex, typeIndex, hoursIndex, valueIndex, statusIndex });

    if (dateIndex === -1 || unitIndex === -1 || doctorIndex === -1 || specialtyIndex === -1) {
      const missing = [];
      if (dateIndex === -1) missing.push('Data');
      if (unitIndex === -1) missing.push('Hospital');
      if (doctorIndex === -1) missing.push('Médico');
      if (specialtyIndex === -1) missing.push('Especialidade');
      
      return Response.json({ 
        success: false,
        error: `Colunas obrigatórias não encontradas: ${missing.join(', ')}. Colunas encontradas: ${headers.join(', ')}` 
      }, { status: 400 });
    }

    // Parse shifts
    const shifts = [];
    const errors = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Skip empty rows
      if (!row || row.length === 0 || !row[dateIndex]) {
        console.log(`Skipping empty row ${i + 1}`);
        continue;
      }
      
      if (!row[unitIndex] || !row[doctorIndex]) {
        errors.push(`Linha ${i + 1}: faltam dados obrigatórios`);
        continue;
      }

      try {
        // Parse date (handle both DD/MM/YYYY and YYYY-MM-DD)
        let dateStr = String(row[dateIndex]).trim();
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
          dateStr = `${year}-${month}-${day}`;
        }

        // Parse value (remove currency symbols and handle European format)
        const valueStr = String(row[valueIndex] || '0');
        const cleanValue = valueStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(cleanValue) || 0;

        // Parse hours
        const hours = parseFloat(row[hoursIndex]) || 12;

        // Parse paid status
        const statusStr = String(row[statusIndex] || 'false').toLowerCase();
        const paid = statusStr === 'true' || statusStr === 'pago' || statusStr === 'sim' || statusStr === 'yes';

        shifts.push({
          date: dateStr,
          unit: String(row[unitIndex]).trim(),
          doctorName: String(row[doctorIndex]).trim(),
          specialty: String(row[specialtyIndex] || 'OUTRA').trim(),
          type: String(row[typeIndex] || '12h Dia').trim(),
          value: value,
          hours: hours,
          paid: paid
        });
      } catch (error) {
        errors.push(`Linha ${i + 1}: ${error.message}`);
      }
    }

    console.log(`Parsed ${shifts.length} shifts, ${errors.length} errors`);

    if (shifts.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Nenhum plantão válido encontrado. ' + (errors.length > 0 ? 'Erros: ' + errors.join('; ') : '')
      }, { status: 400 });
    }

    // Create shifts in database
    const created = await base44.entities.Shift.bulkCreate(shifts);
    console.log(`Created ${created.length} shifts in database`);

    return Response.json({
      success: true,
      count: created.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error importing from Google Sheets:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});