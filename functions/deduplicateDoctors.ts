import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores podem executar esta operação.' }, { status: 403 });
    }

    // Listar todos os médicos
    const allDoctors = await base44.asServiceRole.entities.Doctor.list();
    
    // Normalizar e agrupar médicos duplicados
    const normalizedMap = new Map();
    
    allDoctors.forEach(doctor => {
      const normalized = doctor.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^dr\.\s*/i, '')
        .replace(/^dra\.\s*/i, '');
      
      if (!normalizedMap.has(normalized)) {
        normalizedMap.set(normalized, []);
      }
      normalizedMap.get(normalized).push(doctor);
    });

    const removedDoctors = [];
    const updatedShifts = [];

    // Para cada grupo de duplicatas, manter o primeiro e excluir os demais
    for (const [normalized, doctors] of normalizedMap.entries()) {
      if (doctors.length > 1) {
        const keepDoctor = doctors[0];
        const duplicates = doctors.slice(1);

        // Atualizar todos os shifts que referenciam médicos duplicados
        const allShifts = await base44.asServiceRole.entities.Shift.list();
        
        for (const shift of allShifts) {
          const shiftDoctorNormalized = shift.doctorName
            ?.trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/^dr\.\s*/i, '')
            .replace(/^dra\.\s*/i, '');

          if (shiftDoctorNormalized === normalized) {
            // Atualizar para usar o nome do médico mantido
            await base44.asServiceRole.entities.Shift.update(shift.id, {
              doctorName: keepDoctor.name
            });
            updatedShifts.push(shift.id);
          }
        }

        // Excluir médicos duplicados
        for (const duplicate of duplicates) {
          await base44.asServiceRole.entities.Doctor.delete(duplicate.id);
          removedDoctors.push(duplicate.name);
        }
      }
    }

    return Response.json({
      success: true,
      message: 'Desduplicação de médicos concluída com sucesso',
      removedDoctors,
      updatedShiftsCount: updatedShifts.length,
      uniqueDoctorsCount: normalizedMap.size
    });

  } catch (error) {
    console.error('Erro na desduplicação:', error);
    return Response.json({ 
      error: 'Erro ao desduplicar médicos', 
      details: error.message 
    }, { status: 500 });
  }
});