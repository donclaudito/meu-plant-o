import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const results = {
      discountsRemoved: 0,
      doctorsUpdated: 0,
      details: []
    };

    // 1. Limpar descontos duplicados
    const discounts = await base44.asServiceRole.entities.Discount.list();
    const discountMap = new Map();

    for (const discount of discounts) {
      const normalizedName = (discount.description || '').trim().toLowerCase();
      
      if (normalizedName) {
        if (!discountMap.has(normalizedName)) {
          discountMap.set(normalizedName, discount);
        } else {
          // Desconto duplicado - deletar
          await base44.asServiceRole.entities.Discount.delete(discount.id);
          results.discountsRemoved++;
          results.details.push(`Desconto duplicado removido: ${discount.description}`);
        }
      }
    }

    // 2. Normalizar e deduplicar médicos
    const doctors = await base44.asServiceRole.entities.Doctor.list();
    const doctorMap = new Map();

    const normalizeName = (name) => {
      return name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/\s+/g, ' '); // Remove espaços extras
    };

    const toTitleCase = (name) => {
      return name
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    for (const doctor of doctors) {
      const normalizedName = normalizeName(doctor.name);
      
      if (!doctorMap.has(normalizedName)) {
        // Primeiro médico com este nome normalizado - atualizar para Title Case
        const titleCaseName = toTitleCase(doctor.name);
        if (doctor.name !== titleCaseName) {
          await base44.asServiceRole.entities.Doctor.update(doctor.id, {
            name: titleCaseName
          });
          results.doctorsUpdated++;
          results.details.push(`Médico atualizado: ${doctor.name} → ${titleCaseName}`);
        }
        doctorMap.set(normalizedName, doctor);
      } else {
        // Médico duplicado - deletar
        await base44.asServiceRole.entities.Doctor.delete(doctor.id);
        results.doctorsUpdated++;
        results.details.push(`Médico duplicado removido: ${doctor.name}`);
      }
    }

    return Response.json({
      success: true,
      message: 'Limpeza concluída com sucesso',
      results
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});