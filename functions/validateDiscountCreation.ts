import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { description, value, isPercentage, type } = await req.json();

    if (!description || value === undefined) {
      return Response.json({ error: 'Descrição e valor são obrigatórios' }, { status: 400 });
    }

    // Normalizar a descrição fornecida
    const normalizedInput = description
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Verificar se já existe um desconto com esta descrição (case-insensitive)
    const allDiscounts = await base44.entities.Discount.list();
    
    const duplicate = allDiscounts.find(discount => {
      const existingNormalized = (discount.description || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      
      return existingNormalized === normalizedInput;
    });

    if (duplicate) {
      return Response.json({ 
        error: 'Já existe um desconto com esta descrição (ignorando maiúsculas/minúsculas)',
        existingDiscount: duplicate.description
      }, { status: 409 });
    }

    // Criar o desconto
    const newDiscount = await base44.entities.Discount.create({
      description,
      value,
      isPercentage: isPercentage || false,
      type: type || '',
      date: new Date().toISOString().split('T')[0]
    });

    return Response.json({
      success: true,
      discount: newDiscount
    });

  } catch (error) {
    console.error('Erro ao validar/criar desconto:', error);
    return Response.json({ 
      error: 'Erro ao criar desconto', 
      details: error.message 
    }, { status: 500 });
  }
});