import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores podem executar esta operação.' }, { status: 403 });
    }

    // Listar todos os descontos
    const allDiscounts = await base44.asServiceRole.entities.Discount.list();
    
    // Excluir todos os descontos existentes
    const deletedCount = allDiscounts.length;
    for (const discount of allDiscounts) {
      await base44.asServiceRole.entities.Discount.delete(discount.id);
    }

    // Recriar os 3 descontos padrão
    const defaultDiscounts = [
      {
        description: 'Imposto',
        value: 15,
        isPercentage: true,
        type: '',
        date: new Date().toISOString().split('T')[0]
      },
      {
        description: 'Contador',
        value: 500,
        isPercentage: false,
        type: '',
        date: new Date().toISOString().split('T')[0]
      },
      {
        description: 'Taxa Sistema',
        value: 300,
        isPercentage: false,
        type: '',
        date: new Date().toISOString().split('T')[0]
      }
    ];

    const createdDiscounts = [];
    for (const discount of defaultDiscounts) {
      const created = await base44.asServiceRole.entities.Discount.create(discount);
      createdDiscounts.push(created);
    }

    return Response.json({
      success: true,
      message: 'Reset de descontos concluído com sucesso',
      deletedCount,
      createdDiscounts: createdDiscounts.map(d => ({
        description: d.description,
        value: d.value,
        isPercentage: d.isPercentage
      }))
    });

  } catch (error) {
    console.error('Erro no reset de descontos:', error);
    return Response.json({ 
      error: 'Erro ao resetar descontos', 
      details: error.message 
    }, { status: 500 });
  }
});