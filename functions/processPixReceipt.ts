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

    // Get shifts for the doctor in the specified month
    const shifts = await base44.asServiceRole.entities.Shift.filter({
      doctorName: doctorName,
      created_by: user.email
    });

    // Filter shifts from the specified month
    const monthShifts = shifts.filter(s => {
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

    // Calculate discount
    const discount = grossTotal - pixValue;

    // Create ManualPayment record
    const manualPayment = await base44.entities.ManualPayment.create({
      date: pixDate.includes('-') ? pixDate : pixDate.split('/').reverse().join('-'),
      value: pixValue,
      description: `Pagamento PIX - ${doctorName}`
    });

    // Create Discount record
    const discountRecord = await base44.entities.Discount.create({
      date: new Date().toISOString().split('T')[0],
      type: 'PIX Desconto',
      description: `Desconto calculado de recibo PIX de ${doctorName} - ${month}/${year}`,
      value: Math.max(0, discount)
    });

    return Response.json({
      success: true,
      pixValue,
      grossTotal,
      discount: Math.max(0, discount),
      shiftsCount: monthShifts.length,
      manualPayment,
      discountRecord
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});