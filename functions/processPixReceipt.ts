import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl, doctorName, month, year } = body;

    if (!fileUrl || !doctorName || !month || !year) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract data from receipt using AI
    const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url: fileUrl,
      json_schema: {
        type: "object",
        properties: {
          value: { 
            type: "number", 
            description: "Valor do pagamento PIX em Reais (número). Ex: 16040.00"
          },
          date: { 
            type: "string", 
            description: "Data do pagamento no formato DD/MM/YYYY ou YYYY-MM-DD"
          },
          payerName: {
            type: "string",
            description: "Nome completo de quem enviou o PIX (pagador)"
          }
        },
        required: ["value", "date"]
      }
    });

    if (extractResult.status !== 'success' || !extractResult.output) {
      return Response.json({ error: 'Failed to extract data from receipt' }, { status: 400 });
    }

    const pixData = extractResult.output;
    const pixValue = Number(pixData.value);
    const payerName = pixData.payerName || 'Não identificado';
    
    // Use the first day of the selected month/year for consistency
    const depositDate = `${year}-${String(month).padStart(2, '0')}-01`;

    // Get all shifts for the user (note: list() returns array directly)
    const allShiftsRaw = await base44.asServiceRole.entities.Shift.list();
    const userShifts = allShiftsRaw.filter(s => s.created_by === user.email);

    // Filter shifts by doctor, month and year
    const monthShifts = userShifts.filter(s => {
      // Normalize both names: remove extra spaces, convert to uppercase, remove leading spaces
      const normalizedShiftName = s.doctorName.replace(/\s+/g, ' ').trim().toUpperCase();
      const normalizedDoctorName = doctorName.replace(/\s+/g, ' ').trim().toUpperCase();
      
      // Extract first name (before first space) for comparison
      const firstNameShift = normalizedShiftName.split(' ')[0];
      const firstNameDoctor = normalizedDoctorName.split(' ')[0];
      
      // Match if first names are the same (handles "claudio", "Claudio M", " Claudio", etc.)
      const nameMatch = firstNameShift === firstNameDoctor;
      
      if (!nameMatch) return false;
      
      const [year_str, month_str] = s.date.split('-');
      const shiftYear = parseInt(year_str);
      const shiftMonth = parseInt(month_str);
      return shiftYear === year && shiftMonth === month;
    });

    if (monthShifts.length === 0) {
      return Response.json({ 
        error: 'No shifts found for this doctor in the specified month',
        pixValue,
        payerName,
        debug: {
          searchingFor: doctorName,
          foundShiftsTotal: userShifts.length,
          uniqueDoctors: [...new Set(userShifts.map(s => s.doctorName))]
        }
      }, { status: 400 });
    }

    // Calculate gross total
    const grossTotal = monthShifts.reduce((sum, s) => sum + (s.value || 0), 0);

    // Calculate discount
    const discountValue = Math.max(0, grossTotal - pixValue);

    // Create Deposit record
    const deposit = await base44.entities.Deposit.create({
      date: depositDate,
      value: pixValue,
      description: `PIX de ${payerName} - ${doctorName} (${month}/${year})`
    });

    // Create Discount record if there's a discount
    let discount = null;
    if (discountValue > 0) {
      discount = await base44.entities.Discount.create({
        date: depositDate,
        type: 'Desconto PIX',
        description: `${doctorName} (${month}/${year}) - Bruto: R$ ${grossTotal.toFixed(2)} | Líquido: R$ ${pixValue.toFixed(2)}`,
        value: discountValue
      });
    }

    return Response.json({
      success: true,
      pixValue,
      grossTotal,
      discountValue,
      netTotal: pixValue,
      payerName,
      shiftsCount: monthShifts.length,
      deposit,
      discount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});