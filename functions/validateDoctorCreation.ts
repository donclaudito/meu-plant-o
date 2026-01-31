import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { name, specialty, phone, pixAccountHolder, pixKey, pixKeyType } = await req.json();

    if (!name || !specialty) {
      return Response.json({ error: 'Nome e especialidade são obrigatórios' }, { status: 400 });
    }

    // Normalizar o nome fornecido
    const normalizedInput = name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^dr\.\s*/i, '')
      .replace(/^dra\.\s*/i, '');

    // Verificar se já existe um médico com este nome (case-insensitive)
    const allDoctors = await base44.entities.Doctor.list();
    
    const duplicate = allDoctors.find(doctor => {
      const existingNormalized = doctor.name
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/^dr\.\s*/i, '')
        .replace(/^dra\.\s*/i, '');
      
      return existingNormalized === normalizedInput;
    });

    if (duplicate) {
      return Response.json({ 
        error: 'Já existe um médico com este nome (ignorando maiúsculas/minúsculas)',
        existingDoctor: duplicate.name
      }, { status: 409 });
    }

    // Criar o médico
    const newDoctor = await base44.entities.Doctor.create({
      name,
      specialty,
      phone,
      pixAccountHolder,
      pixKey,
      pixKeyType
    });

    return Response.json({
      success: true,
      doctor: newDoctor
    });

  } catch (error) {
    console.error('Erro ao validar/criar médico:', error);
    return Response.json({ 
      error: 'Erro ao criar médico', 
      details: error.message 
    }, { status: 500 });
  }
});