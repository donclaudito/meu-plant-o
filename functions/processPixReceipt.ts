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
    const pixDate = pixData.date;

    // Get all shifts for the user
    const allShifts = await base44.asServiceRole.entities.Shift.filter({
      created_by: user.email
    });

    // Filter shifts by doctor, month and year
    const monthShifts = allShifts.filter(s => {
      if (s.doctorName.toUpperCase() !== doctorName.toUpperCase()) return false;
      
      const [year_str, month_str] = s.date.split('-');
      const shiftYear = parseInt(year_str);
      const shiftMonth = parseInt(month_str);
      return shiftYear === year && shiftMonth === month;
    });

    if (monthShifts.length === 0) {
      return Response.json({ 
        error: 'No shifts found for this doctor in the specified month',
        pixValue,
        pixDate
      }, { status: 400 });
    }

    // Calculate gross total
    const grossTotal = monthShifts.reduce((sum, s) => sum + (s.value || 0), 0);

    // Create ManualPayment record
    const manualPayment = await base44.entities.ManualPayment.create({
      date: pixDate.includes('-') ? pixDate : pixDate.split('/').reverse().join('-'),
      value: pixValue,
      description: `Pagamento PIX - ${doctorName} (${month}/${year})`
    });

    return Response.json({
      success: true,
      pixValue,
      grossTotal,
      pendingValue: Math.max(0, grossTotal - pixValue),
      shiftsCount: monthShifts.length,
      manualPayment
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});