import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Apenas admins podem convidar usuários
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Acesso negado. Apenas administradores podem convidar usuários.' }, { status: 403 });
    }

    const { email, role, name } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email é obrigatório' }, { status: 400 });
    }

    if (!role || (role !== 'admin' && role !== 'user')) {
      return Response.json({ error: 'Role deve ser "admin" ou "user"' }, { status: 400 });
    }

    // Convidar o usuário
    await base44.users.inviteUser(email, role);

    return Response.json({ 
      success: true, 
      message: `Convite enviado para ${email} com papel ${role}`,
      email,
      role,
      name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});